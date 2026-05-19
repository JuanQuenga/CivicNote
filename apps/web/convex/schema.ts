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
      v.literal("future"),
    ),
    updatedAt: v.string(),
    stats: v.array(stat),
    arguments: v.array(argument),
    findings: v.array(finding),
    actions: v.array(v.string()),
    sources: v.array(source),
  }).index("by_slug", ["slug"]),
})
