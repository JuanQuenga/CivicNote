import { useEffect, useMemo, useState } from "react"
import { ConvexHttpClient } from "convex/browser"
import { makeFunctionReference } from "convex/server"

import type { CivicAlert } from "@/lib/service"
import { getCivicAlerts } from "@/lib/service"
import { readAlertFeed, writeAlertFeed } from "@/lib/offlineFeedStore"
import { topics } from "@/lib/topics"

export type CivicFeedStatus = "live" | "stale" | "offline" | "loading"

type BackendEvent = {
  key: string
  topicSlugs: Array<string>
  headline: string
  summary: string
  whyItMatters: string
  geographicScope: "local" | "state" | "regional" | "national" | "international"
  jurisdictionKeys: Array<string>
  urgency: "low" | "medium" | "high" | "critical"
  lifecycleStatus:
    | "proposed"
    | "scheduled"
    | "open"
    | "approved"
    | "rejected"
    | "completed"
    | "withdrawn"
  startsAt?: string
  deadlineAt?: string
  publishedAt: string
  sourceDocumentIds: Array<string>
}

type FeedResult = {
  key: string
  alerts: Array<CivicAlert>
  fetchedAt: number | null
  refreshFailed: boolean
}

const STALE_AFTER_MS = 15 * 60 * 1000

const listPublishedRef = makeFunctionReference<
  "query",
  {
    topicSlug?: string
    jurisdictionKeys?: Array<string>
    limit?: number
  },
  Array<BackendEvent>
>("events:listPublished")

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined
const client = convexUrl
  ? new ConvexHttpClient(convexUrl, { logger: false })
  : null
const fallbackAlerts = getCivicAlerts()

const stateCodes: Record<string, string> = {
  Alabama: "al",
  Alaska: "ak",
  Arizona: "az",
  Arkansas: "ar",
  California: "ca",
  Colorado: "co",
  Connecticut: "ct",
  Delaware: "de",
  Florida: "fl",
  Georgia: "ga",
  Hawaii: "hi",
  Idaho: "id",
  Illinois: "il",
  Indiana: "in",
  Iowa: "ia",
  Kansas: "ks",
  Kentucky: "ky",
  Louisiana: "la",
  Maine: "me",
  Maryland: "md",
  Massachusetts: "ma",
  Michigan: "mi",
  Minnesota: "mn",
  Mississippi: "ms",
  Missouri: "mo",
  Montana: "mt",
  Nebraska: "ne",
  Nevada: "nv",
  "New Hampshire": "nh",
  "New Jersey": "nj",
  "New Mexico": "nm",
  "New York": "ny",
  "North Carolina": "nc",
  "North Dakota": "nd",
  Ohio: "oh",
  Oklahoma: "ok",
  Oregon: "or",
  Pennsylvania: "pa",
  "Rhode Island": "ri",
  "South Carolina": "sc",
  "South Dakota": "sd",
  Tennessee: "tn",
  Texas: "tx",
  Utah: "ut",
  Vermont: "vt",
  Virginia: "va",
  Washington: "wa",
  "West Virginia": "wv",
  Wisconsin: "wi",
  Wyoming: "wy",
  "District of Columbia": "dc",
}

export function useLiveCivicAlerts(state: string): {
  alerts: Array<CivicAlert>
  fetchedAt: number | null
  status: CivicFeedStatus
} {
  const jurisdictionKey = stateCodes[state]
    ? `us-${stateCodes[state]}`
    : undefined
  const feedKey = jurisdictionKey ?? "us"
  const relevantFallback = useMemo(
    () =>
      !state || state === "Michigan"
        ? fallbackAlerts
        : fallbackAlerts.filter((alert) => alert.scope === "National"),
    [state]
  )
  const [online, setOnline] = useState(true)
  const [clock, setClock] = useState(() => Date.now())
  const [result, setResult] = useState<FeedResult>({
    key: feedKey,
    alerts: relevantFallback,
    fetchedAt: null,
    refreshFailed: false,
  })

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine)
    updateConnection()
    window.addEventListener("online", updateConnection)
    window.addEventListener("offline", updateConnection)
    return () => {
      window.removeEventListener("online", updateConnection)
      window.removeEventListener("offline", updateConnection)
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    let active = true

    const refresh = async () => {
      if (!client || !online) return
      try {
        const events = await client.query(listPublishedRef, {
          jurisdictionKeys: jurisdictionKey ? [jurisdictionKey] : undefined,
          limit: 100,
        })
        if (!active) return
        const fetchedAt = Date.now()
        const alerts = events.map(toCivicAlert)
        setResult({
          key: feedKey,
          alerts,
          fetchedAt,
          refreshFailed: false,
        })
        await writeAlertFeed({ key: feedKey, alerts, fetchedAt })
      } catch {
        if (active) {
          setResult((current) => ({
            ...(current.key === feedKey
              ? current
              : {
                  key: feedKey,
                  alerts: relevantFallback,
                  fetchedAt: null,
                }),
            refreshFailed: true,
          }))
        }
      }
    }

    const hydrateThenRefresh = async () => {
      const cached = await readAlertFeed(feedKey)
      if (!active) return
      if (cached) {
        setResult({ ...cached, refreshFailed: false })
      } else {
        setResult({
          key: feedKey,
          alerts: relevantFallback,
          fetchedAt: null,
          refreshFailed: false,
        })
      }
      await refresh()
    }

    void hydrateThenRefresh()
    const interval = window.setInterval(() => void refresh(), 60_000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [feedKey, jurisdictionKey, online, relevantFallback])

  const current =
    result.key === feedKey
      ? result
      : {
          key: feedKey,
          alerts: relevantFallback,
          fetchedAt: null,
          refreshFailed: false,
        }
  const age = current.fetchedAt ? clock - current.fetchedAt : Number.POSITIVE_INFINITY
  const status: CivicFeedStatus = !online
    ? "offline"
    : !current.fetchedAt && client && !current.refreshFailed
      ? "loading"
      : !client || current.refreshFailed || age > STALE_AFTER_MS
        ? "stale"
        : "live"

  return {
    alerts: current.alerts,
    fetchedAt: current.fetchedAt,
    status,
  }
}

function toCivicAlert(event: BackendEvent): CivicAlert {
  const slug = event.topicSlugs[0] ?? ""
  const topic = topics.find((item) => item.slug === slug)
  return {
    id: event.key,
    slug,
    topic: topic?.shortTitle ?? humanize(slug || "Civic update"),
    title: event.headline,
    summary: event.summary,
    publishedAt: formatDate(event.publishedAt),
    urgency: event.urgency === "critical" ? "high" : event.urgency,
    scope:
      event.geographicScope === "local"
        ? "Local"
        : event.geographicScope === "state" ||
            event.geographicScope === "regional"
          ? "State"
          : "National",
    region: locationLabel(event.jurisdictionKeys),
    nextDecisionPoint: event.deadlineAt
      ? `Deadline ${formatDate(event.deadlineAt)}`
      : event.startsAt
        ? `Scheduled ${formatDate(event.startsAt)}`
        : `${humanize(event.lifecycleStatus)} — ${event.whyItMatters}`,
    sourceCount: event.sourceDocumentIds.length,
    sourceUrl: "",
  }
}

function locationLabel(keys: Array<string>) {
  const key = keys.at(-1)
  if (!key || key === "us") return "United States"
  if (key === "us-mi") return "Michigan"
  return humanize(key.replace(/^us-[a-z]{2}-/, ""))
}

function humanize(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}
