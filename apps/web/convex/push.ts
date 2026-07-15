import { makeFunctionReference } from "convex/server"
import { v } from "convex/values"

import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server"
import { deviceProvider } from "./lib/pushProviders"
import { enforceRateLimit } from "./rateLimit"
import type { MutationCtx } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts"
const MAX_BATCH_SIZE = 100
const MAX_ATTEMPTS = 3

type ClaimedDelivery = {
  candidateId: Id<"notificationCandidates">
  deliveryId: Id<"notificationDeliveries">
  deviceId: Id<"pushDevices">
  provider: "expo" | "apns" | "webpush"
  token: string
  apnsEnvironment?: "development" | "production"
  webPushEndpoint?: string
  webPushP256dh?: string
  webPushAuth?: string
  title: string
  body: string
  deepLinkPath: string
  eventKey: string
  urgency: "low" | "medium" | "high" | "critical"
}

type ProviderResult = {
  deliveryId: Id<"notificationDeliveries">
  ok: boolean
  ticketId?: string
  errorCode?: string
  errorMessage?: string
}

type AcceptedTicket = {
  deliveryId: Id<"notificationDeliveries">
  ticketId: string
}

type ReceiptResult = {
  deliveryId: Id<"notificationDeliveries">
  delivered: boolean
  errorCode?: string
  errorMessage?: string
}

const claimDueDeliveriesRef = makeFunctionReference<
  "mutation",
  Record<string, never>,
  Array<ClaimedDelivery>
>("push:claimDueDeliveries")

const recoverStuckRef = makeFunctionReference<
  "mutation",
  { olderThan: string },
  number
>("push:recoverStuck")

const recordProviderResultsRef = makeFunctionReference<
  "mutation",
  { results: Array<ProviderResult> },
  null
>("push:recordProviderResults")

const listAcceptedTicketsRef = makeFunctionReference<
  "query",
  Record<string, never>,
  Array<AcceptedTicket>
>("push:listAcceptedTickets")

const recordReceiptResultsRef = makeFunctionReference<
  "mutation",
  { results: Array<ReceiptResult> },
  null
>("push:recordReceiptResults")

const expireAcceptedTicketsRef = makeFunctionReference<
  "mutation",
  { olderThan: string },
  number
>("push:expireAcceptedTickets")

const sendApnsBatchRef = makeFunctionReference<
  "action",
  {
    deliveries: Array<{
      deliveryId: Id<"notificationDeliveries">
      token: string
      apnsEnvironment?: "development" | "production"
      title: string
      body: string
      deepLinkPath: string
      eventKey: string
      urgency: "low" | "medium" | "high" | "critical"
    }>
  },
  Array<ProviderResult>
>("apnsNode:sendBatch")

export const registerDevice = internalMutation({
  args: {
    installationId: v.string(),
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android"), v.literal("web")),
    appVersion: v.optional(v.string()),
    deviceLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isExpoPushToken(args.token)) {
      throw new Error("A valid Expo push token is required")
    }
    const profile = await ctx.db
      .query("civicProfiles")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId)
      )
      .unique()
    if (!profile)
      throw new Error("Create a civic profile before registering push")

    const now = new Date().toISOString()
    const existing = await ctx.db
      .query("pushDevices")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique()
    const device = {
      profileId: profile._id,
      token: args.token,
      provider: "expo" as const,
      platform: args.platform,
      appVersion: cleanOptional(args.appVersion, 50),
      deviceLabel: cleanOptional(args.deviceLabel, 100),
      isActive: true,
      lastRegisteredAt: now,
      disabledReason: undefined,
    }

    if (existing) {
      await ctx.db.patch(existing._id, device)
      return existing._id
    }
    return await ctx.db.insert("pushDevices", device)
  },
})

export const unregisterDevice = internalMutation({
  args: { installationId: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    await enforceRateLimit(
      ctx,
      `push-unregister:${args.installationId}`,
      10,
      60_000
    )
    const device = await ctx.db
      .query("pushDevices")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique()
    if (!device) return false
    const profile = await ctx.db.get(device.profileId)
    if (!profile || profile.installationId !== args.installationId) return false
    await ctx.db.patch(device._id, {
      isActive: false,
      disabledReason: "unregistered",
    })
    return true
  },
})

