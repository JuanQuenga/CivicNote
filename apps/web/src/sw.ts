/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core"
import {
  cleanupOutdatedCaches,
  matchPrecache,
  precacheAndRoute,
} from "workbox-precaching"
import { NavigationRoute, registerRoute, setCatchHandler } from "workbox-routing"
import { NetworkOnly } from "workbox-strategies"

import type { PrecacheEntry } from "workbox-precaching"

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>
}

const serviceWorker = self

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
clientsClaim()

const isConvexRequest = ({ url }: { url: URL }) =>
  url.hostname.endsWith(".convex.cloud") ||
  url.hostname.endsWith(".convex.site")

registerRoute(isConvexRequest, new NetworkOnly(), "GET")
registerRoute(isConvexRequest, new NetworkOnly(), "POST")
registerRoute(
  new NavigationRoute(new NetworkOnly(), {
    denylist: [/^\/api\//],
  })
)

setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    const fallback = await matchPrecache("/offline.html")
    if (fallback) return fallback
  }
  return Response.error()
})

serviceWorker.addEventListener("message", (event) => {
  if (isRecord(event.data) && event.data.type === "SKIP_WAITING") {
    void serviceWorker.skipWaiting()
  }
})

serviceWorker.addEventListener("push", (event) => {
  const payload = readPushPayload(event)
  const eventKey = stringField(payload, "eventKey")
  const path = stringField(payload, "path")
  const url = stringField(payload, "url")
  const target =
    path ||
    url ||
    (eventKey ? `/alerts/${encodeURIComponent(eventKey)}` : "/updates")
  const title = stringField(payload, "title") || "CivicNote alert"
  const body =
    stringField(payload, "body") || "A civic decision needs your attention."

  event.waitUntil(
    serviceWorker.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { target },
      tag: eventKey ? `civicnote-${eventKey}` : "civicnote-alert",
    })
  )
})

serviceWorker.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const data: unknown = event.notification.data
  const target = isRecord(data) ? stringField(data, "target") : ""
  const targetUrl = new URL(target || "/updates", serviceWorker.location.origin)

  event.waitUntil(openOrFocus(targetUrl))
})

async function openOrFocus(targetUrl: URL) {
  const windowClients = await serviceWorker.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  })
  const sameOriginClient = windowClients.find((client) => {
    try {
      return new URL(client.url).origin === targetUrl.origin
    } catch {
      return false
    }
  })

  if (sameOriginClient) {
    await sameOriginClient.navigate(targetUrl.href)
    return sameOriginClient.focus()
  }
  return serviceWorker.clients.openWindow(targetUrl.href)
}

function readPushPayload(event: PushEvent): Record<string, unknown> {
  if (!event.data) return {}
  try {
    const value: unknown = event.data.json()
    return isRecord(value) ? value : {}
  } catch {
    return { body: event.data.text() }
  }
}

function stringField(record: Record<string, unknown>, field: string) {
  const value = record[field]
  return typeof value === "string" ? value : ""
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
