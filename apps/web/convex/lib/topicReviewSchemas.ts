import { z } from "zod"

// Pure schemas and gate functions for the automated topic reviewer. Nothing in
// here imports Convex or spawns anything, so it can be tested on its own and
// reused by the local Codex worker.
//
// The design follows one rule: the model's judgment is advisory, and every
// fact it returns is either re-derived in code or discarded. It cannot name a
// source, invent a publisher, or decide a jurisdiction on its own.

// The review runs through the Codex CLI on a local worker, against the
// operator's ChatGPT login. Luna is the fast tier: the verdict is constrained
// by a JSON schema and re-derived in code, so the work does not need reasoning.
export const DEFAULT_CODEX_MODEL = "gpt-5.6-luna"

// A worker holds a job for this long before another may take it, renews the
// hold while it works, and the whole job is abandoned after the deadline.
export const CODEX_JOB_LEASE_MS = 3 * 60 * 1000
export const CODEX_JOB_DEADLINE_MS = 10 * 60 * 1000
export const MAX_CODEX_JOB_ATTEMPTS = 2

// A reader may not queue an unbounded number of crawls.
export const MAX_OPEN_REQUESTS_PER_INSTALLATION = 3
export const REQUEST_WINDOW_MS = 24 * 60 * 60 * 1000
export const MAX_REQUESTS_PER_WINDOW = 5

// One Codex run reviews a batch of crawled drafts rather than one per item.
export const MAX_DRAFT_REVIEW_BATCH = 12

// Structured output is emitted in the strict style: every property present,
// optionals sent as null. This turns that wire shape back into an absent key.
function nullable<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .nullish()
    .transform((value) => (value === null ? undefined : value))
}

export const geographicScopeSchema = z.enum([
  "local",
  "state",
  "regional",
  "national",
  "international",
])

export const topicThemeSchema = z.enum([
  "ethics",
  "surveillance",
  "infrastructure",
  "future",
])

// What the reviewer returns for a reader's topic request.
//
// `verdict` is the whole decision. `note` is written for the reader, not for
// a log — a rejected request has to explain itself in one sentence.
export const topicRequestVerdictSchema = z
  .object({
    verdict: z.enum(["approve", "reject", "duplicate"]),
    note: z.string().min(10).max(240),
    duplicateOfSlug: nullable(z.string().max(80)),
    title: nullable(z.string().min(4).max(80)),
    shortTitle: nullable(z.string().min(2).max(32)),
    tagline: nullable(z.string().min(10).max(140)),
    summary: nullable(z.string().min(40).max(600)),
    tag: nullable(z.string().min(2).max(40)),
    searchQuery: nullable(z.string().min(4).max(200)),
    scope: nullable(geographicScopeSchema),
    jurisdictionKeys: nullable(z.array(z.string().max(24)).max(4)),
    theme: nullable(topicThemeSchema),
    region: nullable(z.string().min(2).max(80)),
  })
  .strict()

export type TopicRequestVerdict = z.infer<typeof topicRequestVerdictSchema>

// What the reviewer returns for one crawled draft event.
//
// It never edits the headline or the source — only decides whether the item
// is a civic development worth showing, and how firmly it can be stated.
// `eventKey` ties the decision back to the draft the prompt named; anything
// the caller did not send is dropped.
export const draftVerdictSchema = z
  .object({
    eventKey: z.string().min(1).max(200),
    decision: z.enum(["publish", "hold", "discard"]),
    confidence: z.enum(["developing", "corroborated"]),
    urgency: z.enum(["low", "medium", "high"]),
    whyItMatters: nullable(z.string().min(30).max(400)),
    note: nullable(z.string().max(200)),
  })
  .strict()

export type DraftVerdict = z.infer<typeof draftVerdictSchema>

export const draftBatchVerdictSchema = z
  .object({
    decisions: z.array(draftVerdictSchema).max(MAX_DRAFT_REVIEW_BATCH),
  })
  .strict()

export type DraftBatchVerdict = z.infer<typeof draftBatchVerdictSchema>

// JSON Schema equivalents for harnesses that take a schema file
// (`codex exec --output-schema`). Written in the strict style structured
// outputs require: additionalProperties false, every property in required,
// optionals nullable. Kept beside the zod schemas so the two stay in step.
export const topicRequestVerdictJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "verdict",
    "note",
    "duplicateOfSlug",
    "title",
    "shortTitle",
    "tagline",
    "summary",
    "tag",
    "searchQuery",
    "scope",
    "jurisdictionKeys",
    "theme",
    "region",
  ],
  properties: {
    verdict: { type: "string", enum: ["approve", "reject", "duplicate"] },
    note: { type: "string", minLength: 10, maxLength: 240 },
    duplicateOfSlug: { type: ["string", "null"], maxLength: 80 },
    title: { type: ["string", "null"], minLength: 4, maxLength: 80 },
    shortTitle: { type: ["string", "null"], minLength: 2, maxLength: 32 },
    tagline: { type: ["string", "null"], minLength: 10, maxLength: 140 },
    summary: { type: ["string", "null"], minLength: 40, maxLength: 600 },
    tag: { type: ["string", "null"], minLength: 2, maxLength: 40 },
    searchQuery: { type: ["string", "null"], minLength: 4, maxLength: 200 },
    scope: { enum: [...geographicScopeSchema.options, null] },
    jurisdictionKeys: {
      type: ["array", "null"],
      maxItems: 4,
      items: { type: "string", maxLength: 24 },
    },
    theme: { enum: [...topicThemeSchema.options, null] },
    region: { type: ["string", "null"], minLength: 2, maxLength: 80 },
  },
} as const