export const dispatchPending = internalAction({
  args: {},
  handler: async (ctx) => {
    const olderThan = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    await ctx.runMutation(recoverStuckRef, { olderThan })
    const deliveries = await ctx.runMutation(claimDueDeliveriesRef, {})
    if (deliveries.length === 0) return { attempted: 0, accepted: 0 }

    const expoDeliveries = deliveries.filter(
      (delivery) => delivery.provider === "expo"
    )
    const apnsDeliveries = deliveries.filter(
      (delivery) => delivery.provider === "apns"
    )
    const webPushDeliveries = deliveries.filter(
      (delivery) => delivery.provider === "webpush"
    )
    const providerResults: Array<ProviderResult> = []

    for (
      let offset = 0;
      offset < expoDeliveries.length;
      offset += MAX_BATCH_SIZE
    ) {
      providerResults.push(
        ...(await sendExpoBatch(
          expoDeliveries.slice(offset, offset + MAX_BATCH_SIZE)
        ))
      )
    }
    if (apnsDeliveries.length > 0) {
      providerResults.push(
        ...(await ctx.runAction(sendApnsBatchRef, {
          deliveries: apnsDeliveries.map((delivery) => ({
            deliveryId: delivery.deliveryId,
            token: delivery.token,
            apnsEnvironment: delivery.apnsEnvironment,
            title: delivery.title,
            body: delivery.body,
            deepLinkPath: delivery.deepLinkPath,
            eventKey: delivery.eventKey,
            urgency: delivery.urgency,
          })),
        }))
      )
    }
    providerResults.push(...sendWebPushStub(webPushDeliveries))
    if (providerResults.length > 0) {
      await ctx.runMutation(recordProviderResultsRef, {
        results: providerResults,
      })
    }
    return {
      attempted: deliveries.length,
      accepted: providerResults.filter((result) => result.ok).length,
    }
  },
})

export const checkReceipts = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(expireAcceptedTicketsRef, {
      olderThan: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    })
    const tickets = await ctx.runQuery(listAcceptedTicketsRef, {})
    if (tickets.length === 0) return { checked: 0, delivered: 0 }
    const results = await getExpoReceipts(tickets)
    await ctx.runMutation(recordReceiptResultsRef, { results })
    return {
      checked: results.length,
      delivered: results.filter((result) => result.delivered).length,
    }
  },
})

export const listAcceptedTickets = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<AcceptedTicket>> => {
    const deliveries = await ctx.db
      .query("notificationDeliveries")
      .withIndex("by_status", (q) => q.eq("status", "accepted"))
      .order("desc")
      .take(1000)
    return deliveries.flatMap((delivery) =>
      delivery.provider === "expo" && delivery.providerTicketId
        ? [{ deliveryId: delivery._id, ticketId: delivery.providerTicketId }]
        : []
    )
  },
})

export const expireAcceptedTickets = internalMutation({
  args: { olderThan: v.string() },
  handler: async (ctx, args) => {
    const deliveries = await ctx.db
      .query("notificationDeliveries")
      .withIndex("by_status", (q) => q.eq("status", "accepted"))
      .order("asc")
      .take(1000)
    let expired = 0
    for (const delivery of deliveries) {
      if (delivery.attemptedAt >= args.olderThan) break
      if (delivery.provider !== "expo") continue
      await ctx.db.patch(delivery._id, {
        status: "failed",
        errorCode: "ReceiptExpired",
        errorMessage: "Expo did not return a delivery receipt within 24 hours",
        completedAt: new Date().toISOString(),
      })
      const candidate = await ctx.db.get(delivery.candidateId)
      if (candidate) {
        const scheduledAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
        await ctx.db.patch(candidate._id, {
          status: delivery.attempt < MAX_ATTEMPTS ? "pending" : "failed",
          scheduledAt,
          completedAt:
            delivery.attempt < MAX_ATTEMPTS ? undefined : scheduledAt,
        })
        await settleDigestFollowers(
          ctx,
          candidate._id,
          delivery.attempt < MAX_ATTEMPTS ? "pending" : "failed",
          scheduledAt
        )
      }
      expired += 1
    }
    return expired
  },
})

