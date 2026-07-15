import { internalMutation } from "./_generated/server"
import { seedCivicFoundation } from "./seedCivic"
import { seedTopics } from "./seedTopics"

export const defaultTopics = internalMutation({
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

    const civic = await seedCivicFoundation(ctx)

    return { upserted: seedTopics.length, civic }
  },
})
