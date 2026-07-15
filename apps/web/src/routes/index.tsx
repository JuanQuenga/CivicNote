import { useDeferredValue, useMemo, useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"

import { AlertPreferences } from "@/components/AlertPreferences"
import { CivicAlertCard } from "@/components/CivicAlertCard"
import { SiteHeader } from "@/components/SiteHeader"
import { getServiceActions } from "@/lib/service"
import { topics } from "@/lib/topics"
import { useCivicPreferences } from "@/lib/useCivicPreferences"
import { useLiveCivicAlerts } from "@/lib/useLiveCivicAlerts"
import { useSavedTopics } from "@/lib/useSavedTopics"

export const Route = createFileRoute("/")({ component: Home })

const themeStyles = {
  ethics: "bg-red-50 text-red-900",
  surveillance: "bg-zinc-950 text-white",
  infrastructure: "bg-emerald-50 text-emerald-950",
  future: "bg-amber-50 text-amber-950",
} as const

const themeLabels = {
  ethics: "Democracy",
  surveillance: "Surveillance",
  infrastructure: "Infrastructure",
  future: "Public health",
} as const

const civicActions = getServiceActions().slice(0, 3)

function Home() {
  const { savedSlugs, isSaved, toggleSaved } = useSavedTopics()
  const { preferences } = useCivicPreferences()
  const { alerts, isLive } = useLiveCivicAlerts(preferences.state)
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const actions = civicActions

  const watchedAlerts = useMemo(() => {
    if (savedSlugs.length === 0) return alerts
    const saved = new Set(savedSlugs)
    return alerts.filter((alert) => saved.has(alert.slug))
  }, [alerts, savedSlugs])

  const localAlerts = alerts.filter((alert) => {
    const place = `${alert.region} ${alert.topic}`.toLowerCase()
    return (
      place.includes(preferences.state.toLowerCase()) ||
      (preferences.state === "Michigan" && alert.slug.startsWith("michigan-"))
    )
  })

  const filteredTopics = topics.filter((topic) =>
    [topic.title, topic.summary, topic.status, topic.region]
      .join(" ")
      .toLowerCase()
      .includes(deferredQuery)
  )

  const locationLabel = preferences.city
    ? `${preferences.city}, ${preferences.state}`
    : preferences.state

  return (
    <div className="min-h-svh bg-[#f8f5ef] text-zinc-950">
      <SiteHeader />
      <main>
        <section className="overflow-hidden border-b border-zinc-200 bg-[#f8f5ef]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-20">
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-black text-zinc-700 shadow-sm">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  Civic monitor active
                </span>
                <span className="rounded-full border border-zinc-200 px-3 py-1.5 text-[11px] font-bold text-zinc-500">
                  {isLive ? "Live data connected" : "Verified library mode"}
                </span>
              </div>
              <h1 className="mt-7 max-w-4xl text-5xl leading-[0.92] font-black tracking-[-0.055em] text-zinc-950 sm:text-7xl lg:text-[5.4rem]">
                Know before
                <br />
                <span className="text-red-700">they vote.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-600 sm:text-xl">
                Follow the issues you care about. CivicNote finds the decisions,
                shows the evidence, and tells you exactly when your voice can
                still change the outcome.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#your-feed"
                  className="inline-flex h-12 items-center rounded-xl bg-zinc-950 px-5 text-xs font-black tracking-[0.1em] text-white uppercase shadow-lg shadow-zinc-950/10 transition hover:-translate-y-0.5 hover:bg-red-700"
                >
                  Open your feed ↓
                </a>
                <a
                  href="#choose-topics"
                  className="inline-flex h-12 items-center rounded-xl border border-zinc-300 bg-white px-5 text-xs font-black tracking-[0.1em] text-zinc-900 uppercase transition hover:border-zinc-950"
                >
                  Choose issues
                </a>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-zinc-200 pt-6 text-xs font-bold text-zinc-500">
                <span>
                  <strong className="text-zinc-950">{topics.length}</strong>{" "}
                  active issue desks
                </span>
                <span>
                  <strong className="text-zinc-950">{alerts.length}</strong>{" "}
                  verified updates
                </span>
                <span>
                  <strong className="text-zinc-950">Source-linked</strong> by
                  default
                </span>
              </div>
            </div>

            <aside className="relative rounded-[2rem] bg-zinc-950 p-5 text-white shadow-2xl shadow-zinc-950/15 sm:p-7">
              <div className="absolute -top-16 -right-20 size-56 rounded-full bg-red-700/30 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black tracking-[0.16em] text-red-400 uppercase">
                    Near {locationLabel}
                  </p>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-zinc-300">
                    {localAlerts.length || "No"} matches
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-black tracking-tight">
                  Local decisions deserve an early warning.
                </h2>
                <div className="mt-6 grid gap-3">
                  {(localAlerts.length ? localAlerts : alerts)
                    .slice(0, 2)
                    .map((alert, index) => (
                      <Link
                        key={alert.id}
                        to="/topics/$slug"
                        params={{ slug: alert.slug }}
                        className={`rounded-2xl border p-4 transition hover:bg-white/10 ${
                          index === 0
                            ? "border-red-500/40 bg-red-500/10"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.12em] uppercase">
                          <span
                            className={
                              index === 0 ? "text-red-300" : "text-zinc-400"
                            }
                          >
                            {alert.topic}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-400">
                            {alert.publishedAt}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-5 font-black text-white">
                          {alert.title}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">
                          {alert.nextDecisionPoint}
                        </p>
                      </Link>
                    ))}
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-base text-zinc-950">
                      ⌖
                    </span>
                    <div>
                      <p className="text-xs font-black">Privacy by design</p>
                      <p className="mt-1 text-[11px] leading-4 text-zinc-400">
                        CivicNote matches jurisdictions without retaining your
                        exact address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section
          id="your-feed"
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black tracking-[0.18em] text-red-700 uppercase">
                Your civic radar
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                What changed.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
                {savedSlugs.length
                  ? `Matched to your ${savedSlugs.length} watched ${savedSlugs.length === 1 ? "issue" : "issues"}.`
                  : "A starter feed of high-impact issues. Follow topics below to personalize it."}
              </p>
            </div>
            <Link
              to="/updates"
              className="text-sm font-black text-zinc-950 underline decoration-red-600 decoration-2 underline-offset-4"
            >
              See every update →
            </Link>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {watchedAlerts.slice(0, 4).map((alert, index) => (
              <CivicAlertCard
                key={alert.id}
                alert={alert}
                featured={index === 0}
              />
            ))}
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:py-20">
            <div>
              <p className="text-[11px] font-black tracking-[0.18em] text-red-700 uppercase">
                Make it personal
              </p>
              <h2 className="mt-3 text-4xl leading-[1] font-black tracking-[-0.04em]">
                Signal, not notification noise.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-zinc-600">
                Pick a place and pace. Urgent alerts are reserved for votes,
                hearings, filings, and public-comment windows—not every
                headline.
              </p>
              <div className="mt-8 hidden rounded-3xl bg-[#f8f5ef] p-5 lg:block">
                <p className="text-xs font-black">A useful alert answers:</p>
                <ol className="mt-4 grid gap-3 text-sm text-zinc-600">
                  <li>
                    <strong className="text-zinc-950">1.</strong> What happened?
                  </li>
                  <li>
                    <strong className="text-zinc-950">2.</strong> What does the
                    evidence prove?
                  </li>
                  <li>
                    <strong className="text-zinc-950">3.</strong> Who decides,
                    and by when?
                  </li>
                  <li>
                    <strong className="text-zinc-950">4.</strong> What can I do
                    right now?
                  </li>
                </ol>
              </div>
            </div>
            <div className="rounded-[2rem] border border-zinc-200 bg-[#faf9f6] p-5 shadow-sm sm:p-7">
              <AlertPreferences />
            </div>
          </div>
        </section>

        <section className="bg-zinc-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="text-[11px] font-black tracking-[0.18em] text-red-400 uppercase">
                  Action window
                </p>
                <h2 className="mt-3 text-4xl leading-none font-black tracking-[-0.04em]">
                  Before the gavel falls.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400">
                  The best time to organize is while a decision is still open.
                  Each action is tied to an accountable official or public
                  record.
                </p>
              </div>
              <div className="grid gap-3">
                {actions.map((action, index) => (
                  <article
                    key={`${action.slug}-${action.title}`}
                    className="group grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-xs font-black text-red-300">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black">{action.title}</p>
                        <span className="rounded-full bg-red-500/15 px-2 py-1 text-[9px] font-black tracking-[0.12em] text-red-300 uppercase">
                          {action.difficulty}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-zinc-400">
                        {action.topic} · {action.nextDecisionPoint}
                      </p>
                    </div>
                    <Link
                      to="/topics/$slug"
                      params={{ slug: action.slug }}
                      className="text-xs font-black text-white group-hover:text-red-300"
                    >
                      Act now →
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="choose-topics"
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black tracking-[0.18em] text-red-700 uppercase">
                Issue desks
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Choose what matters.
              </h2>
            </div>
            <label className="block sm:w-80">
              <span className="sr-only">Search issues</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search issues or places…"
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold transition outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              />
            </label>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTopics.map((topic) => (
              <article
                key={topic.slug}
                className="flex min-h-72 flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-950/5"
              >
                <div
                  className={`flex items-center justify-between px-5 py-4 ${themeStyles[topic.theme]}`}
                >
                  <span className="text-[10px] font-black tracking-[0.14em] uppercase">
                    {themeLabels[topic.theme]}
                  </span>
                  <span className="text-[10px] font-black tracking-[0.14em] uppercase opacity-60">
                    {topic.region}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-xl leading-tight font-black">
                    {topic.shortTitle}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
                    {topic.summary}
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-6">
                    <button
                      type="button"
                      aria-pressed={isSaved(topic.slug)}
                      onClick={() => toggleSaved(topic.slug)}
                      className={`h-10 rounded-xl px-4 text-xs font-black transition ${
                        isSaved(topic.slug)
                          ? "bg-red-700 text-white"
                          : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                      }`}
                    >
                      {isSaved(topic.slug) ? "✓ Following" : "+ Follow"}
                    </button>
                    <Link
                      to="/topics/$slug"
                      params={{ slug: topic.slug }}
                      className="ml-auto text-xs font-black text-zinc-950 underline decoration-zinc-300 decoration-2 underline-offset-4 hover:decoration-red-600"
                    >
                      Open dossier
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {filteredTopics.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center">
              <p className="text-lg font-black">
                No issue desk matches that search.
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Try a broader issue, place, or policy term.
              </p>
            </div>
          ) : null}
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-zinc-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            <strong className="text-zinc-950">CivicNote</strong> · Evidence
            before outrage. Action before the deadline.
          </p>
          <div className="flex gap-5 font-bold">
            <Link to="/methodology" className="hover:text-zinc-950">
              Methodology
            </Link>
            <Link to="/sources" className="hover:text-zinc-950">
              Sources
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