export const recoverStuck = internalMutation({
  args: { olderThan: v.string() },
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("notificationCandidates")
      .withIndex("by_status_scheduled", (q) => q.eq("status", "sending"))
      .take(100)
    let recovered = 0
    for (const candidate of candidates) {
      if (candidate.lastAttemptAt && candidate.lastAttemptAt > args.olderThan)
        continue
      await ctx.db.patch(candidate._id, {
        status: "pending",
        scheduledAt: new Date().toISOString(),
        digestLeaderId: undefined,
        skipReason: undefined,
      })
      recovered += 1
    }
    return recovered
  },
})

export const claimDueDeliveries = internalMutation({
  args: {},
  handler: async (ctx): Promise<Array<ClaimedDelivery>> => {
    const now = new Date()
    const nowIso = now.toISOString()
    const candidates = await ctx.db
      .query("notificationCandidates")
      .withIndex("by_status_scheduled", (q) =>
        q.eq("status", "pending").lte("scheduledAt", nowIso)
      )
      .take(100)
    const claimed: Array<ClaimedDelivery> = []
    const digestGroups = new Map<string, Array<Doc<"notificationCandidates">>>()
    for (const candidate of candidates) {
      if (candidate.cadence === "instant") continue
      const groupKey = `${candidate.profileId}:${candidate.cadence}`
      digestGroups.set(groupKey, [
        ...(digestGroups.get(groupKey) ?? []),
        candidate,
      ])
    }
    const digestLeaders = new Map<
      Id<"notificationCandidates">,
      Array<Doc<"notificationCandidates">>
    >()
    for (const group of digestGroups.values()) {
      if (group.length < 2) continue
      const leader = group[0]
      digestLeaders.set(leader._id, group)
    }
    const claimedDigestFollowers = new Set<Id<"notificationCandidates">>()

    for (const candidate of candidates) {
      if (claimedDigestFollowers.has(candidate._id)) continue
      const profile = await ctx.db.get(candidate.profileId)
      if (
        !profile ||
        !profile.notificationsEnabled ||
        profile.notificationPermission !== "granted"
      ) {
        await skipCandidate(
          ctx,
          candidate._id,
          "notifications_disabled",
          nowIso
        )
        continue
      }

      const quietUntil = getQuietHoursEnd(profile, now)
      if (quietUntil) {
        await ctx.db.patch(candidate._id, { scheduledAt: quietUntil })
        continue
      }

      const devices = await ctx.db
        .query("pushDevices")
        .withIndex("by_profile_active", (q) =>
          q.eq("profileId", profile._id).eq("isActive", true)
        )
        .collect()
      if (devices.length === 0) {
        await skipCandidate(ctx, candidate._id, "no_active_devices", nowIso)
        continue
      }

      const previous = await ctx.db
        .query("notificationDeliveries")
        .withIndex("by_candidate", (q) => q.eq("candidateId", candidate._id))
        .collect()
      const acceptedDeviceIds = new Set(
        previous
          .filter(
            (delivery) =>
              delivery.status === "accepted" || delivery.status === "delivered"
          )
          .map((delivery) => delivery.deviceId)
      )

      for (const device of devices) {
        if (acceptedDeviceIds.has(device._id)) continue
        const attempts = previous.filter(
          (delivery) => delivery.deviceId === device._id
        ).length
        if (attempts >= MAX_ATTEMPTS) continue

        const provider = deviceProvider(device)
        const deliveryId = await ctx.db.insert("notificationDeliveries", {
          candidateId: candidate._id,
          deviceId: device._id,
          attempt: attempts + 1,
          provider,
          status: "sending",
          attemptedAt: nowIso,
        })
        const digest = digestLeaders.get(candidate._id)
        claimed.push({
          candidateId: candidate._id,
          deliveryId,
          deviceId: device._id,
          provider,
          token: device.token,
          apnsEnvironment: device.apnsEnvironment,
          webPushEndpoint: device.webPushEndpoint,
          webPushP256dh: device.webPushP256dh,
          webPushAuth: device.webPushAuth,
          title: digest ? "Your CivicNote brief" : candidate.title,
          body: digest
            ? `${digest.length} updates, starting with: ${candidate.title}`.slice(
                0,
                180
              )
            : candidate.body,
          deepLinkPath: digest ? "/" : candidate.deepLinkPath,
          eventKey: (await ctx.db.get(candidate.eventId))?.key ?? "",
          urgency: candidate.urgency,
        })
      }

      if (claimed.some((delivery) => delivery.candidateId === candidate._id)) {
        await ctx.db.patch(candidate._id, {
          status: "sending",
          lastAttemptAt: nowIso,
        })
        const digest = digestLeaders.get(candidate._id)
        for (const follower of digest?.slice(1) ?? []) {
          claimedDigestFollowers.add(follower._id)
          await ctx.db.patch(follower._id, {
            status: "sending",
            digestLeaderId: candidate._id,
            lastAttemptAt: nowIso,
            skipReason: `digest_leader:${candidate._id}`,
          })
        }
      } else if (acceptedDeviceIds.size > 0) {
        await ctx.db.patch(candidate._id, {
          status: "sent",
          completedAt: nowIso,
        })
        await settleDigestFollowers(ctx, candidate._id, "sent", nowIso)
      } else {
        await ctx.db.patch(candidate._id, {
          status: "failed",
          completedAt: nowIso,
          skipReason: "maximum_attempts_reached",
        })
        await settleDigestFollowers(ctx, candidate._id, "failed", nowIso)
      }
    }
    return claimed
  },
})

