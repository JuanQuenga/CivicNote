import { v } from "convex/values"

import { internalMutation } from "./_generated/server"
import { jurisdictionForRegion, normalizeRegionCode } from "./lib/installations"
import { enforceRateLimit } from "./rateLimit"

const cadence = v.union(
  v.literal("instant"),
  v.literal("daily"),
  v.literal("weekly")
)

export const register = internalMutation({
  args: {
    installationId: v.string(),
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android")),
    topicSlugs: v.array(v.string()),
    cadence,
    position: v.optional(
      v.union(v.literal("oppose"), v.literal("support"), v.literal("monitor"))
    ),
    locationLabel: v.optional(v.string()),
    regionCode: v.optional(v.string()),
    appVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.installationId.length < 16 || args.installationId.length > 200) {
      throw new Error("Invalid installationId")
    }
    if (
      !/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9._~+-]+\]$/.test(
        args.token
      )
    ) {
      throw new Error("Invalid Expo push token")
    }
    await enforceRateLimit(
      ctx,
      `push-register:${args.installationId}`,
      20,
      60_000
    )
    const now = new Date().toISOString()
    const regionCode = normalizeRegionCode(args.regionCode)
    const jurisdictionKeys = regionCode
      ? [`us-${regionCode.toLowerCase()}`]
      : []

    if (regionCode) {
      const jurisdiction = jurisdictionForRegion(regionCode)
      const existingJurisdiction = await ctx.db
        .query("jurisdictions")
        .withIndex("by_key", (q) => q.eq("key", jurisdiction.key))
        .unique()
      if (!existingJurisdiction) {
        await ctx.db.insert("jurisdictions", {
          ...jurisdiction,
          kind: "state",
          countryCode: "US",
          stateCode: regionCode,
          parentKey: "us",
        })
      }
    }

    const existingProfile = await ctx.db
      .query("civicProfiles")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId)
      )
      .unique()
    const profileId =
      existingProfile?._id ??
      (await ctx.db.insert("civicProfiles", {
        installationId: args.installationId,
        homeJurisdictionKeys: jurisdictionKeys,
        notificationPermission: "granted",
        notificationsEnabled: true,
        digestHourUtc: 13,
        digestDayOfWeekUtc: 1,
        createdAt: now,
        updatedAt: now,
      }))
    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        homeJurisdictionKeys: jurisdictionKeys,
        notificationPermission: "granted",
        notificationsEnabled: true,
        updatedAt: now,
      })
    }

    const existingDevice = await ctx.db
      .query("pushDevices")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique()
    const device = {
      profileId,
      token: args.token,
      provider: "expo" as const,
      platform: args.platform,
      appVersion: cleanOptional(args.appVersion, 50),
      deviceLabel: cleanOptional(args.locationLabel, 100),
      isActive: true,
      lastRegisteredAt: now,
      disabledReason: undefined,
    }
    if (existingDevice) await ctx.db.patch(existingDevice._id, device)
    else await ctx.db.insert("pushDevices", device)

    const desiredTopicSlugs = [...new Set(args.topicSlugs)].slice(0, 50)
    const desiredTopics = new Set(desiredTopicSlugs)
    const previousSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId))
      .collect()
    for (const subscription of previousSubscriptions) {
      if (!desiredTopics.has(subscription.topicSlug) && subscription.isActive) {
        await ctx.db.patch(subscription._id, {
          isActive: false,
          updatedAt: now,
        })
      }
    }

    let activeSubscriptions = 0
    for (const topicSlug of desiredTopicSlugs) {
      const topic = await ctx.db
        .query("topics")
        .withIndex("by_slug", (q) => q.eq("slug", topicSlug))
        .unique()
      if (!topic) continue
      const existingSubscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_profile_topic", (q) =>
          q.eq("profileId", profileId).eq("topicSlug", topicSlug)
        )
        .unique()
      const subscription = {
        profileId,
        topicSlug,
        position: args.position ?? "monitor",
        cadence: args.cadence,
        minimumUrgency: "medium" as const,
        jurisdictionKeys,
        eventKinds: [],
        isActive: true,
        updatedAt: now,
      }
      if (existingSubscription) {
        await ctx.db.patch(existingSubscription._id, subscription)
      } else {
        await ctx.db.insert("subscriptions", {
          ...subscription,
          createdAt: now,
        })
      }
      activeSubscriptions += 1
    }

    return { profileId, subscriptions: activeSubscriptions, jurisdictionKeys }
  },
})

function cleanOptional(value: string | undefined, maxLength: number) {
  const cleaned = value?.trim()
  return cleaned ? cleaned.slice(0, maxLength) : undefined
}
