import { Link, createFileRoute } from "@tanstack/react-router"

import { SiteHeader } from "@/components/SiteHeader"
import { getServiceActions } from "@/lib/service"

export const Route = createFileRoute("/actions")({ component: ActionsPage })

const urgencyStyles = {
  low: "border-zinc-300 bg-zinc-100 text-zinc-800",
  medium: "border-amber-300 bg-amber-50 text-amber-900",
  high: "border-red-300 bg-red-50 text-red-900",
} as const

function ActionsPage() {
  const actions = getServiceActions()

  return (
    <div className="min-h-svh bg-[#f7f4ee] text-zinc-950">
      <SiteHeader />
      <main>
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-xs font-black tracking-[0.2em] text-red-700 uppercase">
              Action center
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl leading-none font-black sm:text-7xl">
              Small civic tasks tied to real pressure points.
            </h1>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          {actions.map((action, index) => (
            <article
              key={`${action.slug}-${action.title}`}
              className="border border-zinc-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-black text-red-700">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <span
                  className={`border px-3 py-1 text-[10px] font-black tracking-[0.14em] uppercase ${
                    urgencyStyles[action.urgency]
                  }`}
                >
                  {action.urgency}
                </span>
                <span className="text-[10px] font-black tracking-[0.12em] text-zinc-500 uppercase">
                  {action.topic} / {action.difficulty}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-black">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                {action.description}
              </p>
              <p className="mt-4 border-l-2 border-zinc-950 bg-[#f7f4ee] px-4 py-3 text-sm leading-6 text-zinc-700">
                {action.script}
              </p>
              <p className="mt-4 text-xs font-black tracking-[0.12em] text-zinc-500 uppercase">
                Next decision: {action.nextDecisionPoint}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/topics/$slug"
                  params={{ slug: action.slug }}
                  className="inline-flex h-10 items-center border border-zinc-950 bg-zinc-950 px-4 text-xs font-black tracking-[0.14em] text-white uppercase hover:bg-white hover:text-zinc-950"
                >
                  Open Dossier
                </Link>
                {action.ctaUrl ? (
                  <a
                    href={action.ctaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center border border-zinc-300 bg-white px-4 text-xs font-black tracking-[0.14em] text-zinc-800 uppercase hover:border-zinc-950"
                  >
                    {action.ctaLabel}
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