export const recordProviderResults = internalMutation({
  args: {
    results: v.array(
      v.object({
        deliveryId: v.id("notificationDeliveries"),
        ok: v.boolean(),
        ticketId: v.optional(v.string()),
        errorCode: v.optional(v.string()),
        errorMessage: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const affectedCandidates = new Set<Id<"notificationCandidates">>()

    for (const result of args.results) {
      const delivery = await ctx.db.get(result.deliveryId)
      if (!delivery) continue
      affectedCandidates.add(delivery.candidateId)
      await ctx.db.patch(delivery._id, {
        status: result.ok ? "accepted" : "failed",
        providerTicketId: result.ticketId,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        completedAt: now,
      })
      if (result.ok) {
        await ctx.db.patch(delivery.deviceId, {
          lastAcceptedAt: now,
          ...(delivery.provider === "apns" ? { lastDeliveredAt: now } : {}),
        })
      } else if (isPermanentDeviceError(result.errorCode)) {
        await ctx.db.patch(delivery.deviceId, {
          isActive: false,
          disabledReason: result.errorCode,
        })
      }
    }

    for (const candidateId of affectedCandidates) {
      const deliveries = await ctx.db
        .query("notificationDeliveries")
        .withIndex("by_candidate", (q) => q.eq("candidateId", candidateId))
        .collect()
      if (deliveries.some((delivery) => delivery.status === "sending")) continue
      if (
        deliveries.some(
          (delivery) =>
            delivery.status === "accepted" || delivery.status === "delivered"
        )
      ) {
        await ctx.db.patch(candidateId, { status: "sent", completedAt: now })
        await settleDigestFollowers(ctx, candidateId, "sent", now)
        continue
      }
      const retryable = deliveries.some(
        (delivery) =>
          delivery.attempt < MAX_ATTEMPTS &&
          isRetryableProviderError(delivery.errorCode)
      )
      const scheduledAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
      await ctx.db.patch(
        candidateId,
        retryable
          ? { status: "pending", scheduledAt }
          : { status: "failed", completedAt: now }
      )
      await settleDigestFollowers(
        ctx,
        candidateId,
        retryable ? "pending" : "failed",
        retryable ? scheduledAt : now
      )
    }
    return null
  },
})

export const recordReceiptResults = internalMutation({
  args: {
    results: v.array(
      v.object({
        deliveryId: v.id("notificationDeliveries"),
        delivered: v.boolean(),
        errorCode: v.optional(v.string()),
        errorMessage: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    for (const result of args.results) {
      const delivery = await ctx.db.get(result.deliveryId)
      if (
        !delivery ||
        delivery.provider !== "expo" ||
        delivery.status !== "accepted"
      ) {
        continue
      }
      await ctx.db.patch(delivery._id, {
        status: result.delivered ? "delivered" : "failed",
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        completedAt: now,
      })
      if (result.delivered) {
        await ctx.db.patch(delivery.deviceId, { lastDeliveredAt: now })
      } else if (isPermanentDeviceError(result.errorCode)) {
        await ctx.db.patch(delivery.deviceId, {
          isActive: false,
          disabledReason: result.errorCode,
        })
      }
      if (!result.delivered) {
        const retryable =
          delivery.attempt < MAX_ATTEMPTS &&
          isRetryableProviderError(result.errorCode)
        const scheduledAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
        await ctx.db.patch(
          delivery.candidateId,
          retryable
            ? { status: "pending", scheduledAt }
            : { status: "failed", completedAt: now }
        )
        await settleDigestFollowers(
          ctx,
          delivery.candidateId,
          retryable ? "pending" : "failed",
          retryable ? scheduledAt : now
        )
      }
    }
    return null
  },
})

function sendWebPushStub(
  deliveries: Array<ClaimedDelivery>
): Array<ProviderResult> {
  // TODO: configure VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT.
  return deliveries.map((delivery) => ({
    deliveryId: delivery.deliveryId,
    ok: false,
    errorCode: "WebPushNotConfigured",
    errorMessage: "Web Push delivery is not configured",
  }))
}

async function sendExpoBatch(
  deliveries: Array<ClaimedDelivery>
): Promise<Array<ProviderResult>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  }
  const accessToken = process.env.EXPO_ACCESS_TOKEN
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(
        deliveries.map((delivery) => ({
          to: delivery.token,
          title: delivery.title,
          body: delivery.body,
          sound: "default",
          priority:
            delivery.urgency === "critical" || delivery.urgency === "high"
              ? "high"
              : "default",
          data: {
            eventKey: delivery.eventKey,
            path: delivery.deepLinkPath,
            url: toCivicNoteUrl(delivery.deepLinkPath),
          },
        }))
      ),
    })
    if (!response.ok) {
      const message = (await response.text()).slice(0, 500)
      return deliveries.map((delivery) => ({
        deliveryId: delivery.deliveryId,
        ok: false,
        errorCode: `ExpoHttp${response.status}`,
        errorMessage: message || response.statusText,
      }))
    }

    const payload: unknown = await response.json()
    const tickets = readTickets(payload)
    if (tickets.length !== deliveries.length) {
      return deliveries.map((delivery) => ({
        deliveryId: delivery.deliveryId,
        ok: false,
        errorCode: "MalformedExpoResponse",
        errorMessage: "Expo did not return one ticket per message",
      }))
    }
    return deliveries.map((delivery, index) => {
      const ticket = tickets[index]
      if (ticket.status === "ok") {
        return {
          deliveryId: delivery.deliveryId,
          ok: true,
          ticketId: typeof ticket.id === "string" ? ticket.id : undefined,
        }
      }
      return {
        deliveryId: delivery.deliveryId,
        ok: false,
        errorCode: readExpoErrorCode(ticket),
        errorMessage:
          typeof ticket.message === "string"
            ? ticket.message.slice(0, 500)
            : "Expo rejected the notification",
      }
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Expo request failed"
    return deliveries.map((delivery) => ({
      deliveryId: delivery.deliveryId,
      ok: false,
      errorCode: "ExpoNetworkError",
      errorMessage: message.slice(0, 500),
    }))
  }
}

async function getExpoReceipts(
  tickets: Array<AcceptedTicket>
): Promise<Array<ReceiptResult>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  }
  const accessToken = process.env.EXPO_ACCESS_TOKEN
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  try {
    const response = await fetch(EXPO_RECEIPTS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ ids: tickets.map((ticket) => ticket.ticketId) }),
    })
    if (!response.ok) return []
    const payload: unknown = await response.json()
    if (!isRecord(payload) || !isRecord(payload.data)) return []
    const receiptData = payload.data
    const results: Array<ReceiptResult> = []
    for (const ticket of tickets) {
      const receipt = receiptData[ticket.ticketId]
      if (!isRecord(receipt)) continue
      if (receipt.status === "ok") {
        results.push({ deliveryId: ticket.deliveryId, delivered: true })
        continue
      }
      results.push({
        deliveryId: ticket.deliveryId,
        delivered: false,
        errorCode: readExpoErrorCode(receipt),
        errorMessage:
          typeof receipt.message === "string"
            ? receipt.message.slice(0, 500)
            : "Expo reported a delivery failure",
      })
    }
    return results
  } catch {
    return []
  }
}

