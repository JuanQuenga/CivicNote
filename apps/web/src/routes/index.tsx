import { Link, createFileRoute } from "@tanstack/react-router"

import { SiteHeader } from "@/components/SiteHeader"
import { SourceLinks } from "@/components/SourceLinks"
import { getAllStats, topics } from "@/lib/topics"

export const Route = createFileRoute("/")({ component: Home })

const themeStyles = {
  ethics: "border-red-200 bg-red-50 text-red-900",
  surveillance: "border-zinc-300 bg-zinc-950 text-white",
  infrastructure: "border-emerald-200 bg-emerald-50 text-emerald-950",
  future: "border-amber-200 bg-amber-50 text-amber-950",
} as const

function Home() {
  const stats = getAllStats().slice(0, 6)

  return (
    <div className="min-h-svh bg-[#f7f4ee] text-zinc-950">
      <SiteHeader />
      <main>
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
            <div>
              <p className="mb-5 text-xs font-black uppercase tracking-[0.22em] text-red-700">
                Research-backed topic organizing
              </p>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-normal text-zinc-950 sm:text-7xl lg:text-8xl">
                One home for civic fights that need receipts.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-700 sm:text-xl">
                A combined TanStack Start site for the first three topics:
                congressional stock trading, Michigan surveillance tech, and
                Michigan data-center accountability. Each topic uses the same
                structure for arguments, stats, actions, and linked sources.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#topics"
                  className="inline-flex h-11 items-center border border-zinc-950 bg-zinc-950 px-5 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-white hover:text-zinc-950"
                >
                  Browse Topics
                </a>
                <a
                  href="#sources"
                  className="inline-flex h-11 items-center border border-zinc-300 bg-white px-5 text-xs font-black uppercase tracking-[0.16em] text-zinc-950 hover:border-zinc-950"
                >
                  Source Model
                </a>
              </div>
            </div>

            <div className="grid content-start gap-4">
              {stats.map((stat) => (
                <Link
                  key={`${stat.slug}-${stat.label}`}
                  to="/topics/$slug"
                  params={{ slug: stat.slug }}
                  className="border border-zinc-200 bg-[#f7f4ee] p-5 transition hover:-translate-y-0.5 hover:border-zinc-950 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-3xl font-black leading-none">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-sm leading-5 text-zinc-700">
                        {stat.label}
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                      {stat.topic}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          id="topics"
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
        >
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                Active Topics
              </p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                Built to add more topics later
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-zinc-600">
              The same topic record supports AI research notes, pro/con
              arguments, public-action prompts, numeric claims, and a source
              library with per-claim links.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {topics.map((topic) => (
              <article
                key={topic.slug}
                className="flex min-h-[420px] flex-col border border-zinc-200 bg-white"
              >
                <div className={`border-b p-6 ${themeStyles[topic.theme]}`}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
                      Topic {topic.topicNumber}
                    </p>
                    <p className="text-xs font-black uppercase tracking-[0.14em] opacity-80">
                      {topic.region}
                    </p>
                  </div>
                  <h3 className="mt-10 text-3xl font-black leading-none">
                    {topic.title}
                  </h3>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    {topic.status}
                  </p>
                  <p className="mt-4 text-base leading-7 text-zinc-700">
                    {topic.summary}
                  </p>

                  <div className="mt-6 grid gap-3">
                    {topic.stats.slice(0, 2).map((stat) => (
                      <div
                        key={stat.label}
                        className="border-l-2 border-zinc-950 pl-4"
                      >
                        <p className="text-2xl font-black">{stat.value}</p>
                        <p className="text-sm text-zinc-600">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/topics/$slug"
                    params={{ slug: topic.slug }}
                    className="mt-auto inline-flex h-11 items-center justify-center border border-zinc-950 bg-zinc-950 px-5 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-white hover:text-zinc-950"
                  >
                    Open Research
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="sources" className="border-y border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                  Citation Pattern
                </p>
                <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                  Claims carry source links with them.
                </h2>
                <p className="mt-4 text-sm leading-6 text-zinc-600">
                  Each argument, finding, and stat stores indexes into the
                  topic&apos;s source library. That keeps the visible text tied
                  to the documents it depends on as the site grows.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {topics.map((topic) => (
                  <div
                    key={topic.slug}
                    className="border border-zinc-200 bg-[#f7f4ee] p-5"
                  >
                    <p className="text-sm font-black">{topic.shortTitle}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {topic.findings[0]?.body}
                    </p>
                    <div className="mt-4">
                      <SourceLinks
                        topic={topic}
                        indexes={topic.findings[0]?.sourceIndexes ?? []}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
