import { v } from "convex/values"

import { internalMutation, internalQuery } from "./_generated/server"

const urgency = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
)

const eventKind = v.union(
  v.literal("permit"),
  v.literal("meeting"),
  v.literal("vote"),
  v.literal("public_comment"),
  v.literal("filing"),
  v.literal("investigation"),
  v.literal("policy"),
  v.literal("court_ruling"),
  v.literal("breaking_news")
)

export const list = internalQuery({
  args: { installationId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("civicProfiles")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId)
      )
      .unique()
    if (!profile) return []

    return await ctx.db
      .query("subscriptions")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .collect()
  },
})

export const upsert = internalMutation({
  args: {
    installationId: v.string(),
    topicSlug: v.string(),
    position: v.union(
      v.literal("oppose"),
      v.literal("support"),
      v.literal("monitor")
    ),
    cadence: v.union(
      v.literal("instant"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    minimumUrgency: urgency,
    jurisdictionKeys: v.array(v.string()),
    eventKinds: v.array(eventKind),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("civicProfiles")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId)
      )
      .unique()
    if (!profile) throw new Error("Create a civic profile before subscribing")

    const topic = await ctx.db
      .query("topics")
      .withIndex("by_slug", (q) => q.eq("slug", args.topicSlug))
      .unique()
    if (!topic) throw new Error(`Unknown topic: ${args.topicSlug}`)

    const jurisdictionKeys = [...new Set(args.jurisdictionKeys)]
    for (const key of jurisdictionKeys) {
      const jurisdiction = await ctx.db
        .query("jurisdictions")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique()
      if (!jurisdiction) throw new Error(`Unknown jurisdiction: ${key}`)
    }

    const now = new Date().toISOString()
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_profile_topic", (q) =>
        q.eq("profileId", profile._id).eq("topicSlug", args.topicSlug)
      )
      .unique()
    const subscription = {
      profileId: profile._id,
      topicSlug: args.topicSlug,
      position: args.position,
      cadence: args.cadence,
      minimumUrgency: args.minimumUrgency,
      jurisdictionKeys,
      eventKinds: [...new Set(args.eventKinds)],
      isActive: args.isActive ?? true,
      updatedAt: now,
    }

    if (existing) {
      await ctx.db.patch(existing._id, subscription)
      return existing._id
    }
    return await ctx.db.insert("subscriptions", {
      ...subscription,
      createdAt: now,
    })
  },
})

export const setActive = internalMutation({
  args: {
    installationId: v.string(),
    topicSlug: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("civicProfiles")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId)
      )
      .unique()
    if (!profile) return false
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_profile_topic", (q) =>
        q.eq("profileId", profile._id).eq("topicSlug", args.topicSlug)
      )
      .unique()
    if (!subscription) return false
    await ctx.db.patch(subscription._id, {
      isActive: args.isActive,
      updatedAt: new Date().toISOString(),
    })
    return true
  },
})
