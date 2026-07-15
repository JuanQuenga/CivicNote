import { Link } from "@tanstack/react-router"

import type { CivicAlert } from "@/lib/service"

const urgencyStyles = {
  high: "bg-red-700 text-white",
  medium: "bg-amber-100 text-amber-950",
  low: "bg-zinc-100 text-zinc-700",
} as const

type CivicAlertCardProps = {
  alert: CivicAlert
  featured?: boolean
}

export function CivicAlertCard({
  alert,
  featured = false,
}: CivicAlertCardProps) {
  return (
    <article
      className={`group flex h-full flex-col rounded-3xl border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-950/5 ${
        featured ? "border-red-200 p-6 sm:p-7" : "border-zinc-200 p-5"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.12em] uppercase ${urgencyStyles[alert.urgency]}`}
        >
          {alert.urgency === "high"
            ? "Action soon"
            : `${alert.urgency} priority`}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-black tracking-[0.12em] text-zinc-600 uppercase">
          {alert.scope}
        </span>
        <span className="ml-auto text-[11px] font-bold text-zinc-400">
          {alert.publishedAt}
        </span>
      </div>

      <p className="mt-5 text-[11px] font-black tracking-[0.16em] text-red-700 uppercase">
        {alert.topic}
      </p>
      <h3
        className={`mt-2 leading-tight font-black text-zinc-950 ${
          featured ? "text-3xl" : "text-xl"
        }`}
      >
        {alert.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{alert.summary}</p>

      <div className="mt-5 rounded-2xl bg-[#f6f3ed] p-4">
        <p className="text-[10px] font-black tracking-[0.14em] text-zinc-500 uppercase">
          Next decision
        </p>
        <p className="mt-1.5 text-sm leading-5 font-bold text-zinc-800">
          {alert.nextDecisionPoint}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-zinc-100 pt-4">
        <div
          className="flex -space-x-1.5"
          aria-label={`${alert.sourceCount} sources`}
        >
          {Array.from({ length: Math.min(alert.sourceCount, 3) }).map(
            (_, index) => (
              <span
                key={index}
                className="grid size-7 place-items-center rounded-full border-2 border-white bg-zinc-900 text-[9px] font-black text-white"
              >
                {index + 1}
              </span>
            )
          )}
        </div>
        <span className="text-[11px] font-bold text-zinc-500">
          {alert.sourceCount} linked sources
        </span>
        <Link
          to="/topics/$slug"
          params={{ slug: alert.slug }}
          className="ml-auto text-xs font-black text-zinc-950 underline decoration-red-600 decoration-2 underline-offset-4 group-hover:text-red-700"
        >
          Read & act →
        </Link>
      </div>
    </article>
  )
}
