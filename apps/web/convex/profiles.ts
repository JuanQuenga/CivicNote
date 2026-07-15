import { v } from "convex/values"

import { internalMutation, internalQuery } from "./_generated/server"

const notificationPermission = v.union(
  v.literal("unknown"),
  v.literal("granted"),
  v.literal("denied")
)

export const get = internalQuery({
  args: { installationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("civicProfiles")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId)
      )
      .unique()
  },
})

export const upsert = internalMutation({
  args: {
    installationId: v.string(),
    displayName: v.optional(v.string()),
    homeJurisdictionKeys: v.array(v.string()),
    notificationPermission,
    notificationsEnabled: v.boolean(),
    digestHourUtc: v.optional(v.number()),
    digestDayOfWeekUtc: v.optional(v.number()),
    quietHoursStartUtc: v.optional(v.number()),
    quietHoursEndUtc: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    validateInstallationId(args.installationId)
    validateHour(args.digestHourUtc, "digestHourUtc")
    validateHour(args.quietHoursStartUtc, "quietHoursStartUtc")
    validateHour(args.quietHoursEndUtc, "quietHoursEndUtc")
    validateDay(args.digestDayOfWeekUtc)

    const homeJurisdictionKeys = [...new Set(args.homeJurisdictionKeys)]
    for (const key of homeJurisdictionKeys) {
      const jurisdiction = await ctx.db
        .query("jurisdictions")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique()
      if (!jurisdiction) throw new Error(`Unknown jurisdiction: ${key}`)
    }

    const now = new Date().toISOString()
    const existing = await ctx.db
      .query("civicProfiles")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId)
      )
      .unique()

    const profile = {
      installationId: args.installationId,
      displayName: cleanOptional(args.displayName),
      homeJurisdictionKeys,
      notificationPermission: args.notificationPermission,
      notificationsEnabled:
        args.notificationsEnabled && args.notificationPermission === "granted",
      digestHourUtc: args.digestHourUtc ?? existing?.digestHourUtc ?? 13,
      digestDayOfWeekUtc:
        args.digestDayOfWeekUtc ?? existing?.digestDayOfWeekUtc ?? 1,
      quietHoursStartUtc:
        args.quietHoursStartUtc ?? existing?.quietHoursStartUtc,
      quietHoursEndUtc: args.quietHoursEndUtc ?? existing?.quietHoursEndUtc,
      updatedAt: now,
    }

    if (existing) {
      await ctx.db.patch(existing._id, profile)
      return existing._id
    }

    return await ctx.db.insert("civicProfiles", {
      ...profile,
      createdAt: now,
    })
  },
})

export const remove = internalMutation({
  args: { installationId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("civicProfiles")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId)
      )
      .unique()
    if (!profile) return { removed: false }

    const [subscriptions, devices, candidates] = await Promise.all([
      ctx.db
        .query("subscriptions")
        .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
        .collect(),
      ctx.db
        .query("pushDevices")
        .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
        .collect(),
      ctx.db
        .query("notificationCandidates")
        .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
        .collect(),
    ])

    for (const candidate of candidates) {
      const deliveries = await ctx.db
        .query("notificationDeliveries")
        .withIndex("by_candidate", (q) => q.eq("candidateId", candidate._id))
        .collect()
      for (const delivery of deliveries) await ctx.db.delete(delivery._id)
      await ctx.db.delete(candidate._id)
    }
    for (const subscription of subscriptions)
      await ctx.db.delete(subscription._id)
    for (const device of devices) await ctx.db.delete(device._id)
    await ctx.db.delete(profile._id)
    return { removed: true }
  },
})

function validateInstallationId(value: string) {
  if (value.length < 16 || value.length > 200) {
    throw new Error("installationId must be between 16 and 200 characters")
  }
}

function validateHour(value: number | undefined, field: string) {
  if (
    value !== undefined &&
    (!Number.isInteger(value) || value < 0 || value > 23)
  ) {
    throw new Error(`${field} must be an integer from 0 through 23`)
  }
}

function validateDay(value: number | undefined) {
  if (
    value !== undefined &&
    (!Number.isInteger(value) || value < 0 || value > 6)
  ) {
    throw new Error("digestDayOfWeekUtc must be an integer from 0 through 6")
  }
}

function cleanOptional(value: string | undefined) {
  const cleaned = value?.trim()
  return cleaned ? cleaned.slice(0, 100) : undefined
}
