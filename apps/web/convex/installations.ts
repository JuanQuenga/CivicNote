import { v } from "convex/values"

import { internalMutation } from "./_generated/server"
import {
  desiredSubscriptionDiff,
  jurisdictionForRegion,
  normalizeRegionCode,
} from "./lib/installations"
import { deviceProvider } from "./lib/pushProviders"
import { enforceRateLimit } from "./rateLimit"

const cadence = v.union(
  v.literal("instant"),
  v.literal("daily"),
  v.literal("weekly")
)

const position = v.union(
  v.literal("oppose"),
  v.literal("support"),
  v.literal("monitor")
)

const notificationPermission = v.union(
  v.literal("unknown"),
  v.literal("granted"),
  v.literal("denied")
)

const pushTarget = v.union(
  v.object({
    provider: v.literal("apns"),
    token: v.string(),
    environment: v.union(
      v.literal("development"),
      v.literal("production")
    ),
  }),
  v.object({
    provider: v.literal("webpush"),
    endpoint: v.string(),
    keys: v.object({ p256dh: v.string(), auth: v.string() }),
  }),
  v.object({ provider: v.literal("expo"), token: v.string() })
)

export const reconcile = internalMutation({
  args: {
    installationId: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android"), v.literal("web")),
    appVersion: v.optional(v.string()),
    preferences: v.object({
      topicSlugs: v.array(v.string()),
      cadence,
      position,
      regionCode: v.optional(v.string()),
      notificationsEnabled: v.boolean(),
      notificationPermission,
    }),
    pushTarget: v.optional(pushTarget),
  },
  handler: async (ctx, args) => {
    validateInstallationId(args.installationId)
    await enforceRateLimit(
      ctx,
      `installation-reconcile:${args.installationId}`,
      30,
      60_000
    )

    const now = new Date().toISOString()
    const regionCode = normalizeRegionCode(args.preferences.regionCode)
    const jurisdictionKeys = regionCode
      ? [await ensureStateJurisdiction(ctx, regionCode)]
      : []
    const existingProfile = await ctx.db
      .query("civicProfiles")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId)
      )
      .unique()
    const profile = {
      installationId: args.installationId,
      homeJurisdictionKeys: jurisdictionKeys,
      notificationPermission: args.preferences.notificationPermission,
      notificationsEnabled: args.preferences.notificationsEnabled,
      digestHourUtc: existingProfile?.digestHourUtc ?? 13,
      digestDayOfWeekUtc: existingProfile?.digestDayOfWeekUtc ?? 1,
      updatedAt: now,
    }
    const profileId = existingProfile
      ? existingProfile._id
      : await ctx.db.insert("civicProfiles", { ...profile, createdAt: now })
    if (existingProfile) await ctx.db.patch(existingProfile._id, profile)

    const desiredTopicSlugs = [...new Set(args.preferences.topicSlugs)].slice(
      0,
      50
    )
    const knownTopicSlugs: Array<string> = []
    for (const topicSlug of desiredTopicSlugs) {
      const topic = await ctx.db
        .query("topics")
        .withIndex("by_slug", (q) => q.eq("slug", topicSlug))
        .unique()
      if (topic) knownTopicSlugs.push(topicSlug)
    }

    const existingSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId))
      .collect()
    const diff = desiredSubscriptionDiff(
      existingSubscriptions.map((subscription) => subscription.topicSlug),
      knownTopicSlugs
    )
    const deactivate = new Set(diff.deactivate)
    for (const subscription of existingSubscriptions) {
      if (deactivate.has(subscription.topicSlug) && subscription.isActive) {
        await ctx.db.patch(subscription._id, { isActive: false, updatedAt: now })
      }
    }

    for (const topicSlug of diff.activate) {
      const existing = existingSubscriptions.find(
        (subscription) => subscription.topicSlug === topicSlug
      )
      const subscription = {
        profileId,
        topicSlug,
        position: args.preferences.position,
        cadence: args.preferences.cadence,
        minimumUrgency: "medium" as const,
        jurisdictionKeys,
        eventKinds: [],
        isActive: true,
        updatedAt: now,
      }
      if (existing) await ctx.db.patch(existing._id, subscription)
      else
        await ctx.db.insert("subscriptions", {
          ...subscription,
          createdAt: now,
        })
    }

    if (args.pushTarget) {
      const target = deviceFields(args.pushTarget)
      const existingDevice = await ctx.db
        .query("pushDevices")
        .withIndex("by_token", (q) => q.eq("token", target.token))
        .unique()
      const profileDevices = await ctx.db
        .query("pushDevices")
        .withIndex("by_profile", (q) => q.eq("profileId", profileId))
        .collect()
      for (const profileDevice of profileDevices) {
        if (
          profileDevice.token !== target.token &&
          deviceProvider(profileDevice) === target.provider &&
          profileDevice.isActive
        ) {
          await ctx.db.patch(profileDevice._id, {
            isActive: false,
            disabledReason: "replaced",
          })
        }
      }
      const device = {
        ...target,
        profileId,
        platform: args.platform,
        appVersion: cleanOptional(args.appVersion, 50),
        isActive: true,
        lastRegisteredAt: now,
        disabledReason: undefined,
      }
      if (existingDevice) await ctx.db.patch(existingDevice._id, device)
      else await ctx.db.insert("pushDevices", device)
    }

    return {
      profileId,
      subscriptions: knownTopicSlugs.length,
      jurisdictionKeys,
    }
  },
})

