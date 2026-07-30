import { z } from "zod"

// Pure schemas and gate functions for the automated topic reviewer. Nothing in
// here imports Convex or the AI SDK, so it can be tested without either.
//
// The design follows one rule: the model's judgment is advisory, and every
// fact it returns is either re-derived in code or discarded. It cannot name a
// source, invent a publisher, or decide a jurisdiction on its own.

export const TOPIC_REVIEW_MODEL = "grok-4.5"

// A reader may not queue an unbounded number of crawls.
export const MAX_OPEN_REQUESTS_PER_INSTALLATION = 3
export const REQUEST_WINDOW_MS = 24 * 60 * 60 * 1000
export const MAX_REQUESTS_PER_WINDOW = 5

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
    duplicateOfSlug: z.string().max(80).optional(),
    title: z.string().min(4).max(80).optional(),
    shortTitle: z.string().min(2).max(32).optional(),
    tagline: z.string().min(10).max(140).optional(),
    summary: z.string().min(40).max(600).optional(),
    tag: z.string().min(2).max(40).optional(),
    searchQuery: z.string().min(4).max(200).optional(),
    scope: geographicScopeSchema.optional(),
    jurisdictionKeys: z.array(z.string().max(24)).max(4).optional(),
    theme: topicThemeSchema.optional(),
    region: z.string().min(2).max(80).optional(),
  })
  .strict()

export type TopicRequestVerdict = z.infer<typeof topicRequestVerdictSchema>

// What the reviewer returns for one crawled draft event.
//
// It never edits the headline or the source — only decides whether the item
// is a civic development worth showing, and how firmly it can be stated.
export const draftVerdictSchema = z
  .object({
    decision: z.enum(["publish", "hold", "discard"]),
    confidence: z.enum(["developing", "corroborated"]),
    urgency: z.enum(["low", "medium", "high"]),
    whyItMatters: z.string().min(30).max(400),
    note: z.string().max(200).optional(),
  })
  .strict()

export type DraftVerdict = z.infer<typeof draftVerdictSchema>

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
