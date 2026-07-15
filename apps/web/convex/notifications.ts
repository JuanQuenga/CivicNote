import { internalMutation } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"
import type { Doc } from "./_generated/dataModel"

const urgencyRank = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
} as const

export const matchPendingEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("civicEvents")
      .withIndex("by_publication_notification", (q) =>
        q
          .eq("publicationStatus", "published")
          .eq("notificationStatus", "pending")
      )
      .take(50)
    let created = 0
    const jurisdictionHierarchyCache = new Map<string, Array<string>>()

    for (const event of events) {
      if (event.notificationMode === "none") {
        await ctx.db.patch(event._id, { notificationStatus: "suppressed" })
        continue
      }
      const eventJurisdictionKeys = new Set(event.jurisdictionKeys)
      for (const key of event.jurisdictionKeys) {
        const hierarchy = await getJurisdictionHierarchy(
          ctx,
          key,
          jurisdictionHierarchyCache
        )
        for (const hierarchyKey of hierarchy)
          eventJurisdictionKeys.add(hierarchyKey)
      }

      for (const topicSlug of event.topicSlugs) {
        const subscriptions = await ctx.db
          .query("subscriptions")
          .withIndex("by_topic_active", (q) =>
            q.eq("topicSlug", topicSlug).eq("isActive", true)
          )
          .collect()

        for (const subscription of subscriptions) {
          if (
            urgencyRank[event.urgency] <
            urgencyRank[subscription.minimumUrgency]
          ) {
            continue
          }
          if (
            subscription.eventKinds.length > 0 &&
            !subscription.eventKinds.includes(event.eventKind)
          ) {
            continue
          }

          const profile = await ctx.db.get(subscription.profileId)
          if (!profile?.notificationsEnabled) continue
          const subscriberJurisdictions =
            subscription.jurisdictionKeys.length > 0
              ? subscription.jurisdictionKeys
              : profile.homeJurisdictionKeys
          const subscriberJurisdictionKeys = new Set<string>()
          for (const key of subscriberJurisdictions) {
            const hierarchy = await getJurisdictionHierarchy(
              ctx,
              key,
              jurisdictionHierarchyCache
            )
            for (const hierarchyKey of hierarchy) {
              subscriberJurisdictionKeys.add(hierarchyKey)
            }
          }
          const matchedJurisdictionKeys = [
            ...subscriberJurisdictionKeys,
          ].filter((key) => eventJurisdictionKeys.has(key))
          const broadScope =
            event.geographicScope === "national" ||
            event.geographicScope === "international"
          if (
            !broadScope &&
            (subscriberJurisdictions.length === 0 ||
              matchedJurisdictionKeys.length === 0)
          ) {
            continue
          }

          const key = `${event._id}:${profile._id}`
          const existing = await ctx.db
            .query("notificationCandidates")
            .withIndex("by_key", (q) => q.eq("key", key))
            .unique()
          if (existing) continue

          const cadence =
            event.notificationMode === "digest" &&
            subscription.cadence === "instant"
              ? "daily"
              : subscription.cadence
          const now = new Date()
          await ctx.db.insert("notificationCandidates", {
            key,
            profileId: profile._id,
            subscriptionId: subscription._id,
            eventId: event._id,
            topicSlug,
            matchedJurisdictionKeys,
            reason: buildMatchReason(
              topicSlug,
              matchedJurisdictionKeys,
              subscription.position
            ),
            title: event.headline.slice(0, 100),
            body: event.summary.slice(0, 180),
            deepLinkPath: event.deepLinkPath,
            urgency: event.urgency,
            cadence,
            status: "pending",
            scheduledAt: getScheduledAt(cadence, profile, now),
            createdAt: now.toISOString(),
          })
          created += 1
        }
      }
      await ctx.db.patch(event._id, { notificationStatus: "matched" })
    }

    return { events: events.length, candidates: created }
  },
})

async function getJurisdictionHierarchy(
  ctx: MutationCtx,
  key: string,
  cache: Map<string, Array<string>>
) {
  const cached = cache.get(key)
  if (cached) return cached
  const hierarchy = [key]
  let currentKey: string | undefined = key
  for (let depth = 0; currentKey && depth < 6; depth += 1) {
    const lookupKey: string = currentKey
    const jurisdiction: Doc<"jurisdictions"> | null = await ctx.db
      .query("jurisdictions")
      .withIndex("by_key", (q) => q.eq("key", lookupKey))
      .unique()
    currentKey = jurisdiction?.parentKey
    if (currentKey) hierarchy.push(currentKey)
  }
  cache.set(key, hierarchy)
  return hierarchy
}

function buildMatchReason(
  topicSlug: string,
  jurisdictionKeys: Array<string>,
  position: "oppose" | "support" | "monitor"
) {
  const geography =
    jurisdictionKeys.length > 0 ? ` in ${jurisdictionKeys.join(", ")}` : ""
  return `You chose to ${position} ${topicSlug.replaceAll("-", " ")}${geography}.`
}

function getScheduledAt(
  cadence: "instant" | "daily" | "weekly",
  profile: { digestHourUtc: number; digestDayOfWeekUtc: number },
  now: Date
) {
  if (cadence === "instant") return now.toISOString()

  const scheduled = new Date(now)
  scheduled.setUTCMinutes(0, 0, 0)
  scheduled.setUTCHours(profile.digestHourUtc)
  if (scheduled <= now) scheduled.setUTCDate(scheduled.getUTCDate() + 1)

  if (cadence === "weekly") {
    const daysUntil =
      (profile.digestDayOfWeekUtc - scheduled.getUTCDay() + 7) % 7
    scheduled.setUTCDate(scheduled.getUTCDate() + daysUntil)
  }
  return scheduled.toISOString()
}
