import { v } from "convex/values"

import { internal } from "./_generated/api"
import { internalMutation } from "./_generated/server"
import {
  buildDraftBatchPrompt,
  buildRequestPrompt,
} from "./lib/topicReviewPrompts"
import {
  CODEX_JOB_DEADLINE_MS,
  CODEX_JOB_LEASE_MS,
  MAX_CODEX_JOB_ATTEMPTS,
  MAX_DRAFT_REVIEW_BATCH,
  draftBatchVerdictJsonSchema,
  draftBatchVerdictSchema,
  resolveApproval,
  topicRequestVerdictJsonSchema,
  topicRequestVerdictSchema,
} from "./lib/topicReviewSchemas"
import type { Infer } from "convex/values"
import type { Doc, Id } from "./_generated/dataModel"
import type { MutationCtx } from "./_generated/server"

// The queue the local Codex worker drains. Convex never runs a model here: it
// writes a prompt, hands it out under a lease, and re-validates whatever comes
// back. A wrong or hostile answer can fail a job; it cannot write a topic.

const MAX_SUBMISSION_CHARS = 200_000
const MAX_ERROR_DETAIL_CHARS = 200
const MAX_WORKER_LABEL_CHARS = 160

const DISABLED_NOTE =
  "Automatic review is switched off on this deployment, so this request is waiting for a person."

const NO_WORKER_NOTE =
  "Review did not run in time. It will be retried once a reviewer is available."

export const workerErrorCodeValidator = v.union(
  v.literal("codex_not_found"),
  v.literal("not_logged_in"),
  v.literal("model_unsupported"),
  v.literal("rate_limited"),
  v.literal("timeout"),
  v.literal("malformed_output"),
  v.literal("exec_failed")
)

type WorkerErrorCode = Infer<typeof workerErrorCodeValidator>

// Worker environment problems a retry on the same worker cannot fix.
const terminalErrorCodes: Array<WorkerErrorCode> = [
  "codex_not_found",
  "not_logged_in",
  "model_unsupported",
]

const usageValidator = v.object({
  inputTokens: v.optional(v.number()),
  outputTokens: v.optional(v.number()),
  totalTokens: v.optional(v.number()),
})

export function reviewEnabled(env: Record<string, string | undefined>) {
  return env.TOPIC_REVIEW_ENABLED === "true"
}

function sanitizeLabel(value: string, maxLength: number) {
  return (
    [...value]
      .map((character) => {
        const codePoint = character.codePointAt(0) ?? 0
        return codePoint < 32 || codePoint === 127 ? " " : character
      })
      .join("")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength) || undefined
  )
}

async function insertJob(
  ctx: MutationCtx,
  job: {
    kind: "request" | "drafts"
    prompt: string
    requestId?: Id<"topicRequests">
    eventKeys?: Array<string>
  }
) {
  const now = Date.now()
  const jobId = await ctx.db.insert("topicReviewJobs", {
    ...job,
    status: "pending",
    attempts: 0,
    deadlineAt: now + CODEX_JOB_DEADLINE_MS,
    createdAt: now,
    updatedAt: now,
  })
  await ctx.scheduler.runAfter(
    CODEX_JOB_DEADLINE_MS,
    internal.topicReviewJobs.expireJob,
    { jobId }
  )
  return jobId
}

// MARK: - Enqueue

// Queues the review of one reader request. Every exit path leaves the reader
// with something to read: a request never sits silently pending.
export const enqueueRequestReview = internalMutation({
  args: { requestId: v.id("topicRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request || request.status !== "pending") return { queued: false }

    if (!reviewEnabled(process.env)) {
      await ctx.db.patch(args.requestId, { verdictNote: DISABLED_NOTE })
      return { queued: false }
    }
    if (request.attempts >= 3) return { queued: false }

    const open = await ctx.db
      .query("topicReviewJobs")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect()
    if (open.some((job) => job.status === "pending")) return { queued: false }

    const topics = await ctx.db.query("topics").collect()
    await ctx.db.patch(args.requestId, { attempts: request.attempts + 1 })
    await insertJob(ctx, {
      kind: "request",
      requestId: args.requestId,
      prompt: buildRequestPrompt({
        subject: request.subject,
        reason: request.reason,
        regionHint: request.regionHint,
        existingTopics: topics.map((topic) => ({
          slug: topic.slug,
          title: topic.title,
        })),
      }),
    })
    return { queued: true }
  },
})

// Requests whose review never landed — the worker was down, or a run failed
// mid-flight. Retried by cron rather than left pending forever.
export const retryStalledRequests = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (!reviewEnabled(process.env)) return { retried: 0 }
    const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const pending = await ctx.db
      .query("topicRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()
    const stalled = pending
      .filter((request) => request.createdAt < cutoff && request.attempts < 3)
      .slice(0, 5)
    for (const request of stalled) {
      await ctx.scheduler.runAfter(
        0,
        internal.topicReviewJobs.enqueueRequestReview,
        { requestId: request._id }
      )
    }
    return { retried: stalled.length }
  },
})

