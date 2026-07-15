import { useEffect, useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"

import { SiteHeader } from "@/components/SiteHeader"
import { readAlertDetail, writeAlertDetail } from "@/lib/offlineFeedStore"

export const Route = createFileRoute("/alerts/$id")({ component: AlertDetailPage })

type AlertEvent = {
  key: string
  headline: string
  summary: string
  whyItMatters: string
  eventKind: string
  urgency: "low" | "medium" | "high" | "critical"
  publishedAt: string
  updatedAt: string
  deepLinkPath: string
  topicSlugs: Array<string>
  sources: Array<{
    title: string
    publisher: string
    url: string
    reliability: string
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
    ctaLabel: string
    ctaUrl?: string
    script?: string
  }>
  meeting?: {
    title?: string
    startsAt?: string
    locationName?: string
    address?: string
    virtualUrl?: string
    officialUrl?: string
  }
}

type DetailState =
  | { status: "loading" }
  | { status: "ready"; event: AlertEvent; cached: boolean }
  | { status: "missing" }
  | { status: "error" }

function AlertDetailPage() {
  const { id } = Route.useParams()
  const [state, setState] = useState<DetailState>({ status: "loading" })

  useEffect(() => {
    let active = true

    const load = async () => {
      setState({ status: "loading" })
      try {
        const endpoint = eventEndpoint(id)
        if (!endpoint) throw new Error("Civic data service is not configured")
        const response = await fetch(endpoint, {
          headers: { Accept: "application/json" },
        })
        if (!active) return
        if (response.status === 404) {
          setState({ status: "missing" })
          return
        }
        if (!response.ok) throw new Error(`Request failed: ${response.status}`)
        const payload: unknown = await response.json()
        if (!isEventResponse(payload)) throw new Error("Invalid event response")
        setState({ status: "ready", event: payload.event, cached: false })
        await writeAlertDetail(id, payload.event)
      } catch {
        const cached = await readAlertDetail(id)
        if (!active) return
        if (isAlertEvent(cached)) {
          setState({ status: "ready", event: cached, cached: true })
        } else {
          setState({ status: "error" })
        }
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [id])

  return (
    <div className="min-h-svh bg-[#f8f5ef] text-zinc-950">
      <SiteHeader />
      <main>
        {state.status === "loading" ? <LoadingState /> : null}
        {state.status === "missing" ? <MissingState /> : null}
        {state.status === "error" ? <ErrorState /> : null}
        {state.status === "ready" ? (
          <AlertEventDetail event={state.event} cached={state.cached} />
        ) : null}
      </main>
    </div>
  )
}

function AlertEventDetail({
  event,
  cached,
}: {
  event: AlertEvent
  cached: boolean
}) {
  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-950 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            to="/updates"
            className="text-xs font-black text-zinc-400 hover:text-white"
          >
            ← All updates
          </Link>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-black tracking-[0.12em] uppercase ${urgencyClass(event.urgency)}`}
            >
              {event.urgency} urgency
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-[0.12em] text-zinc-300 uppercase">
              {humanize(event.eventKind)}
            </span>
          </div>
          {cached ? (
            <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
              Offline — showing the last saved copy. Check meeting times,
              deadlines, and action links at the official source.
            </div>
          ) : null}
          <h1 className="mt-6 text-4xl leading-[0.96] font-black tracking-[-0.045em] sm:text-6xl">
            {event.headline}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
            {event.summary}
          </p>
          <p className="mt-6 text-xs font-bold text-zinc-500">
            Published {formatDate(event.publishedAt)} · Updated{" "}
            {formatDate(event.updatedAt)}
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_0.48fr]">
        <div className="grid gap-6">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
            <p className="text-[11px] font-black tracking-[0.16em] text-red-700 uppercase">
              Why it matters
            </p>
            <p className="mt-4 text-lg leading-8 text-zinc-700">
              {event.whyItMatters}
            </p>
          </section>

          {event.meeting ? <MeetingCard meeting={event.meeting} /> : null}

          {event.evidence.length ? (
            <section>
              <p className="text-[11px] font-black tracking-[0.16em] text-red-700 uppercase">
                Evidence ledger
              </p>
              <div className="mt-3 grid gap-3">
                {event.evidence.map((item, index) => (
                  <article
                    key={`${item.claim}-${index}`}
                    className="rounded-3xl border border-zinc-200 bg-white p-6"
                  >
                    <div className="flex flex-wrap gap-2 text-[10px] font-black tracking-[0.12em] uppercase">
                      <span className="text-red-700">
                        {humanize(item.classification)}
                      </span>
                      <span className="text-zinc-400">
                        {humanize(item.evidenceStrength)} evidence
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-black">{item.claim}</h2>
                    <p className="mt-3 text-sm leading-7 text-zinc-600">
                      {item.context}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="grid content-start gap-6">
          {event.actions.length ? (
            <section className="rounded-3xl bg-red-700 p-6 text-white">
              <p className="text-[11px] font-black tracking-[0.16em] text-red-100 uppercase">
                Take action
              </p>
              <div className="mt-4 grid gap-5">
                {event.actions.map((action) => (
                  <div key={`${action.actionKind}-${action.title}`}>
                    <h2 className="text-lg font-black">{action.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-red-100">
                      {action.description}
                    </p>
                    <p className="mt-2 text-xs font-bold text-red-200">
                      For {action.audience}
                    </p>
                    {action.script ? (
                      <blockquote className="mt-3 rounded-2xl bg-white/10 p-4 text-sm leading-6">
                        “{action.script}”
                      </blockquote>
                    ) : null}
                    {action.ctaUrl ? (
                      <a
                        href={action.ctaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-xs font-black text-red-800"
                      >
                        {action.ctaLabel} ↗
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <p className="text-[11px] font-black tracking-[0.16em] text-zinc-500 uppercase">
              Official and primary sources
            </p>
            <div className="mt-4 grid gap-4">
              {event.sources.length ? (
                event.sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group border-t border-zinc-100 pt-4 first:border-0 first:pt-0"
                  >
                    <span className="block text-sm font-black group-hover:text-red-700">
                      {source.title} ↗
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-zinc-500">
                      {source.publisher} · {humanize(source.reliability)}
                    </span>
                  </a>
                ))
              ) : (
                <p className="text-sm leading-6 text-zinc-600">
                  No source links were included with this alert. Verify details
                  with the responsible public body before acting.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}

function MeetingCard({ meeting }: { meeting: NonNullable<AlertEvent["meeting"]> }) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <p className="text-[11px] font-black tracking-[0.16em] text-red-700 uppercase">
        Meeting
      </p>
      <h2 className="mt-3 text-2xl font-black">
        {meeting.title ?? "Public meeting"}
      </h2>
      {meeting.startsAt ? (
        <p className="mt-3 text-sm font-black">
          {formatDateTime(meeting.startsAt)}
        </p>
      ) : null}
      {meeting.locationName || meeting.address ? (
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {[meeting.locationName, meeting.address].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {meeting.officialUrl ? (
          <a
            href={meeting.officialUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-zinc-950 px-4 py-3 text-xs font-black text-white"
          >
            Verify meeting details ↗
          </a>
        ) : null}
        {meeting.virtualUrl ? (
          <a
            href={meeting.virtualUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-300 px-4 py-3 text-xs font-black"
          >
            Join online ↗
          </a>
        ) : null}
      </div>
    </section>
  )
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />
      <div className="mt-6 h-14 max-w-2xl animate-pulse rounded-2xl bg-zinc-200" />
      <p className="mt-6 text-sm font-bold text-zinc-500">Loading alert…</p>
    </div>
  )
}

function MissingState() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-700 text-xl font-black text-white">
        C
      </span>
      <p className="mt-8 text-[11px] font-black tracking-[0.16em] text-red-700 uppercase">
        Archived or removed
      </p>
      <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
        This alert is no longer available.
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-600">
        The public record may have changed, the event may have been withdrawn, or
        this alert is no longer published.
      </p>
      <Link
        to="/updates"
        className="mt-7 inline-flex rounded-xl bg-zinc-950 px-5 py-3 text-xs font-black text-white"
      >
        View current updates
      </Link>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <p className="text-[11px] font-black tracking-[0.16em] text-red-700 uppercase">
        Alert unavailable
      </p>
      <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
        CivicNote could not load this alert.
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-600">
        Check your connection and try again. If a meeting or deadline is urgent,
        verify it directly with the responsible public body.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-7 rounded-xl bg-zinc-950 px-5 py-3 text-xs font-black text-white"
      >
        Try again
      </button>
    </div>
  )
}

function eventEndpoint(key: string) {
  const configured = import.meta.env.VITE_CONVEX_URL as string | undefined
  if (!configured) return null
  try {
    const url = new URL(configured)
    url.hostname = url.hostname.replace(/\.convex\.cloud$/, ".convex.site")
    url.pathname = `/api/v1/events/${encodeURIComponent(key)}`
    url.search = ""
    url.hash = ""
    return url.toString()
  } catch {
    return null
  }
}

function isEventResponse(value: unknown): value is { event: AlertEvent } {
  return isRecord(value) && isAlertEvent(value.event)
}

function isAlertEvent(value: unknown): value is AlertEvent {
  if (!isRecord(value)) return false
  return (
    typeof value.key === "string" &&
    typeof value.headline === "string" &&
    typeof value.summary === "string" &&
    typeof value.whyItMatters === "string" &&
    typeof value.eventKind === "string" &&
    isUrgency(value.urgency) &&
    typeof value.publishedAt === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.deepLinkPath === "string" &&
    isStringArray(value.topicSlugs) &&
    Array.isArray(value.sources) &&
    value.sources.every(isSource) &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isEvidence) &&
    Array.isArray(value.actions) &&
    value.actions.every(isAction) &&
    (value.meeting === undefined || isMeeting(value.meeting))
  )
}

function isSource(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.publisher === "string" &&
    typeof value.url === "string" &&
    typeof value.reliability === "string"
  )
}

function isEvidence(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.claim === "string" &&
    typeof value.context === "string" &&
    typeof value.classification === "string" &&
    typeof value.evidenceStrength === "string"
  )
}

function isAction(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.actionKind === "string" &&
    typeof value.audience === "string" &&
    typeof value.ctaLabel === "string" &&
    (value.ctaUrl === undefined || typeof value.ctaUrl === "string") &&
    (value.script === undefined || typeof value.script === "string")
  )
}

function isMeeting(value: unknown) {
  if (!isRecord(value)) return false
  return [
    value.title,
    value.startsAt,
    value.locationName,
    value.address,
    value.virtualUrl,
    value.officialUrl,
  ].every((field) => field === undefined || typeof field === "string")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isStringArray(value: unknown): value is Array<string> {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function isUrgency(value: unknown): value is AlertEvent["urgency"] {
  return ["low", "medium", "high", "critical"].includes(String(value))
}

function urgencyClass(urgency: AlertEvent["urgency"]) {
  if (urgency === "critical" || urgency === "high") {
    return "bg-red-600 text-white"
  }
  if (urgency === "medium") return "bg-amber-400 text-amber-950"
  return "bg-zinc-700 text-zinc-100"
}

function humanize(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase())
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

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}
