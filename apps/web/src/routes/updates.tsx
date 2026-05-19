import { Link, createFileRoute } from "@tanstack/react-router"

import { SiteHeader } from "@/components/SiteHeader"
import { getServiceUpdates } from "@/lib/service"

export const Route = createFileRoute("/updates")({ component: UpdatesPage })

function UpdatesPage() {
  const updates = getServiceUpdates()

  return (
    <div className="min-h-svh bg-[#f7f4ee] text-zinc-950">
      <SiteHeader />
      <main>
        <section className="border-b border-zinc-200 bg-zinc-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-xs font-black tracking-[0.2em] text-red-400 uppercase">
              Updates
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl leading-none font-black sm:text-7xl">
              What changed, why it matters, and what to watch next.
            </h1>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          {updates.map((update) => (
            <article key={update.url} className="border border-zinc-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-black tracking-[0.16em] text-red-700 uppercase">
                  {update.topic}
                </span>
                <span className="border border-zinc-300 px-2 py-1 text-[10px] font-black tracking-[0.12em] text-zinc-600 uppercase">
                  {update.urgency} urgency
                </span>
              </div>
              <h2 className="mt-4 text-2xl leading-tight font-black">
                {update.title}
              </h2>
              <p className="mt-2 text-xs font-black tracking-[0.12em] text-zinc-500 uppercase">
                {update.publisher} / {update.publishedAt}
              </p>
              <p className="mt-4 text-sm leading-6 text-zinc-700">
                {update.summary}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/topics/$slug"
                  params={{ slug: update.slug }}
                  className="inline-flex h-10 items-center border border-zinc-950 bg-zinc-950 px-4 text-xs font-black tracking-[0.14em] text-white uppercase hover:bg-white hover:text-zinc-950"
                >
                  Open Dossier
                </Link>
                <a
                  href={update.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center border border-zinc-300 bg-white px-4 text-xs font-black tracking-[0.14em] text-zinc-800 uppercase hover:border-zinc-950"
                >
                  Source
                </a>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
