import { useEffect, useState } from "react"
import { ConvexHttpClient } from "convex/browser"
import { makeFunctionReference } from "convex/server"

import type { CivicAlert } from "@/lib/service"
import { getCivicAlerts } from "@/lib/service"
import { topics } from "@/lib/topics"

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

export function useLiveCivicAlerts(state: string) {
  const [liveResult, setLiveResult] = useState<{
    jurisdictionKey: string | undefined
    alerts: Array<CivicAlert>
  } | null>(null)
  const jurisdictionKey = stateCodes[state]
    ? `us-${stateCodes[state]}`
    : undefined

  useEffect(() => {
    if (!client) return
    let active = true
    const refresh = () => {
      client
        .query(listPublishedRef, {
          jurisdictionKeys: jurisdictionKey ? [jurisdictionKey] : undefined,
          limit: 100,
        })
        .then((events) => {
          if (active) {
            setLiveResult({
              jurisdictionKey,
              alerts: events.map(toCivicAlert),
            })
          }
        })
        .catch(() => {
          if (active) setLiveResult(null)
        })
    }
    refresh()
    const interval = window.setInterval(refresh, 60_000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [jurisdictionKey])

  const currentResult =
    liveResult?.jurisdictionKey === jurisdictionKey ? liveResult : null
  const relevantFallback =
    !state || state === "Michigan"
      ? fallbackAlerts
      : fallbackAlerts.filter((alert) => alert.scope === "National")

  return {
    alerts: currentResult?.alerts ?? relevantFallback,
    isLive: currentResult !== null,
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
