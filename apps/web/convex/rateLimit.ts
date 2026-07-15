import type { MutationCtx } from "./_generated/server"

export async function enforceRateLimit(
  ctx: MutationCtx,
  key: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now()
  const existing = await ctx.db
    .query("apiRateLimits")
    .withIndex("by_key", (query) => query.eq("key", key))
    .unique()

  if (!existing || now - existing.windowStartedAt >= windowMs) {
    if (existing) {
      await ctx.db.patch(existing._id, {
        windowStartedAt: now,
        count: 1,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("apiRateLimits", {
        key,
        windowStartedAt: now,
        count: 1,
        updatedAt: now,
      })
    }
    return
  }

  if (existing.count >= limit) {
    throw new Error("Too many requests. Please try again shortly.")
  }

  await ctx.db.patch(existing._id, {
    count: existing.count + 1,
    updatedAt: now,
  })
}
