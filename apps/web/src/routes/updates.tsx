import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"

import { CivicAlertCard } from "@/components/CivicAlertCard"
import { CivicFeedStatus } from "@/components/CivicFeedStatus"
import { SiteHeader } from "@/components/SiteHeader"
import { useCivicPreferences } from "@/lib/useCivicPreferences"
import { useLiveCivicAlerts } from "@/lib/useLiveCivicAlerts"
import { useSavedTopics } from "@/lib/useSavedTopics"

export const Route = createFileRoute("/updates")({ component: UpdatesPage })

const feedFilters = ["all", "following", "near me"] as const
type FeedFilter = (typeof feedFilters)[number]

function UpdatesPage() {
  const { savedSlugs } = useSavedTopics()
  const { preferences } = useCivicPreferences()
  const { alerts, fetchedAt, status } = useLiveCivicAlerts(preferences.state)
  const [filter, setFilter] = useState<FeedFilter>("all")

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "following") return savedSlugs.includes(alert.slug)
    if (filter === "near me") {
      return (
        alert.region.toLowerCase().includes(preferences.state.toLowerCase()) ||
        (preferences.state === "Michigan" && alert.slug.startsWith("michigan-"))
      )
    }
    return true
  })

  return (
    <div className="min-h-svh bg-[#f8f5ef] text-zinc-950">
      <SiteHeader />
      <main>
        <section className="overflow-hidden border-b border-zinc-800 bg-zinc-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <CivicFeedStatus
                status={status}
                fetchedAt={fetchedAt}
                dark
              />
              <span className="rounded-full bg-red-500/15 px-3 py-1.5 text-[11px] font-black text-red-300">
                {alerts.length} verified developments
              </span>
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl leading-[0.92] font-black tracking-[-0.05em] sm:text-7xl">
              The signal inside
              <br />
              <span className="text-red-500">the news cycle.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Each update is matched to a decision, a source, and a next move—so
              you can tell what changed from what merely got louder.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="sticky top-20 z-20 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/90 p-3 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {feedFilters.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-black capitalize transition ${
                    filter === value
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="px-2 text-xs font-bold text-zinc-500">
              Near me:{" "}
              <strong className="text-zinc-950">
                {preferences.city ? `${preferences.city}, ` : ""}
                {preferences.state}
              </strong>
            </p>
          </div>

          {filteredAlerts.length ? (
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              {filteredAlerts.map((alert, index) => (
                <CivicAlertCard
                  key={alert.id}
                  alert={alert}
                  featured={index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center">
              <p className="text-xl font-black">
                {filter === "following"
                  ? "Your watchlist is empty."
                  : "No local matches yet."}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                {filter === "following"
                  ? "Follow an issue from the home page to build a focused feed."
                  : "CivicNote will keep checking this jurisdiction as new public decisions appear."}
              </p>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-5 rounded-xl bg-zinc-950 px-5 py-3 text-xs font-black text-white"
              >
                View all updates
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
