import { v } from "convex/values"

import { internal } from "./_generated/api"
import { internalMutation, mutation, query } from "./_generated/server"
import {
  MAX_OPEN_REQUESTS_PER_INSTALLATION,
  MAX_REQUESTS_PER_WINDOW,
  REQUEST_WINDOW_MS,
} from "./lib/topicReviewSchemas"
import { enforceRateLimit } from "./rateLimit"
import {
  geographicScope,
  googleNewsFeedUrl,
  validateInstallationId,
} from "./lib/validators"

const requestStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("duplicate"),
  v.literal("failed")
)

// A reader asks CivicNote to start watching something.
//
// The row is written immediately and reviewed out of band, so the app can
// acknowledge the request without holding the reader on a model call.
export const submit = mutation({
  args: {
    installationId: v.string(),
    subject: v.string(),
    reason: v.optional(v.string()),
    regionHint: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    validateInstallationId(args.installationId)

    const subject = args.subject.trim()
    if (subject.length < 8) {
      throw new Error("Describe the subject in a few more words.")
    }
    if (subject.length > 200) {
      throw new Error("Keep the subject under 200 characters.")
    }

    await enforceRateLimit(
      ctx,
      `topic-request:${args.installationId}`,
      MAX_REQUESTS_PER_WINDOW,
      REQUEST_WINDOW_MS
    )

    const mine = await ctx.db
      .query("topicRequests")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId)
      )
      .collect()

    const open = mine.filter((request) => request.status === "pending")
    if (open.length >= MAX_OPEN_REQUESTS_PER_INSTALLATION) {
      throw new Error(
        "You already have requests waiting on review. They usually clear within an hour."
      )
    }

    const duplicate = mine.find(
      (request) =>
        request.subject.toLowerCase() === subject.toLowerCase() &&
        request.status !== "rejected"
    )
    if (duplicate) return { requestId: duplicate._id, alreadyRequested: true }

    const requestId = await ctx.db.insert("topicRequests", {
      installationId: args.installationId,
      subject,
      reason: args.reason?.trim() || undefined,
      regionHint: args.regionHint?.trim() || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
      attempts: 0,
    })

    await ctx.scheduler.runAfter(
      0,
      internal.topicReviewJobs.enqueueRequestReview,
      { requestId }
    )

    return { requestId, alreadyRequested: false }
  },
})

// What this device has asked for, newest first. The verdict note is the
// point: a rejected request has to be able to say why.
export const listMine = query({
  args: { installationId: v.string() },
  handler: async (ctx, args) => {
    validateInstallationId(args.installationId)
    const requests = await ctx.db
      .query("topicRequests")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId)
      )
      .collect()

    return requests
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 25)
      .map((request) => ({
        id: request._id,
        subject: request.subject,
        status: request.status,
        note: request.verdictNote,
        topicSlug: request.topicSlug ?? request.duplicateOfSlug,
        createdAt: request.createdAt,
        reviewedAt: request.reviewedAt,
      }))
  },
})

// MARK: - Internals used by the review queue

export const recordVerdict = internalMutation({
  args: {
    requestId: v.id("topicRequests"),
    status: requestStatus,
    note: v.string(),
    duplicateOfSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: args.status,
      verdictNote: args.note,
      duplicateOfSlug: args.duplicateOfSlug,
      reviewedAt: new Date().toISOString(),
    })
  },
})

// Turns an approved request into a live topic and a live feed, in one
// transaction, so a reader can never see a topic that nothing is crawling.
export const approve = internalMutation({
  args: {
    requestId: v.id("topicRequests"),
    note: v.string(),
    topic: v.object({
      slug: v.string(),
      title: v.string(),
      shortTitle: v.string(),
      tagline: v.string(),
      summary: v.string(),
      tag: v.string(),
      searchQuery: v.string(),
      scope: geographicScope,
      jurisdictionKeys: v.array(v.string()),
      theme: v.union(
        v.literal("ethics"),
        v.literal("surveillance"),
        v.literal("infrastructure"),
        v.literal("future")
      ),
      region: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const { topic } = args
    const now = new Date().toISOString()

    const clash = await ctx.db
      .query("topics")
      .withIndex("by_slug", (q) => q.eq("slug", topic.slug))
      .unique()
    if (clash) {
      await ctx.db.patch(args.requestId, {
        status: "duplicate",
        verdictNote: "CivicNote already tracks a topic under this name.",
        duplicateOfSlug: topic.slug,
        reviewedAt: now,
      })
      return { created: false }
    }

    const count = (await ctx.db.query("topics").collect()).length

    // A reader-requested topic starts as a container for its feed. The
    // editorial apparatus — claim ledgers, money trails, argument pairs — is
    // hand-authored and stays empty rather than being invented.
    await ctx.db.insert("topics", {
      slug: topic.slug,
      topicNumber: String(count + 1).padStart(2, "0"),
      title: topic.title,
      shortTitle: topic.shortTitle,
      tagline: topic.tagline,
      summary: topic.summary,
      region: topic.region,
      status: "Tracking",
      theme: topic.theme,
      updatedAt: now,
      stats: [],
      arguments: [],
      findings: [],
      statusBrief: {
        headline: "Newly tracked",
        summary:
          "A reader asked CivicNote to follow this. The crawl has started; items appear here once each one has been reviewed.",
        latestDevelopment: "Nothing has been reviewed yet.",
        nextDecisionPoint: "Unknown until the first records surface.",
        whoCanAct: "Not yet identified.",
        urgency: "low",
        lastChecked: now,
      },
      actions: [],
      timeline: [],
      updates: [],
      modules: [],
      sources: [],
    })

    await ctx.db.insert("topicFeeds", {
      topicSlug: topic.slug,
      tag: topic.tag,
      query: topic.searchQuery,
      url: googleNewsFeedUrl(topic.searchQuery),
      scope: topic.scope,
      jurisdictionKeys: topic.jurisdictionKeys,
      source: "reader",
      active: true,
      createdAt: now,
    })

    await ctx.db.patch(args.requestId, {
      status: "approved",
      verdictNote: args.note,
      topicSlug: topic.slug,
      reviewedAt: now,
    })

    return { created: true }
  },
})
