import { v } from "convex/values"

import { internal } from "./_generated/api"
import { action, internalMutation, query } from "./_generated/server"

const topicFeeds = [
  {
    topicSlug: "congressional-stock-trading",
    tag: "Federal ethics",
    url: "https://news.google.com/rss/search?q=congressional%20stock%20trading%20ban",
  },
  {
    topicSlug: "michigan-surveillance-stack",
    tag: "Michigan surveillance",
    url: "https://news.google.com/rss/search?q=Michigan%20license%20plate%20readers%20Flock%20privacy",
  },
  {
    topicSlug: "michigan-data-centers",
    tag: "Michigan data centers",
    url: "https://news.google.com/rss/search?q=Michigan%20data%20center%20water%20power%20moratorium",
  },
] as const

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

export const refreshAllTopicNews = action({
  args: {},
  handler: async (ctx) => {
    const fetchedAt = new Date().toISOString()
    const results = await Promise.allSettled(
      topicFeeds.map(async (feed) => {
        const response = await fetch(feed.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch ${feed.url}: ${response.status}`)
        }

        const xml = await response.text()
        const items = parseRssItems(xml, feed.topicSlug, feed.tag).slice(0, 6)
        await ctx.runMutation(internal.news.upsertTopicNewsItems, {
          fetchedAt,
          items,
        })

        return { topicSlug: feed.topicSlug, count: items.length }
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
    }
  },
})

function parseRssItems(
  xml: string,
  topicSlug: string,
  tag: string
): Array<ParsedNewsItem> {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((match) => {
    const itemXml = match[1] ?? ""
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
