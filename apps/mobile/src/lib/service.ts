import { topics } from "@/src/lib/topics"

export function getServiceUpdates() {
  return topics
    .flatMap((topic) =>
      topic.updates.map((update) => ({
        ...update,
        topic: topic.shortTitle,
        slug: topic.slug,
        urgency: topic.statusBrief.urgency,
        region: topic.region,
      }))
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
      }))
    )
    .sort((a, b) => urgencyRank[a.urgency] - urgencyRank[b.urgency])
}

export const methodologyPrinciples = [
  {
    title: "Source-first claims",
    body: "Every finding should point back to public records, reports, official pages, or named reporting.",
  },
  {
    title: "Clear claim status",
    body: "Documented, contested, unsupported, and watch mean different things and should stay visible.",
  },
  {
    title: "Action tied to leverage",
    body: "Scripts should point toward a vote, hearing, agency rule, public-record request, or official response.",
  },
]