// One Codex run per batch of crawled drafts. Skipped entirely when a batch is
// already queued, so a slow worker cannot pile up duplicate reviews.
export const enqueueDraftReview = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (!reviewEnabled(process.env)) return { queued: 0 }
    const queued = await ctx.db
      .query("topicReviewJobs")
      .withIndex("by_status_and_createdAt", (q) => q.eq("status", "pending"))
      .take(20)
    if (queued.some((job) => job.kind === "drafts")) return { queued: 0 }

    const drafts: Array<{
      eventKey: string
      headline: string
      summary: string
      publisher: string
      publishedAt: string
      topicTitle: string
      topicSummary: string
    }> = await ctx.runQuery(internal.editorial.listReviewableDrafts, {
      limit: MAX_DRAFT_REVIEW_BATCH,
    })
    if (drafts.length === 0) return { queued: 0 }

    await insertJob(ctx, {
      kind: "drafts",
      prompt: buildDraftBatchPrompt(drafts),
      eventKeys: drafts.map((draft) => draft.eventKey),
    })
    return { queued: drafts.length }
  },
})

// MARK: - Worker lifecycle

const claimedJobValidator = v.union(
  v.null(),
  v.object({
    jobId: v.id("topicReviewJobs"),
    kind: v.union(v.literal("request"), v.literal("drafts")),
    prompt: v.string(),
    outputSchema: v.string(),
    leaseMs: v.number(),
  })
)

export const claimNext = internalMutation({
  args: { workerId: v.string(), model: v.optional(v.string()) },
  returns: claimedJobValidator,
  handler: async (ctx, args) => {
    const now = Date.now()
    const pending = await ctx.db
      .query("topicReviewJobs")
      .withIndex("by_status_and_createdAt", (q) => q.eq("status", "pending"))
      .order("asc")
      .take(10)

    for (const job of pending) {
      if (job.claimExpiresAt !== undefined && job.claimExpiresAt >= now) continue
      if (job.deadlineAt <= now) continue // expireJob will fail it
      if (job.attempts >= MAX_CODEX_JOB_ATTEMPTS) {
        await failJob(ctx, job, job.lastErrorCode ?? "exec_failed")
        continue
      }

      await ctx.db.patch(job._id, {
        attempts: job.attempts + 1,
        claimedBy: sanitizeLabel(args.workerId, MAX_WORKER_LABEL_CHARS),
        claimedAt: now,
        claimExpiresAt: now + CODEX_JOB_LEASE_MS,
        modelName: args.model
          ? sanitizeLabel(args.model, 80)
          : job.modelName,
        updatedAt: now,
      })
      return {
        jobId: job._id,
        kind: job.kind,
        prompt: job.prompt,
        outputSchema: JSON.stringify(
          job.kind === "request"
            ? topicRequestVerdictJsonSchema
            : draftBatchVerdictJsonSchema
        ),
        leaseMs: CODEX_JOB_LEASE_MS,
      }
    }
    return null
  },
})

export const renewClaim = internalMutation({
  args: { jobId: v.id("topicReviewJobs"), workerId: v.string() },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const now = Date.now()
    const job = await ctx.db.get(args.jobId)
    if (!job || !holdsClaim(job, args.workerId, now)) return { ok: false }
    await ctx.db.patch(job._id, {
      claimExpiresAt: now + CODEX_JOB_LEASE_MS,
      updatedAt: now,
    })
    return { ok: true }
  },
})