function readTickets(payload: unknown): Array<Record<string, unknown>> {
  if (!isRecord(payload) || !Array.isArray(payload.data)) return []
  return payload.data.filter(isRecord)
}

function readExpoErrorCode(ticket: Record<string, unknown>) {
  const details = ticket.details
  return isRecord(details) && typeof details.error === "string"
    ? details.error
    : "ExpoRejected"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isExpoPushToken(token: string) {
  return /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9._~+-]+\]$/.test(token)
}

function cleanOptional(value: string | undefined, maxLength: number) {
  const cleaned = value?.trim()
  return cleaned ? cleaned.slice(0, maxLength) : undefined
}

async function skipCandidate(
  ctx: MutationCtx,
  candidateId: Id<"notificationCandidates">,
  reason: string,
  now: string
) {
  await ctx.db.patch(candidateId, {
    status: "skipped",
    skipReason: reason,
    completedAt: now,
  })
}

async function settleDigestFollowers(
  ctx: MutationCtx,
  leaderId: Id<"notificationCandidates">,
  status: "pending" | "sent" | "failed",
  timestamp: string
) {
  const followers = await ctx.db
    .query("notificationCandidates")
    .withIndex("by_digest_leader", (q) => q.eq("digestLeaderId", leaderId))
    .collect()
  for (const follower of followers) {
    await ctx.db.patch(
      follower._id,
      status === "pending"
        ? {
            status,
            scheduledAt: timestamp,
            digestLeaderId: undefined,
            skipReason: undefined,
          }
        : {
            status,
            completedAt: timestamp,
            skipReason:
              status === "sent"
                ? `included_in_digest:${leaderId}`
                : "digest_delivery_failed",
          }
    )
  }
}

