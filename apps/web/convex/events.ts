import { v } from "convex/values"

import { query } from "./_generated/server"

export const listPublished = query({
  args: {
    topicSlug: v.optional(v.string()),
    jurisdictionKeys: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 30), 1), 100)
    const jurisdictionKeys = new Set(args.jurisdictionKeys ?? [])
    const events = await ctx.db
      .query("civicEvents")
      .withIndex("by_publication_published", (q) =>
        q.eq("publicationStatus", "published")
      )
      .order("desc")
      .take(250)

    return events
      .filter(
        (event) => !args.topicSlug || event.topicSlugs.includes(args.topicSlug)
      )
      .filter(
        (event) =>
          jurisdictionKeys.size === 0 ||
          event.geographicScope === "national" ||
          event.geographicScope === "international" ||
          event.jurisdictionKeys.some((key) => jurisdictionKeys.has(key))
      )
      .slice(0, limit)
  },
})

export const getPublishedByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("civicEvents")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique()
    if (!event || event.publicationStatus !== "published") return null

    const [sources, meeting, evidence, actions] = await Promise.all([
      Promise.all(event.sourceDocumentIds.map((id) => ctx.db.get(id))),
      event.meetingId ? ctx.db.get(event.meetingId) : null,
      ctx.db
        .query("evidenceClaims")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect(),
      ctx.db
        .query("civicActions")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect(),
    ])

    return {
      ...event,
      sources: sources.filter((source) => source !== null),
      meeting,
      evidence,
      actions,
    }
  },
})

export const listJurisdictions = query({
  args: { stateCode: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.stateCode) return await ctx.db.query("jurisdictions").collect()
    return await ctx.db
      .query("jurisdictions")
      .withIndex("by_state_kind", (q) => q.eq("stateCode", args.stateCode))
      .collect()
  },
})
