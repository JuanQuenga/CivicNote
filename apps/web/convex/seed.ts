import { mutation } from "./_generated/server"
import { seedTopics } from "./seedTopics"

export const defaultTopics = mutation({
  args: {},
  handler: async (ctx) => {
    for (const topic of seedTopics) {
      const existing = await ctx.db
        .query("topics")
        .withIndex("by_slug", (q) => q.eq("slug", topic.slug))
        .unique()

      if (existing) {
        await ctx.db.patch(existing._id, topic)
      } else {
        await ctx.db.insert("topics", topic)
      }
    }

    return { upserted: seedTopics.length }
  },
})