function toCivicNoteUrl(path: string) {
  return `https://civicnote.org${path.startsWith("/") ? path : `/${path}`}`
}

function isPermanentDeviceError(
  errorCode: string | undefined
): errorCode is "DeviceNotRegistered" | "BadDeviceToken" | "Unregistered" {
  return (
    errorCode === "DeviceNotRegistered" ||
    errorCode === "BadDeviceToken" ||
    errorCode === "Unregistered"
  )
}

function isRetryableProviderError(errorCode: string | undefined) {
  if (!errorCode) return true
  if (
    isPermanentDeviceError(errorCode) ||
    errorCode === "MessageTooBig" ||
    errorCode === "InvalidCredentials" ||
    errorCode === "ApnsAuthError" ||
    errorCode === "WebPushNotConfigured"
  ) {
    return false
  }
  if (errorCode.startsWith("Apns") && errorCode !== "ApnsNetworkError") {
    return /^ApnsHttp(?:429|5\d\d)$/.test(errorCode)
  }
  return true
}

function getQuietHoursEnd(
  profile: {
    quietHoursStartUtc?: number
    quietHoursEndUtc?: number
  },
  now: Date
) {
  const start = profile.quietHoursStartUtc
  const end = profile.quietHoursEndUtc
  if (start === undefined || end === undefined || start === end) return null
  const hour = now.getUTCHours()
  const isQuiet =
    start < end ? hour >= start && hour < end : hour >= start || hour < end
  if (!isQuiet) return null
  const quietEnd = new Date(now)
  quietEnd.setUTCMinutes(0, 0, 0)
  if (hour < end && start > end) {
    quietEnd.setUTCHours(end)
  } else {
    quietEnd.setUTCDate(quietEnd.getUTCDate() + 1)
    quietEnd.setUTCHours(end)
  }
  return quietEnd.toISOString()
}