const submitResultValidator = v.union(
  v.object({ status: v.literal("accepted") }),
  v.object({ status: v.literal("duplicate") }),
  v.object({ status: v.literal("not_found") }),
  v.object({
    status: v.literal("rejected"),
    code: v.union(v.literal("claim_expired"), v.literal("invalid_output")),
  })
)

type SubmitResult = Infer<typeof submitResultValidator>

export const submit = internalMutation({
  args: {
    jobId: v.id("topicReviewJobs"),
    workerId: v.string(),
    output: v.string(),
    modelName: v.string(),
    modelRequestId: v.optional(v.string()),
    usage: v.optional(usageValidator),
  },
  returns: submitResultValidator,
  handler: async (ctx, args): Promise<SubmitResult> => {
    const now = Date.now()
    const job = await ctx.db.get(args.jobId)
    if (!job) return { status: "not_found" }
    if (job.status === "completed") return { status: "duplicate" }
    if (!holdsClaim(job, args.workerId, now)) {
      return { status: "rejected", code: "claim_expired" }
    }

    let parsed: unknown
    if (args.output.length > MAX_SUBMISSION_CHARS) {
      return await rejectSubmission(ctx, job)
    }
    try {
      parsed = JSON.parse(args.output)
    } catch {
      return await rejectSubmission(ctx, job)
    }

    if (job.kind === "request") {
      const verdict = topicRequestVerdictSchema.safeParse(parsed)
      if (!verdict.success || !job.requestId) {
        return await rejectSubmission(ctx, job)
      }
      // Applied out of band: `approve` writes a topic and a feed, and a throw
      // in that work must not roll back the job's own completion.
      await ctx.scheduler.runAfter(
        0,
        internal.topicReviewJobs.applyRequestVerdict,
        { requestId: job.requestId, verdict: JSON.stringify(verdict.data) }
      )
    } else {
      const batch = draftBatchVerdictSchema.safeParse(parsed)
      if (!batch.success) return await rejectSubmission(ctx, job)
      // A decision about a draft this job never asked about is discarded: the
      // model may only answer the questions it was given.
      const asked = new Set(job.eventKeys ?? [])
      for (const decision of batch.data.decisions) {
        if (!asked.has(decision.eventKey)) continue
        if (decision.decision === "hold") continue
        await ctx.scheduler.runAfter(
          0,
          internal.topicReviewJobs.applyDraftDecision,
          {
            eventKey: decision.eventKey,
            decision: decision.decision,
            confidence: decision.confidence,
            urgency: decision.urgency,
            whyItMatters: decision.whyItMatters,
            note: decision.note,
          }
        )
      }
    }

    await ctx.db.patch(job._id, {
      status: "completed",
      modelName: sanitizeLabel(args.modelName, 80),
      modelRequestId: args.modelRequestId
        ? sanitizeLabel(args.modelRequestId, 120)
        : undefined,
      usage: args.usage,
      updatedAt: now,
    })
    return { status: "accepted" }
  },
})

export const fail = internalMutation({
  args: {
    jobId: v.id("topicReviewJobs"),
    workerId: v.string(),
    errorCode: workerErrorCodeValidator,
    detail: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job || !holdsClaim(job, args.workerId, Date.now())) {
      return { ok: false }
    }
    const detail = args.detail
      ? sanitizeLabel(args.detail, MAX_ERROR_DETAIL_CHARS)
      : undefined

    if (
      terminalErrorCodes.includes(args.errorCode) ||
      job.attempts >= MAX_CODEX_JOB_ATTEMPTS
    ) {
      await ctx.db.patch(job._id, { lastErrorDetail: detail })
      await failJob(ctx, job, args.errorCode)
    } else {
      await ctx.db.patch(job._id, {
        claimedBy: undefined,
        claimedAt: undefined,
        claimExpiresAt: undefined,
        lastErrorCode: args.errorCode,
        lastErrorDetail: detail,
        updatedAt: Date.now(),
      })
    }
    return { ok: true }
  },
})

