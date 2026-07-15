import { useEffect, useState } from "react"
import { ConvexHttpClient } from "convex/browser"
import { makeFunctionReference } from "convex/server"

import { civicEvents } from "@/src/lib/civicEvents"
import type { CivicEvent } from "@/src/lib/civicEvents"
import { useCivicPreferences } from "@/src/lib/CivicPreferencesContext"
import { topics } from "@/src/lib/topics"

type BackendEvent = {
  key: string
  topicSlugs: Array<string>
  headline: string
  summary: string
  whyItMatters: string
  eventKind:
    | "permit"
    | "meeting"
    | "vote"
    | "public_comment"
    | "filing"
    | "investigation"
    | "policy"
    | "court_ruling"
    | "breaking_news"
  jurisdictionKeys: Array<string>
  urgency: "low" | "medium" | "high" | "critical"
  confidence: "developing" | "corroborated" | "verified"
  happenedAt?: string
  startsAt?: string
  deadlineAt?: string
  updatedAt: string
}

type BackendSource = {
  title: string
  publisher: string
  url: string
}

type BackendMeeting = {
  bodyName: string
  startsAt: string
  locationName?: string
  address?: string
}

type BackendAction = {
  audience: string
  ctaLabel: string
  ctaUrl?: string
  script?: string
}

type BackendEventDetail = BackendEvent & {
  sources: Array<BackendSource>
  meeting: BackendMeeting | null
  actions: Array<BackendAction>
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

const getPublishedByKeyRef = makeFunctionReference<
  "query",
  { key: string },
  BackendEventDetail | null
>("events:getPublishedByKey")

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL
const client = convexUrl
  ? new ConvexHttpClient(convexUrl, { logger: false })
  : null

export function useCivicEventFeed() {
  const [liveEvents, setLiveEvents] = useState<Array<CivicEvent> | null>(null)
  const { preferences } = useCivicPreferences()
  const jurisdictionKey = preferences.regionCode
    ? `us-${preferences.regionCode.toLowerCase()}`
    : null

  useEffect(() => {
    if (!client) return
    let active = true
    const refresh = () => {
      client
        .query(listPublishedRef, {
          jurisdictionKeys: jurisdictionKey ? [jurisdictionKey] : undefined,
          limit: 50,
        })
        .then((events) => {
          if (active) setLiveEvents(events.map(toCivicEvent))
        })
        .catch(() => {
          if (active) setLiveEvents(null)
        })
    }
    refresh()
    const interval = setInterval(refresh, 60_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [jurisdictionKey])

  const fallbackEvents =
    !preferences.regionCode || preferences.regionCode === "MI"
      ? civicEvents
      : civicEvents.filter((event) => event.location === "United States")

  return {
    events: liveEvents ?? fallbackEvents,
    isLive: liveEvents !== null,
  }
}

export function useCivicEventDetail(key: string | undefined) {
  const fallback = key
    ? (civicEvents.find((event) => event.id === key) ?? null)
    : null
  const [liveResult, setLiveResult] = useState<{
    key: string
    event: CivicEvent | null
  } | null>(null)

  useEffect(() => {
    if (!client || !key) {
      setLiveResult(null)
      return
    }
    let active = true
    client
      .query(getPublishedByKeyRef, { key })
      .then((event) => {
        if (active) {
          setLiveResult({ key, event: event ? toCivicEvent(event) : null })
        }
      })
      .catch(() => {
        if (active) setLiveResult({ key, event: null })
      })
    const interval = setInterval(() => {
      client
        .query(getPublishedByKeyRef, { key })
        .then((event) => {
          if (active) {
            setLiveResult({ key, event: event ? toCivicEvent(event) : null })
          }
        })
        .catch(() => {})
    }, 60_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [key])

  const currentResult =
    liveResult !== null && liveResult.key === key ? liveResult : null
  const liveEvent = currentResult?.event
  const hasCurrentResult = currentResult !== null

  return {
    event: liveEvent ?? fallback,
    isLoading: Boolean(client && key && !hasCurrentResult && !fallback),
    isLive: Boolean(liveEvent),
  }
}

function toCivicEvent(event: BackendEventDetail | BackendEvent): CivicEvent {
  const topicSlug = event.topicSlugs[0] ?? ""
  const topic = topics.find((item) => item.slug === topicSlug)
  const detail = isDetailedEvent(event) ? event : null
  const action = detail?.actions[0]
  const source = detail?.sources[0]
  const meeting = detail?.meeting

  return {
    id: event.key,
    topicSlug,
    topic: topic?.shortTitle ?? humanize(topicSlug || "Civic update"),
    title: event.headline,
    summary: event.summary,
    whyItMatters: event.whyItMatters,
    location: locationLabel(event.jurisdictionKeys),
    jurisdiction: meeting?.bodyName ?? locationLabel(event.jurisdictionKeys),
    checkedAt: event.updatedAt,
    startsAt: meeting?.startsAt ?? event.startsAt,
    venue:
      [meeting?.locationName, meeting?.address].filter(Boolean).join(", ") ||
      undefined,
    scheduleVerified:
      event.confidence === "verified" && Boolean(meeting?.startsAt)
        ? true
        : undefined,
    deadline: event.deadlineAt,
    urgency:
      event.urgency === "critical" || event.urgency === "high"
        ? "urgent"
        : event.urgency === "medium"
          ? "important"
          : "watch",
    eventType: eventType(event.eventKind),
    decisionMaker:
      action?.audience ?? meeting?.bodyName ?? "Relevant public officials",
    actionLabel: action?.ctaLabel ?? "Open the primary source",
    actionUrl: action?.ctaUrl ?? source?.url ?? "https://civicnote.org",
    script:
      action?.script ??
      "Please publish the underlying record, the affected jurisdiction, the decision date, and the public-comment process before taking action.",
    evidence:
      detail?.sources.map((item) => ({
        label: item.title,
        publisher: item.publisher,
        url: item.url,
      })) ?? [],
  }
}

function isDetailedEvent(
  event: BackendEventDetail | BackendEvent
): event is BackendEventDetail {
  return "sources" in event && "actions" in event && "meeting" in event
}

function eventType(kind: BackendEvent["eventKind"]): CivicEvent["eventType"] {
  if (kind === "meeting") return "meeting"
  if (kind === "vote") return "vote"
  if (kind === "filing") return "filing"
  if (kind === "permit" || kind === "public_comment") return "hearing"
  return "report"
}

function locationLabel(keys: Array<string>) {
  const mostSpecific = keys.at(-1)
  if (!mostSpecific) return "United States"
  if (mostSpecific === "us") return "United States"
  if (mostSpecific === "us-mi") return "Michigan"
  return mostSpecific
    .replace(/^us-mi-/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function humanize(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
