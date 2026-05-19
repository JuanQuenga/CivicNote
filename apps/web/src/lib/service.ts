import { topics } from "@/lib/topics"

export const methodologyPrinciples = [
  {
    title: "Source-first claims",
    body: "Stats, findings, and claim checks should point back to named documents, records, reports, or official pages.",
  },
  {
    title: "Separate evidence from interpretation",
    body: "The hub should show what a source proves, what it does not prove, and where a counterpoint is still credible.",
  },
  {
    title: "Action without exaggeration",
    body: "Recommended actions should match the actual pressure point: a vote, docket, agency rule, hearing, public-record request, or elected official.",
  },
  {
    title: "Currentness is visible",
    body: "Every topic should expose last-checked dates, latest developments, and the next decision point.",
  },
]

export function getServiceUpdates() {
  return topics
    .flatMap((topic) =>
      topic.updates.map((update) => ({
        ...update,
        topic: topic.shortTitle,
        slug: topic.slug,
        urgency: topic.statusBrief.urgency,
        region: topic.region,
      })),
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export function getServiceActions() {
  const urgencyRank = { high: 0, medium: 1, low: 2 } as const

  return topics
    .flatMap((topic) =>
      topic.actions.map((action) => ({
        ...action,
        topic: topic.shortTitle,
        slug: topic.slug,
        region: topic.region,
        nextDecisionPoint: topic.statusBrief.nextDecisionPoint,
      })),
    )
    .sort((a, b) => urgencyRank[a.urgency] - urgencyRank[b.urgency])
}

export function getServiceSources() {
  return topics.flatMap((topic) =>
    topic.sources.map((source, index) => ({
      ...source,
      topic: topic.shortTitle,
      slug: topic.slug,
      sourceNumber: index + 1,
      urgency: topic.statusBrief.urgency,
      region: topic.region,
    })),
  )
}

export type SearchResult = {
  id: string
  type: "topic" | "update" | "action" | "source" | "claim" | "finding"
  title: string
  body: string
  topic: string
  slug: string
  meta: string
}

export function searchService(query: string): Array<SearchResult> {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return []

  const results = topics.flatMap<SearchResult>((topic) => {
    const rows: Array<SearchResult> = [
      {
        id: `${topic.slug}-topic`,
        type: "topic",
        title: topic.title,
        body: topic.summary,
        topic: topic.shortTitle,
        slug: topic.slug,
        meta: `${topic.region} / ${topic.status}`,
      },
      ...topic.updates.map((update) => ({
        id: `${topic.slug}-update-${update.url}`,
        type: "update" as const,
        title: update.title,
        body: update.summary,
        topic: topic.shortTitle,
        slug: topic.slug,
        meta: `${update.publisher} / ${update.publishedAt}`,
      })),
      ...topic.actions.map((action) => ({
        id: `${topic.slug}-action-${action.title}`,
        type: "action" as const,
        title: action.title,
        body: `${action.description} ${action.script}`,
        topic: topic.shortTitle,
        slug: topic.slug,
        meta: `${action.audience} / ${action.difficulty}`,
      })),
      ...topic.sources.map((source) => ({
        id: `${topic.slug}-source-${source.url}`,
        type: "source" as const,
        title: source.title,
        body: source.note,
        topic: topic.shortTitle,
        slug: topic.slug,
        meta: `${source.publisher} / ${source.year}`,
      })),
      ...topic.arguments.map((argument) => ({
        id: `${topic.slug}-claim-${argument.title}`,
        type: "claim" as const,
        title: argument.title,
        body: `${argument.claim} ${argument.counterpoint}`,
        topic: topic.shortTitle,
        slug: topic.slug,
        meta: "Argument ledger",
      })),
      ...topic.findings.map((finding) => ({
        id: `${topic.slug}-finding-${finding.title}`,
        type: "finding" as const,
        title: finding.title,
        body: finding.body,
        topic: topic.shortTitle,
        slug: topic.slug,
        meta: "Finding",
      })),
    ]

    return rows
  })

  return results.filter((result) =>
    [result.title, result.body, result.topic, result.meta]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  )
}
