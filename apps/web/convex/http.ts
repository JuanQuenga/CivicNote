import { httpRouter, makeFunctionReference } from "convex/server"

import { httpAction } from "./_generated/server"

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

const http = httpRouter()

http.route({
  path: "/api/push/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload: unknown = await request.json()
      const args = readRegistrationArgs(payload)
      if (!args) return json({ error: "Invalid registration payload" }, 400)
      const result = await ctx.runMutation(registerRef, args)
      return json({ ok: true, ...result }, 200)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed"
      return json({ error: message }, 400)
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
        payload.token.length > 300
      ) {
        return json({ error: "Invalid unregister payload" }, 400)
      }
      const removed = await ctx.runMutation(unregisterRef, {
        installationId: payload.installationId,
        token: payload.token,
      })
      return json({ ok: true, removed }, 200)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unregister failed"
      return json({ error: message }, 400)
    }
  }),
})

http.route({
  path: "/api/push/register",
  method: "OPTIONS",
  handler: httpAction(async () => {
    await Promise.resolve()
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }),
})

http.route({
  path: "/api/push/unregister",
  method: "OPTIONS",
  handler: httpAction(async () => {
    await Promise.resolve()
    return new Response(null, { status: 204, headers: corsHeaders })
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
      typeof value.locationLabel === "string" &&
      value.locationLabel.length <= 100
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

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