export const draftBatchVerdictJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["decisions"],
  properties: {
    decisions: {
      type: "array",
      maxItems: MAX_DRAFT_REVIEW_BATCH,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "eventKey",
          "decision",
          "confidence",
          "urgency",
          "whyItMatters",
          "note",
        ],
        properties: {
          eventKey: { type: "string", minLength: 1, maxLength: 200 },
          decision: { type: "string", enum: ["publish", "hold", "discard"] },
          confidence: {
            type: "string",
            enum: ["developing", "corroborated"],
          },
          urgency: { type: "string", enum: ["low", "medium", "high"] },
          whyItMatters: { type: ["string", "null"], minLength: 30, maxLength: 400 },
          note: { type: ["string", "null"], maxLength: 200 },
        },
      },
    },
  },
} as const

// Approval carries a topic definition, so an approve verdict missing any of
// it is not an approval. Returns the completed shape or a rejection reason.
export function resolveApproval(
  verdict: TopicRequestVerdict,
  existingSlugs: ReadonlySet<string>
):
  | { ok: true; topic: ApprovedTopic }
  | { ok: false; status: "rejected" | "duplicate"; note: string; duplicateOfSlug?: string } {
  if (verdict.verdict === "duplicate") {
    const slug = verdict.duplicateOfSlug ?? ""
    return {
      ok: false,
      status: "duplicate",
      note: verdict.note,
      duplicateOfSlug: existingSlugs.has(slug) ? slug : undefined,
    }
  }
  if (verdict.verdict === "reject") {
    return { ok: false, status: "rejected", note: verdict.note }
  }

  const required = {
    title: verdict.title,
    shortTitle: verdict.shortTitle,
    tagline: verdict.tagline,
    summary: verdict.summary,
    tag: verdict.tag,
    searchQuery: verdict.searchQuery,
    scope: verdict.scope,
    theme: verdict.theme,
    region: verdict.region,
  }
  const missing = Object.entries(required)
    .filter(([, value]) => value === undefined || value === "")
    .map(([key]) => key)
  if (missing.length > 0) {
    return {
      ok: false,
      status: "rejected",
      note: "The reviewer approved this subject but did not describe it completely enough to start a feed.",
    }
  }

  const slug = slugify(required.title as string)
  if (!slug) {
    return {
      ok: false,
      status: "rejected",
      note: "The reviewer's title did not reduce to a usable identifier.",
    }
  }
  if (existingSlugs.has(slug)) {
    return {
      ok: false,
      status: "duplicate",
      note: "CivicNote already tracks a topic under this name.",
      duplicateOfSlug: slug,
    }
  }

  return {
    ok: true,
    topic: {
      slug,
      title: required.title as string,
      shortTitle: required.shortTitle as string,
      tagline: required.tagline as string,
      summary: required.summary as string,
      tag: required.tag as string,
      searchQuery: required.searchQuery as string,
      scope: required.scope as z.infer<typeof geographicScopeSchema>,
      // Jurisdiction keys are matched against what the deployment actually
      // knows. An invented key would silently filter the topic out of every
      // reader's feed, which looks identical to the crawl finding nothing.
      jurisdictionKeys: (verdict.jurisdictionKeys ?? []).filter((key) =>
        /^[a-z]{2}(-[a-z0-9-]{1,20})?$/.test(key)
      ),
      theme: required.theme as z.infer<typeof topicThemeSchema>,
      region: required.region as string,
    },
  }
}

export type ApprovedTopic = {
  slug: string
  title: string
  shortTitle: string
  tagline: string
  summary: string
  tag: string
  searchQuery: string
  scope: z.infer<typeof geographicScopeSchema>
  jurisdictionKeys: Array<string>
  theme: z.infer<typeof topicThemeSchema>
  region: string
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "")
}

// A reader's free text reaches a model prompt, so it is bounded and stripped
// of the delimiters the prompt uses to separate instructions from input.
export function sanitizeSubject(value: string) {
  return value
    .split("")
    .map((char) => (char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x7f ? " " : char))
    .join("")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200)
}
