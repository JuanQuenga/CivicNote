import { v } from "convex/values"

import { internal } from "./_generated/api"
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server"
import { geographicScope, googleNewsFeedUrl } from "./lib/validators"
import type { Doc } from "./_generated/dataModel"

// The six feeds CivicNote shipped with. They now live in the `topicFeeds`
// table alongside reader-requested ones; this array only seeds that table the
// first time the crawler runs against an empty deployment.
const editorialFeeds = [
  {
    topicSlug: "congressional-stock-trading",
    tag: "Federal ethics",
    query: "congressional stock trading ban",
    scope: "national" as const,
    jurisdictionKeys: ["us"],
  },
  {
    topicSlug: "michigan-surveillance-stack",
    tag: "Michigan surveillance",
    query: "Michigan license plate readers Flock privacy",
    scope: "state" as const,
    jurisdictionKeys: ["us-mi"],
  },
  {
    topicSlug: "michigan-data-centers",
    tag: "Michigan data centers",
    query: "Michigan data center water power moratorium",
    scope: "state" as const,
    jurisdictionKeys: ["us-mi"],
  },
  {
    topicSlug: "glyphosate-health-environment",
    tag: "Glyphosate",
    query: "glyphosate EPA IARC health environment",
    scope: "national" as const,
    jurisdictionKeys: ["us"],
  },
  {
    topicSlug: "israel-gaza-us-influence",
    tag: "Israel Gaza",
    query: "Israel Gaza genocide ICJ AIPAC Congress",
    scope: "international" as const,
    jurisdictionKeys: [],
  },
  {
    topicSlug: "voter-fraud-claims-election-rules",
    tag: "Election rules",
    query: "Trump voter fraud mail voting executive order 2026",
    scope: "national" as const,
    jurisdictionKeys: ["us"],
  },
]

type ParsedNewsItem = {
  topicSlug: string
  title: string
  publisher: string
  publishedAt: string
  url: string
  summary: string
  tag: string
}

export const latestByTopic = query({
  args: {
    topicSlug: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6
    const items = await ctx.db
      .query("topicNewsItems")
      .withIndex("by_topic", (q) => q.eq("topicSlug", args.topicSlug))
      .collect()

    return items
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, limit)
  },
})

// Fills `topicFeeds` from `editorialFeeds` on a deployment that has never had
// the table. Idempotent: an existing slug is left exactly as it is, so an
// edited feed is never overwritten by the shipped default.
export const seedEditorialFeeds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const createdAt = new Date().toISOString()
    let created = 0
    for (const feed of editorialFeeds) {
      const existing = await ctx.db
        .query("topicFeeds")
        .withIndex("by_slug", (q) => q.eq("topicSlug", feed.topicSlug))
        .unique()
      if (existing) continue
      await ctx.db.insert("topicFeeds", {
        ...feed,
        url: googleNewsFeedUrl(feed.query),
        source: "editorial",
        active: true,
        createdAt,
      })
      created += 1
    }
    return { created }
  },
})

export const listActiveFeeds = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("topicFeeds")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect()
  },
})

export const recordCrawlResult = internalMutation({
  args: {
    feedId: v.id("topicFeeds"),
    crawledAt: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.feedId, {
      lastCrawledAt: args.crawledAt,
      lastCrawlError: args.error,
    })
  },
})

export const refreshAllTopicNews = internalAction({
  args: {},
  handler: async (ctx) => {
    const fetchedAt = new Date().toISOString()
    await ctx.runMutation(internal.news.seedEditorialFeeds, {})
    // Annotated because `internal.news` refers back into this file, and
    // inference through that cycle collapses to `any`.
    const feeds: Array<Doc<"topicFeeds">> = await ctx.runQuery(
      internal.news.listActiveFeeds,
      {}
    )

    const results = await Promise.allSettled(
      feeds.map(async (feed) => {
        try {
          const response = await fetch(feed.url)
          if (!response.ok) {
            throw new Error(`Failed to fetch ${feed.url}: ${response.status}`)
          }

          const xml = await response.text()
          const items = parseRssItems(xml, feed.topicSlug, feed.tag).slice(0, 6)
          await ctx.runMutation(internal.news.upsertTopicNewsItems, {
            fetchedAt,
            scope: feed.scope,
            jurisdictionKeys: feed.jurisdictionKeys,
            items,
          })
          await ctx.runMutation(internal.news.recordCrawlResult, {
            feedId: feed._id,
            crawledAt: fetchedAt,
          })
          return { topicSlug: feed.topicSlug, count: items.length }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error"
          // A feed that 404s should not go silent. Recording the failure on the
          // row is what makes a stale reader-requested feed visible later.
          await ctx.runMutation(internal.news.recordCrawlResult, {
            feedId: feed._id,
            crawledAt: fetchedAt,
            error: message,
          })
          throw error
        }
      })
    )

    return results.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : {
            error:
              result.reason instanceof Error
                ? result.reason.message
                : "Unknown error",
          }
    )
  },
})

