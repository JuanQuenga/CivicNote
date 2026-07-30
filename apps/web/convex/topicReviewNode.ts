"use node"

import { v } from "convex/values"

import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"
import { reviewDraftEvent, reviewTopicRequest, topicReviewEnabled } from "./lib/topicReview"
import { resolveApproval } from "./lib/topicReviewSchemas"
import type { Doc, Id } from "./_generated/dataModel"

// Orchestration for the automated editor. Node runtime because the AI SDK
// needs it. Everything decided here is re-checked in the mutations it calls,
// so a bad model response cannot write a malformed topic.

const DISABLED_NOTE =
  "Automatic review is switched off on this deployment, so this request is waiting for a person."

// Reviews one reader request and, on approval, creates the topic and starts
// its crawl. Every exit path writes a verdict — a request never sits pending
// because the model errored.
export const reviewRequest = internalAction({
  args: { requestId: v.id("topicRequests") },
  handler: async (ctx, args) => {
    if (!topicReviewEnabled(process.env)) {
      await ctx.runMutation(internal.topicRequests.recordVerdict, {
        requestId: args.requestId,
        status: "pending",
        note: DISABLED_NOTE,
      })
      return { reviewed: false, reason: "disabled" }
    }

    await ctx.runMutation(internal.topicRequests.markAttempt, {
      requestId: args.requestId,
    })

    // Annotated because `internal.topicReviewNode` refers back into this
    // file; inference through that cycle collapses to `any`.
    const loaded: {
      request: Doc<"topicRequests">
      topics: Array<{ slug: string; title: string }>
    } | null = await ctx.runQuery(internal.topicRequests.loadForReview, {
      requestId: args.requestId,
    })
    if (!loaded) return { reviewed: false, reason: "missing" }
    if (loaded.request.status !== "pending") {
      return { reviewed: false, reason: "already-decided" }
    }

    try {
      const { verdict } = await reviewTopicRequest({
        subject: loaded.request.subject,
        reason: loaded.request.reason,
        regionHint: loaded.request.regionHint,
        existingTopics: loaded.topics,
      })

      const resolved = resolveApproval(
        verdict,
        new Set(loaded.topics.map((topic) => topic.slug))
      )

      if (!resolved.ok) {
        await ctx.runMutation(internal.topicRequests.recordVerdict, {
          requestId: args.requestId,
          status: resolved.status,
          note: resolved.note,
          duplicateOfSlug: resolved.duplicateOfSlug,
        })
        return { reviewed: true, status: resolved.status }
      }

      const result = await ctx.runMutation(internal.topicRequests.approve, {
        requestId: args.requestId,
        note: verdict.note,
        topic: resolved.topic,
      })
      if (result.created) {
        // Crawl immediately rather than waiting up to 30 minutes: an approved
        // request that shows an empty topic reads as a broken feature.
        await ctx.scheduler.runAfter(0, internal.news.refreshAllTopicNews, {})
      }
      return { reviewed: true, status: "approved", slug: resolved.topic.slug }
    } catch (error) {
      // The provider's error text can carry request contents; it never
      // reaches the reader.
      console.error("topic request review failed", error)
      await ctx.runMutation(internal.topicRequests.recordVerdict, {
        requestId: args.requestId,
        status: "failed",
        note: "Review could not be completed. This will be retried automatically.",
      })
      return { reviewed: false, reason: "error" }
    }
  },
})

// Retries requests whose review never landed, and re-opens failures.
export const retryStalledRequests = internalAction({
  args: {},
  handler: async (ctx) => {
    if (!topicReviewEnabled(process.env)) return { retried: 0 }
    const ids: Array<Id<"topicRequests">> = await ctx.runQuery(
      internal.topicRequests.listStalled,
      { olderThanMs: 10 * 60 * 1000 }
    )
    for (const requestId of ids) {
      await ctx.scheduler.runAfter(0, internal.topicReviewNode.reviewRequest, {
        requestId,
      })
    }
    return { retried: ids.length }
  },
})

// The publishing pass. Reads a batch of crawled drafts, asks the editor
// whether each is a real civic development, and publishes the ones that are
// through `editorial.publish` so its source guarantees still apply.
export const reviewDrafts = internalAction({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (!topicReviewEnabled(process.env)) return { reviewed: 0, published: 0 }

    const drafts = await ctx.runQuery(internal.editorial.listReviewableDrafts, {
      limit: Math.min(Math.max(Math.floor(args.limit ?? 12), 1), 25),
    })

    let published = 0
    let reviewed = 0
    for (const draft of drafts) {
      try {
        const { verdict } = await reviewDraftEvent({
          topicTitle: draft.topicTitle,
          topicSummary: draft.topicSummary,
          headline: draft.headline,
          summary: draft.summary,
          publisher: draft.publisher,
          publishedAt: draft.publishedAt,
        })
        reviewed += 1

        if (verdict.decision === "discard") {
          await ctx.runMutation(internal.editorial.suppress, {
            eventKey: draft.eventKey,
            reason: verdict.note ?? "Reviewed and found not to be a civic development.",
          })
          continue
        }
        if (verdict.decision === "hold") continue

        await ctx.runMutation(internal.editorial.publish, {
          eventKey: draft.eventKey,
          confidence: verdict.confidence,
          urgency: verdict.urgency === "high" ? "high" : verdict.urgency,
          whyItMatters: verdict.whyItMatters,
          // A machine-reviewed item never wakes anyone up. Alerts stay a
          // digest decision until a person has looked at the topic.
          notificationMode: "digest",
        })
        published += 1
      } catch (error) {
        console.error("draft review failed", draft.eventKey, error)
      }
    }

    return { reviewed, published }
  },
})
