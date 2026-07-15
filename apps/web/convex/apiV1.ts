import { v } from "convex/values"

import { internalQuery } from "./_generated/server"
import type { Doc } from "./_generated/dataModel"

export const listTopics = internalQuery({
  args: {},
  handler: async (ctx) => {
    const topics = await ctx.db.query("topics").collect()
    return topics
      .map((topic) => ({
        slug: topic.slug,
        title: topic.title,
        shortTitle: topic.shortTitle,
        summary: topic.summary,
        theme: topic.theme,
        updatedAt: topic.updatedAt,
      }))
      .sort((left, right) => left.title.localeCompare(right.title))
  },
})

export const listEvents = internalQuery({
  args: {
    topic: v.optional(v.string()),
    jurisdiction: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("civicEvents")
      .withIndex("by_publication_published", (q) =>
        q.eq("publicationStatus", "published")
      )
      .order("desc")
      .collect()
    return events
      .filter((event) => !args.topic || event.topicSlugs.includes(args.topic))
      .filter(
        (event) =>
          !args.jurisdiction ||
          event.geographicScope === "national" ||
          event.geographicScope === "international" ||
          event.jurisdictionKeys.includes(args.jurisdiction)
      )
      .slice(0, args.limit)
      .map(eventSummary)
  },
})

export const getEvent = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("civicEvents")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique()
    if (!event || event.publicationStatus !== "published") return null

    const [sourceDocuments, evidenceClaims, civicActions, meeting] =
      await Promise.all([
        Promise.all(event.sourceDocumentIds.map((id) => ctx.db.get(id))),
        ctx.db
          .query("evidenceClaims")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect(),
        ctx.db
          .query("civicActions")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect(),
        event.meetingId ? ctx.db.get(event.meetingId) : null,
      ])

    return {
      ...eventSummary(event),
      sources: sourceDocuments.flatMap((source) =>
        source
          ? [
              {
                title: source.title,
                publisher: source.publisher,
                url: source.url,
                reliability: source.reliability,
                publishedAt: source.publishedAt,
              },
            ]
          : []
      ),
      evidence: evidenceClaims
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((evidence) => ({
          claim: evidence.claim,
          context: evidence.context,
          classification: evidence.classification,
          evidenceStrength: evidence.evidenceStrength,
        })),
      actions: civicActions
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((action) => ({
          title: action.title,
          description: action.description,
          actionKind: action.actionKind,
          audience: action.audience,
          deadlineAt: action.deadlineAt,
          ctaLabel: action.ctaLabel,
          ctaUrl: action.ctaUrl,
          script: action.script,
        })),
      meeting: meeting
        ? {
            title: meeting.title,
            bodyName: meeting.bodyName,
            startsAt: meeting.startsAt,
            endsAt: meeting.endsAt,
            timezone: meeting.timezone,
            locationName: meeting.locationName,
            address: meeting.address,
            remoteUrl: meeting.remoteUrl,
            agendaUrl: meeting.agendaUrl,
            publicCommentDeadline: meeting.publicCommentDeadline,
            status: meeting.status,
          }
        : undefined,
    }
  },
})

function eventSummary(event: Doc<"civicEvents">) {
  return {
    key: event.key,
    headline: event.headline,
    summary: event.summary,
    whyItMatters: event.whyItMatters,
    eventKind: event.eventKind,
    geographicScope: event.geographicScope,
    jurisdictionKeys: event.jurisdictionKeys,
    urgency: event.urgency,
    confidence: event.confidence,
    lifecycleStatus: event.lifecycleStatus,
    startsAt: event.startsAt,
    deadlineAt: event.deadlineAt,
    publishedAt: event.publishedAt,
    updatedAt: event.updatedAt,
    deepLinkPath: event.deepLinkPath,
    topicSlugs: event.topicSlugs,
  }
}
