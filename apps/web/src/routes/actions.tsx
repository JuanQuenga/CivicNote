import { Link, createFileRoute } from "@tanstack/react-router"

import { SiteHeader } from "@/components/SiteHeader"
import { getServiceActions } from "@/lib/service"
import { useCivicPreferences } from "@/lib/useCivicPreferences"

export const Route = createFileRoute("/actions")({ component: ActionsPage })

const urgencyStyles = {
  low: "bg-zinc-100 text-zinc-700",
  medium: "bg-amber-100 text-amber-900",
  high: "bg-red-700 text-white",
} as const

const actions = getServiceActions()

function ActionsPage() {
  const { preferences } = useCivicPreferences()
  const goalLabel =
    preferences.position === "monitor"
      ? "stay informed"
      : `${preferences.position} harmful policy`

  return (
    <div className="min-h-svh bg-[#f8f5ef] text-zinc-950">
      <SiteHeader />
      <main>
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.55fr] lg:px-8">
            <div>
              <p className="text-[11px] font-black tracking-[0.18em] text-red-700 uppercase">
                Action center
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl leading-[0.92] font-black tracking-[-0.05em] sm:text-7xl">
                Turn concern into
                <br />
                <span className="text-red-700">public record.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
                Calls, testimony, records requests, and meeting prep tied to the
                people who can still change the outcome.
              </p>
            </div>
            <aside className="self-end rounded-3xl bg-zinc-950 p-6 text-white">
              <p className="text-[10px] font-black tracking-[0.14em] text-red-400 uppercase">
                Your action profile
              </p>
              <p className="mt-3 text-2xl font-black capitalize">{goalLabel}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Prioritizing {preferences.cadence} opportunities near{" "}
                {preferences.city || preferences.state}.
              </p>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-5 lg:grid-cols-2">
            {actions.map((action, index) => (
              <article
                key={`${action.slug}-${action.title}`}
                className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-950/5 sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-zinc-950 text-[10px] font-black text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.12em] uppercase ${urgencyStyles[action.urgency]}`}
                  >
                    {action.urgency} priority
                  </span>
                  <span className="text-[10px] font-black tracking-[0.12em] text-zinc-400 uppercase">
                    {action.topic} · {action.difficulty}
                  </span>
                </div>
                <h2 className="mt-5 text-2xl leading-tight font-black">
                  {action.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {action.description}
                </p>

                <div className="mt-5 rounded-2xl bg-[#f8f5ef] p-4">
                  <p className="text-[10px] font-black tracking-[0.14em] text-zinc-500 uppercase">
                    Use this script
                  </p>
                  <blockquote className="mt-2 text-sm leading-6 font-medium text-zinc-800">
                    “{action.script}”
                  </blockquote>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                  <Link
                    to="/topics/$slug"
                    params={{ slug: action.slug }}
                    className="inline-flex h-11 items-center rounded-xl bg-zinc-950 px-4 text-xs font-black text-white transition hover:bg-red-700"
                  >
                    Read evidence
                  </Link>
                  {action.ctaUrl ? (
                    <a
                      href={action.ctaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center rounded-xl border border-zinc-200 px-4 text-xs font-black text-zinc-800 transition hover:border-zinc-950"
                    >
                      {action.ctaLabel} ↗
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
