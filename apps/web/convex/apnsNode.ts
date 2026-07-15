"use node"

import { createPrivateKey, sign } from "node:crypto"
import { v } from "convex/values"

import { internalAction } from "./_generated/server"
import { classifyApnsResponse } from "./lib/pushProviders"
import type { Id } from "./_generated/dataModel"

const JWT_LIFETIME_MS = 40 * 60 * 1000

let cachedJwt:
  | { value: string; createdAt: number; keyId: string; teamId: string }
  | undefined
let didLogAuthError = false

type ApnsResult = {
  deliveryId: Id<"notificationDeliveries">
  ok: boolean
  ticketId?: string
  errorCode?: string
  errorMessage?: string
}

export const sendBatch = internalAction({
  args: {
    deliveries: v.array(
      v.object({
        deliveryId: v.id("notificationDeliveries"),
        token: v.string(),
        apnsEnvironment: v.optional(
          v.union(v.literal("development"), v.literal("production"))
        ),
        title: v.string(),
        body: v.string(),
        deepLinkPath: v.string(),
        eventKey: v.string(),
        urgency: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high"),
          v.literal("critical")
        ),
      })
    ),
  },
  handler: async (_ctx, args): Promise<Array<ApnsResult>> => {
    const configuration = readConfiguration()
    if (!configuration) {
      logAuthErrorOnce("APNs credentials are not configured")
      return args.deliveries.map((delivery) => ({
        deliveryId: delivery.deliveryId,
        ok: false,
        errorCode: "ApnsAuthError",
        errorMessage: "APNs credentials are not configured",
      }))
    }

    let authorization: string
    try {
      authorization = `bearer ${getProviderJwt(configuration)}`
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid APNs key"
      logAuthErrorOnce(message)
      return args.deliveries.map((delivery) => ({
        deliveryId: delivery.deliveryId,
        ok: false,
        errorCode: "ApnsAuthError",
        errorMessage: message.slice(0, 500),
      }))
    }

    return await Promise.all(
      args.deliveries.map(async (delivery) => {
        const host =
          delivery.apnsEnvironment === "development"
            ? "api.sandbox.push.apple.com"
            : "api.push.apple.com"
        const payload = {
          aps: {
            alert: { title: delivery.title, body: delivery.body },
            sound: "default",
            ...(delivery.urgency === "critical"
              ? { "interruption-level": "time-sensitive" }
              : {}),
          },
          eventKey: delivery.eventKey,
          path: delivery.deepLinkPath,
          url: toCivicNoteUrl(delivery.deepLinkPath),
        }

        try {
          // The URL's /3/device/<token> component is sent as the HTTP/2 :path.
          const response = await fetch(
            `https://${host}/3/device/${delivery.token}`,
            {
              method: "POST",
              headers: {
                Authorization: authorization,
                "Content-Type": "application/json",
                "apns-topic": configuration.topic,
                "apns-push-type": "alert",
                "apns-priority":
                  delivery.urgency === "critical" ||
                  delivery.urgency === "high"
                    ? "10"
                    : "5",
                "apns-collapse-id": delivery.eventKey,
              },
              body: JSON.stringify(payload),
            }
          )
          const responseBody = await readResponseBody(response)
          const failure = classifyApnsResponse(
            response.status,
            responseBody.reason
          )
          if (!failure) {
            return {
              deliveryId: delivery.deliveryId,
              ok: true,
              ticketId: response.headers.get("apns-id") ?? undefined,
            }
          }
          if (failure.errorCode === "ApnsAuthError") {
            logAuthErrorOnce(responseBody.reason ?? "APNs rejected authentication")
          }
          return {
            deliveryId: delivery.deliveryId,
            ok: false,
            errorCode: failure.errorCode,
            errorMessage: (responseBody.reason ?? response.statusText).slice(0, 500),
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "APNs request failed"
          return {
            deliveryId: delivery.deliveryId,
            ok: false,
            errorCode: "ApnsNetworkError",
            errorMessage: message.slice(0, 500),
          }
        }
      })
    )
  },
})

function readConfiguration() {
  const keyId = process.env.APNS_KEY_ID?.trim()
  const teamId = process.env.APNS_TEAM_ID?.trim()
  const privateKey = process.env.APNS_PRIVATE_KEY?.replaceAll("\\n", "\n").trim()
  if (!keyId || !teamId || !privateKey) return null
  return {
    keyId,
    teamId,
    privateKey,
    topic: process.env.APNS_TOPIC?.trim() || "org.civicnote.mobile",
  }
}

function getProviderJwt(configuration: {
  keyId: string
  teamId: string
  privateKey: string
}) {
  const now = Date.now()
  if (
    cachedJwt &&
    cachedJwt.keyId === configuration.keyId &&
    cachedJwt.teamId === configuration.teamId &&
    now - cachedJwt.createdAt < JWT_LIFETIME_MS
  ) {
    return cachedJwt.value
  }

  const header = base64Url(
    JSON.stringify({ alg: "ES256", kid: configuration.keyId })
  )
  const claims = base64Url(
    JSON.stringify({ iss: configuration.teamId, iat: Math.floor(now / 1000) })
  )
  const signingInput = `${header}.${claims}`
  const signature = sign("sha256", Buffer.from(signingInput), {
    key: createPrivateKey(configuration.privateKey),
    dsaEncoding: "ieee-p1363",
  })
  const value = `${signingInput}.${base64Url(signature)}`
  cachedJwt = {
    value,
    createdAt: now,
    keyId: configuration.keyId,
    teamId: configuration.teamId,
  }
  return value
}

async function readResponseBody(response: Response) {
  if (response.status === 200) return { reason: undefined }
  try {
    const value: unknown = await response.json()
    return isRecord(value) && typeof value.reason === "string"
      ? { reason: value.reason }
      : { reason: undefined }
  } catch {
    return { reason: undefined }
  }
}

function base64Url(value: string | Uint8Array) {
  return Buffer.from(value).toString("base64url")
}

function toCivicNoteUrl(path: string) {
  return `https://civicnote.org${path.startsWith("/") ? path : `/${path}`}`
}

function logAuthErrorOnce(message: string) {
  if (didLogAuthError) return
  didLogAuthError = true
  console.error(`APNs authentication error: ${message}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
