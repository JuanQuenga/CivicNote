import { httpRouter, makeFunctionReference } from "convex/server"

import { httpAction } from "./_generated/server"
import {
  readEventListParams,
  readPauseArgs,
  readReconcileArgs,
} from "./lib/httpValidation"
import type { ReconcileArgs } from "./lib/installations"

const urgencyValues = ["low", "medium", "high", "critical"] as const
type Urgency = (typeof urgencyValues)[number]

type EventSummary = {
  key: string
  headline: string
  summary: string
  whyItMatters: string
  eventKind: string
  geographicScope: string
  jurisdictionKeys: Array<string>
  urgency: Urgency
  confidence: string
  lifecycleStatus: string
  startsAt?: string
  deadlineAt?: string
  publishedAt: string
  updatedAt: string
  deepLinkPath: string
  topicSlugs: Array<string>
}

type EventDetail = EventSummary & {
  sources: Array<{
    title: string
    publisher: string
    url: string
    reliability: string
    publishedAt?: string
  }>
  evidence: Array<{
    claim: string
    context: string
    classification: string
    evidenceStrength: string
  }>
  actions: Array<{
    title: string
    description: string
    actionKind: string
    audience: string
    deadlineAt?: string
    ctaLabel: string
    ctaUrl?: string
    script?: string
  }>
  meeting?: {
    title: string
    bodyName: string
    startsAt: string
    endsAt?: string
    timezone: string
    locationName?: string
    address?: string
    remoteUrl?: string
    agendaUrl?: string
    publicCommentDeadline?: string
    status: string
  }
}

type RegistrationArgs = {
  installationId: string
  token: string
  platform: "ios" | "android"
  topicSlugs: Array<string>
  cadence: "instant" | "daily" | "weekly"
  position?: "oppose" | "support" | "monitor"
  locationLabel?: string
  regionCode?: string
  appVersion?: string
}

const registerRef = makeFunctionReference<
  "mutation",
  RegistrationArgs,
  {
    profileId: string
    subscriptions: number
    jurisdictionKeys: Array<string>
  }
>("mobileRegistration:register")

const unregisterRef = makeFunctionReference<
  "mutation",
  { installationId: string; token: string },
  boolean
>("push:unregisterDevice")

const listTopicsRef = makeFunctionReference<
  "query",
  Record<string, never>,
  Array<{
    slug: string
    title: string
    shortTitle: string
    summary: string
    theme: string
    updatedAt: string
  }>
>("apiV1:listTopics")

const listEventsRef = makeFunctionReference<
  "query",
  { topic?: string; jurisdiction?: string; limit: number },
  Array<EventSummary>
>("apiV1:listEvents")

const getEventRef = makeFunctionReference<
  "query",
  { key: string },
  EventDetail | null
>("apiV1:getEvent")

const reconcileRef = makeFunctionReference<
  "mutation",
  ReconcileArgs,
  {
    profileId: string
    subscriptions: number
    jurisdictionKeys: Array<string>
  }
>("installations:reconcile")

const pauseRef = makeFunctionReference<
  "mutation",
  { installationId: string },
  boolean
>("installations:pause")

const http = httpRouter()

http.route({
  path: "/api/v1/topics",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const topics = await ctx.runQuery(listTopicsRef, {})
    return json(request, { topics }, 200)
  }),
})

http.route({
  path: "/api/v1/events",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const args = readEventListParams(new URL(request.url))
    if (!args) return json(request, { error: "Invalid event query" }, 400)
    const events = await ctx.runQuery(listEventsRef, args)
    return json(
      request,
      { events, fetchedAt: new Date().toISOString() },
      200
    )
  }),
})

http.route({
  pathPrefix: "/api/v1/events/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const prefix = "/api/v1/events/"
      const key = decodeURIComponent(new URL(request.url).pathname.slice(prefix.length))
      if (!key || key.includes("/") || key.length > 200) {
        return json(request, { error: "Event not found" }, 404)
      }
      const event = await ctx.runQuery(getEventRef, { key })
      return event
        ? json(request, { event }, 200)
        : json(request, { error: "Event not found" }, 404)
    } catch {
      return json(request, { error: "Event not found" }, 404)
    }
  }),
})

