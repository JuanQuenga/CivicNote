import { v } from "convex/values"

import { internalMutation, internalQuery } from "./_generated/server"

const urgency = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
)

export const listDrafts = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 100)
    const events = await ctx.db
      .query("civicEvents")
      .withIndex("by_published")
      .order("desc")
      .take(250)
    return events
      .filter((event) => event.publicationStatus === "draft")
      .slice(0, limit)
  },
})

export const publish = internalMutation({
  args: {
    eventKey: v.string(),
    confidence: v.union(v.literal("corroborated"), v.literal("verified")),
    urgency,
    notificationMode: v.union(v.literal("instant"), v.literal("digest")),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("civicEvents")
      .withIndex("by_key", (q) => q.eq("key", args.eventKey))
      .unique()
    if (!event) throw new Error(`Unknown event: ${args.eventKey}`)
    if (event.sourceDocumentIds.length === 0) {
      throw new Error(
        "An event must have at least one source before publication"
      )
    }
    const sources = await Promise.all(
      event.sourceDocumentIds.map((sourceId) => ctx.db.get(sourceId))
    )
    if (sources.some((source) => source === null)) {
      throw new Error("Every source reference must resolve before publication")
    }
    const hasAuthoritativeScheduleSource = sources.some(
      (source) =>
        source?.reliability === "primary" &&
        (source.documentType === "agenda" ||
          source.documentType === "government" ||
          source.documentType === "permit" ||
          source.documentType === "filing")
    )
    if (
      (event.eventKind === "meeting" || event.startsAt || event.deadlineAt) &&
      ((!event.meetingId && event.eventKind === "meeting") ||
        !hasAuthoritativeScheduleSource)
    ) {
      throw new Error(
        "Meeting and deadline alerts require an official primary source; meeting alerts also require a meeting record"
      )
    }

    await ctx.db.patch(event._id, {
      confidence: args.confidence,
      urgency: args.urgency,
      notificationMode: args.notificationMode,
      publicationStatus: "published",
      notificationStatus: "pending",
      updatedAt: new Date().toISOString(),
    })
    return event._id
  },
})

export const suppress = internalMutation({
  args: { eventKey: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("civicEvents")
      .withIndex("by_key", (q) => q.eq("key", args.eventKey))
      .unique()
    if (!event) return false
    await ctx.db.patch(event._id, {
      publicationStatus: "archived",
      notificationStatus: "suppressed",
      notificationMode: "none",
      whyItMatters: `${event.whyItMatters}\n\nEditorial note: ${args.reason.slice(0, 500)}`,
      updatedAt: new Date().toISOString(),
    })
    return true
  },
})

export const upsertSource = internalMutation({
  args: {
    key: v.string(),
    title: v.string(),
    publisher: v.string(),
    url: v.string(),
    archivedUrl: v.optional(v.string()),
    documentType: v.union(
      v.literal("agenda"),
      v.literal("minutes"),
      v.literal("permit"),
      v.literal("filing"),
      v.literal("government"),
      v.literal("research"),
      v.literal("reporting"),
      v.literal("advocacy")
    ),
    publishedAt: v.optional(v.string()),
    jurisdictionKeys: v.array(v.string()),
    provenanceNote: v.string(),
    reliability: v.union(
      v.literal("primary"),
      v.literal("authoritative"),
      v.literal("reported"),
      v.literal("perspective")
    ),
  },
  handler: async (ctx, args) => {
    assertWebUrl(args.url)
    if (args.archivedUrl) assertWebUrl(args.archivedUrl)
    const now = new Date().toISOString()
    const existing = await ctx.db
      .query("sourceDocuments")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique()
    const source = { ...args, retrievedAt: now }
    if (existing) {
      await ctx.db.patch(existing._id, source)
      return existing._id
    }
    return await ctx.db.insert("sourceDocuments", source)
  },
})

function assertWebUrl(value: string) {
  const url = new URL(value)
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Source URLs must use HTTPS or HTTP")
  }
}