export const upsertTopicNewsItems = internalMutation({
  args: {
    fetchedAt: v.string(),
    scope: geographicScope,
    jurisdictionKeys: v.array(v.string()),
    items: v.array(
      v.object({
        topicSlug: v.string(),
        title: v.string(),
        publisher: v.string(),
        publishedAt: v.string(),
        url: v.string(),
        summary: v.string(),
        tag: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const item of args.items) {
      const existing = await ctx.db
        .query("topicNewsItems")
        .withIndex("by_url", (q) => q.eq("url", item.url))
        .unique()

      if (existing) {
        await ctx.db.patch(existing._id, { ...item, fetchedAt: args.fetchedAt })
      } else {
        await ctx.db.insert("topicNewsItems", {
          ...item,
          fetchedAt: args.fetchedAt,
        })
      }

      const source = await ctx.db
        .query("sourceDocuments")
        .withIndex("by_url", (q) => q.eq("url", item.url))
        .unique()
      const sourceId =
        source?._id ??
        (await ctx.db.insert("sourceDocuments", {
          key: `rss:${stableHash(item.url)}`,
          title: item.title,
          publisher: item.publisher,
          url: item.url,
          documentType: "reporting",
          publishedAt: item.publishedAt,
          retrievedAt: args.fetchedAt,
          jurisdictionKeys: args.jurisdictionKeys,
          provenanceNote:
            "Discovered through Google News RSS; requires editorial verification before publication.",
          reliability: "reported",
        }))
      if (source) {
        await ctx.db.patch(source._id, {
          title: item.title,
          publisher: item.publisher,
          publishedAt: item.publishedAt,
          retrievedAt: args.fetchedAt,
        })
      }

      const eventKey = `${item.topicSlug}-news-${stableHash(item.url)}`
      const event = await ctx.db
        .query("civicEvents")
        .withIndex("by_key", (q) => q.eq("key", eventKey))
        .unique()
      const draft = {
        topicSlugs: [item.topicSlug],
        headline: item.title,
        summary: item.summary,
        whyItMatters:
          "This report may represent a civic development. Verify the underlying record, affected jurisdiction, and decision point before alerting subscribers.",
        eventKind: "breaking_news" as const,
        geographicScope: args.scope,
        jurisdictionKeys: args.jurisdictionKeys,
        urgency: "medium" as const,
        confidence: "developing" as const,
        lifecycleStatus: "open" as const,
        publicationStatus: "draft" as const,
        notificationStatus: "suppressed" as const,
        notificationMode: "none" as const,
        happenedAt: item.publishedAt,
        publishedAt: item.publishedAt,
        updatedAt: args.fetchedAt,
        sourceDocumentIds: [sourceId],
        deepLinkPath: `/alerts/${eventKey}`,
      }
      if (!event) {
        await ctx.db.insert("civicEvents", { key: eventKey, ...draft })
      } else if (event.publicationStatus === "draft") {
        await ctx.db.patch(event._id, draft)
      }
    }
  },
})


function stableHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function parseRssItems(
  xml: string,
  topicSlug: string,
  tag: string
): Array<ParsedNewsItem> {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((match) => {
    const itemXml = match[1]
    const title = decodeXml(readTag(itemXml, "title"))
    const url = decodeXml(readTag(itemXml, "link"))
    const publishedAt = normalizeDate(readTag(itemXml, "pubDate"))
    const rawSource = readTag(itemXml, "source")
    const publisher = decodeXml(rawSource.replace(/<[^>]*>/g, "")) || "News"
    const summary = decodeXml(
      readTag(itemXml, "description").replace(/<[^>]*>/g, "")
    )

    return {
      topicSlug,
      title,
      publisher,
      publishedAt,
      url,
      summary: summary || "Latest coverage related to this topic.",
      tag,
    }
  })
}

function readTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return match?.[1]?.trim() ?? ""
}

function normalizeDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString()
}

function decodeXml(value: string) {
  return value
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .trim()
}