export const pause = internalMutation({
  args: { installationId: v.string() },
  handler: async (ctx, args) => {
    validateInstallationId(args.installationId)
    await enforceRateLimit(
      ctx,
      `installation-pause:${args.installationId}`,
      20,
      60_000
    )
    const profile = await ctx.db
      .query("civicProfiles")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId)
      )
      .unique()
    if (profile) {
      await ctx.db.patch(profile._id, {
        notificationsEnabled: false,
        updatedAt: new Date().toISOString(),
      })
    }
    return true
  },
})

async function ensureStateJurisdiction(
  ctx: Parameters<typeof enforceRateLimit>[0],
  regionCode: string
) {
  const jurisdiction = jurisdictionForRegion(regionCode)
  const existing = await ctx.db
    .query("jurisdictions")
    .withIndex("by_key", (q) => q.eq("key", jurisdiction.key))
    .unique()
  if (!existing) {
    await ctx.db.insert("jurisdictions", {
      ...jurisdiction,
      kind: "state",
      countryCode: "US",
      stateCode: regionCode,
      parentKey: "us",
    })
  }
  return jurisdiction.key
}

function deviceFields(
  target:
    | {
        provider: "apns"
        token: string
        environment: "development" | "production"
      }
    | {
        provider: "webpush"
        endpoint: string
        keys: { p256dh: string; auth: string }
      }
    | { provider: "expo"; token: string }
) {
  if (target.provider === "apns") {
    return {
      provider: target.provider,
      token: target.token,
      apnsEnvironment: target.environment,
      webPushEndpoint: undefined,
      webPushP256dh: undefined,
      webPushAuth: undefined,
    }
  }
  if (target.provider === "webpush") {
    return {
      provider: target.provider,
      token: target.endpoint,
      apnsEnvironment: undefined,
      webPushEndpoint: target.endpoint,
      webPushP256dh: target.keys.p256dh,
      webPushAuth: target.keys.auth,
    }
  }
  return {
    provider: target.provider,
    token: target.token,
    apnsEnvironment: undefined,
    webPushEndpoint: undefined,
    webPushP256dh: undefined,
    webPushAuth: undefined,
  }
}

function validateInstallationId(value: string) {
  if (value.length < 16 || value.length > 200) {
    throw new Error("Invalid installationId")
  }
}

function cleanOptional(value: string | undefined, maxLength: number) {
  const cleaned = value?.trim()
  return cleaned ? cleaned.slice(0, maxLength) : undefined
}