http.route({
  path: "/api/v1/installations/reconcile",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload: unknown = await request.json()
      const args = readReconcileArgs(payload)
      if (!args) {
        return json(request, { error: "Invalid reconcile payload" }, 400)
      }
      const result = await ctx.runMutation(reconcileRef, args)
      return json(request, { ok: true, ...result }, 200)
    } catch (error) {
      return mutationError(request, error, "Reconciliation failed")
    }
  }),
})

http.route({
  path: "/api/v1/installations/pause",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload: unknown = await request.json()
      const args = readPauseArgs(payload)
      if (!args) return json(request, { error: "Invalid pause payload" }, 400)
      await ctx.runMutation(pauseRef, args)
      return json(request, { ok: true }, 200)
    } catch (error) {
      return mutationError(request, error, "Pause failed")
    }
  }),
})

http.route({
  path: "/api/push/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload: unknown = await request.json()
      const args = readRegistrationArgs(payload)
      if (!args) return json(request, { error: "Invalid registration payload" }, 400)
      const result = await ctx.runMutation(registerRef, args)
      return json(request, { ok: true, ...result }, 200)
    } catch (error) {
      return mutationError(request, error, "Registration failed")
    }
  }),
})

http.route({
  path: "/api/push/unregister",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload: unknown = await request.json()
      if (
        !isRecord(payload) ||
        typeof payload.installationId !== "string" ||
        payload.installationId.length < 16 ||
        payload.installationId.length > 200 ||
        typeof payload.token !== "string" ||
        payload.token.length > 2_000
      ) {
        return json(request, { error: "Invalid unregister payload" }, 400)
      }
      const removed = await ctx.runMutation(unregisterRef, {
        installationId: payload.installationId,
        token: payload.token,
      })
      return json(request, { ok: true, removed }, 200)
    } catch (error) {
      return mutationError(request, error, "Unregister failed")
    }
  }),
})

for (const path of [
  "/api/v1/topics",
  "/api/v1/events",
  "/api/v1/installations/reconcile",
  "/api/v1/installations/pause",
  "/api/push/register",
  "/api/push/unregister",
]) {
  http.route({
    path,
    method: "OPTIONS",
    handler: httpAction(async (_ctx, request) => {
      await Promise.resolve()
      return options(request)
    }),
  })
}

http.route({
  pathPrefix: "/api/v1/events/",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
      await Promise.resolve()
      return options(request)
    }),
})

export default http

function readRegistrationArgs(value: unknown): RegistrationArgs | null {
  if (!isRecord(value)) return null
  const { installationId, token, platform, topicSlugs, cadence } = value
  if (
    typeof installationId !== "string" ||
    installationId.length < 16 ||
    installationId.length > 200 ||
    typeof token !== "string" ||
    token.length > 300 ||
    (platform !== "ios" && platform !== "android") ||
    !Array.isArray(topicSlugs) ||
    topicSlugs.length > 50 ||
    !topicSlugs.every(
      (slug) =>
        typeof slug === "string" && slug.length > 0 && slug.length <= 100
    ) ||
    (cadence !== "instant" && cadence !== "daily" && cadence !== "weekly")
  ) {
    return null
  }
  const position = value.position
  if (
    position !== undefined &&
    position !== "oppose" &&
    position !== "support" &&
    position !== "monitor"
  ) {
    return null
  }
  return {
    installationId,
    token,
    platform,
    topicSlugs,
    cadence,
    position,
    locationLabel:
      typeof value.locationLabel === "string" && value.locationLabel.length <= 100
        ? value.locationLabel
        : undefined,
    regionCode:
      typeof value.regionCode === "string" && value.regionCode.length <= 10
        ? value.regionCode
        : undefined,
    appVersion:
      typeof value.appVersion === "string" && value.appVersion.length <= 50
        ? value.appVersion
        : undefined,
  }
}

function mutationError(request: Request, error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback
  const status = message.startsWith("Too many") ? 429 : 400
  return json(request, { error: message }, status)
}

function json(request: Request, body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json",
    },
  })
}

function options(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}

function corsHeaders(request: Request) {
  const requestOrigin = request.headers.get("Origin")
  const configured = process.env.CIVICNOTE_ALLOWED_ORIGINS
  // Production sets CIVICNOTE_ALLOWED_ORIGINS; local/unconfigured deployments fall back to *.
  const allowedOrigins = configured
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
  const allowOrigin =
    configured === undefined
      ? "*"
      : requestOrigin && allowedOrigins?.includes(requestOrigin)
        ? requestOrigin
        : "null"
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
