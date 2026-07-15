import { v } from "convex/values"

import { internalMutation } from "./_generated/server"

export const backfillPushDeviceProviders = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = Math.min(
      Math.max(Math.floor(args.batchSize ?? 100), 1),
      500
    )
    const page = await ctx.db.query("pushDevices").order("asc").paginate({
      cursor: args.cursor ?? null,
      numItems: batchSize,
    })
    let updated = 0
    for (const device of page.page) {
      if (!device.provider) {
        await ctx.db.patch(device._id, { provider: "expo" })
        updated += 1
      }
    }
    return {
      updated,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})
