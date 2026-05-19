import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const source = v.object({
  title: v.string(),
  publisher: v.string(),
  year: v.number(),
  url: v.string(),
  note: v.string(),
})

const stat = v.object({
  value: v.string(),
  label: v.string(),
  sourceIndexes: v.array(v.number()),
})

const argument = v.object({
  title: v.string(),
  claim: v.string(),
  counterpoint: v.string(),
  sourceIndexes: v.array(v.number()),
})

const finding = v.object({
  title: v.string(),
  body: v.string(),
  sourceIndexes: v.array(v.number()),
})

const statusBrief = v.object({
  headline: v.string(),
  summary: v.string(),
  latestDevelopment: v.string(),
  nextDecisionPoint: v.string(),
  whoCanAct: v.string(),
  urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  lastChecked: v.string(),
})

const action = v.object({
  title: v.string(),
  description: v.string(),
  audience: v.string(),
  difficulty: v.string(),
  urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  ctaLabel: v.string(),
  ctaUrl: v.optional(v.string()),
  script: v.string(),
})

const timelineItem = v.object({
  date: v.string(),
  title: v.string(),
  description: v.string(),
  sourceIndexes: v.array(v.number()),
})

const update = v.object({
  title: v.string(),
  publisher: v.string(),
  publishedAt: v.string(),
  url: v.string(),
  summary: v.string(),
  tag: v.string(),
})

export default defineSchema({
  topics: defineTable({
    slug: v.string(),
    topicNumber: v.string(),
    title: v.string(),
    shortTitle: v.string(),
    tagline: v.string(),
    summary: v.string(),
    region: v.string(),
    status: v.string(),
    theme: v.union(
      v.literal("ethics"),
      v.literal("surveillance"),
      v.literal("infrastructure"),
      v.literal("future")
    ),
    updatedAt: v.string(),
    stats: v.array(stat),
    arguments: v.array(argument),
    findings: v.array(finding),
    statusBrief,
    actions: v.array(action),
    timeline: v.array(timelineItem),
    updates: v.array(update),
    modules: v.array(v.any()),
    sources: v.array(source),
  }).index("by_slug", ["slug"]),
  topicNewsItems: defineTable({
    topicSlug: v.string(),
    title: v.string(),
    publisher: v.string(),
    publishedAt: v.string(),
    url: v.string(),
    summary: v.string(),
    tag: v.string(),
    fetchedAt: v.string(),
  })
    .index("by_topic", ["topicSlug"])
    .index("by_url", ["url"]),
})