// No worker claimed this, or one claimed it and never came back.
export const expireJob = internalMutation({
  args: { jobId: v.id("topicReviewJobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job || job.status !== "pending") return null
    await failJob(ctx, job, "deadline_exceeded")
    return null
  },
})

// MARK: - Applying a verdict

export const applyRequestVerdict = internalMutation({
  args: { requestId: v.id("topicRequests"), verdict: v.string() },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request || request.status !== "pending") return { applied: false }

    // Re-parsed rather than trusted across the scheduler boundary.
    const verdict = topicRequestVerdictSchema.safeParse(
      JSON.parse(args.verdict)
    )
    if (!verdict.success) return { applied: false }

    const topics = await ctx.db.query("topics").collect()
    const resolved = resolveApproval(
      verdict.data,
      new Set(topics.map((topic) => topic.slug))
    )

    if (!resolved.ok) {
      await ctx.runMutation(internal.topicRequests.recordVerdict, {
        requestId: args.requestId,
        status: resolved.status,
        note: resolved.note,
        duplicateOfSlug: resolved.duplicateOfSlug,
      })
      return { applied: true }
    }

    const result: { created: boolean } = await ctx.runMutation(
      internal.topicRequests.approve,
      {
        requestId: args.requestId,
        note: verdict.data.note,
        topic: resolved.topic,
      }
    )
    if (result.created) {
      // Crawl immediately rather than waiting up to 30 minutes: an approved
      // request that shows an empty topic reads as a broken feature.
      await ctx.scheduler.runAfter(0, internal.news.refreshAllTopicNews, {})
    }
    return { applied: true }
  },
})

export const applyDraftDecision = internalMutation({
  args: {
    eventKey: v.string(),
    decision: v.union(v.literal("publish"), v.literal("discard")),
    confidence: v.union(v.literal("developing"), v.literal("corroborated")),
    urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    whyItMatters: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.decision === "discard") {
      await ctx.runMutation(internal.editorial.suppress, {
        eventKey: args.eventKey,
        reason:
          args.note ?? "Reviewed and found not to be a civic development.",
      })
      return { published: false }
    }
    // Publishing without the reader-facing sentence would ship an item with
    // nothing said about why it is there. Treat that as a hold.
    if (!args.whyItMatters) return { published: false }

    await ctx.runMutation(internal.editorial.publish, {
      eventKey: args.eventKey,
      confidence: args.confidence,
      urgency: args.urgency,
      whyItMatters: args.whyItMatters,
      // A machine-reviewed item never wakes anyone up. Alerts stay a digest
      // decision until a person has looked at the topic.
      notificationMode: "digest",
    })
    return { published: true }
  },
})

// MARK: - Shared

function holdsClaim(job: Doc<"topicReviewJobs">, workerId: string, now: number) {
  return (
    job.status === "pending" &&
    job.claimedBy === workerId &&
    (job.claimExpiresAt ?? 0) >= now
  )
}

// Marks a job dead and, when it was a reader's request, tells that reader.
async function failJob(
  ctx: MutationCtx,
  job: Doc<"topicReviewJobs">,
  errorCode: string
) {
  await ctx.db.patch(job._id, {
    status: "failed",
    lastErrorCode: errorCode,
    claimedBy: undefined,
    claimExpiresAt: undefined,
    updatedAt: Date.now(),
  })
  if (job.kind !== "request" || !job.requestId) return
  const request = await ctx.db.get(job.requestId)
  if (!request || request.status !== "pending") return
  if (request.attempts >= 3) {
    await ctx.runMutation(internal.topicRequests.recordVerdict, {
      requestId: job.requestId,
      status: "failed",
      note: "Review could not be completed. Nothing was added, and you can send this again.",
    })
    return
  }
  // Still has attempts left; the retry cron will pick it back up.
  await ctx.db.patch(job.requestId, { verdictNote: NO_WORKER_NOTE })
}

async function rejectSubmission(
  ctx: MutationCtx,
  job: Doc<"topicReviewJobs">
): Promise<SubmitResult> {
  if (job.attempts >= MAX_CODEX_JOB_ATTEMPTS) {
    await failJob(ctx, job, "malformed_output")
  } else {
    await ctx.db.patch(job._id, {
      claimedBy: undefined,
      claimedAt: undefined,
      claimExpiresAt: undefined,
      lastErrorCode: "malformed_output",
      updatedAt: Date.now(),
    })
  }
  return { status: "rejected", code: "invalid_output" }
}
