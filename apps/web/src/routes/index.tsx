import { useMemo, useState } from "react"
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

const themeLabels = {
  all: "All",
  ethics: "Ethics",
  surveillance: "Surveillance",
  infrastructure: "Infrastructure",
  future: "Public Health",
} as const

function Home() {
  const [query, setQuery] = useState("")
  const [theme, setTheme] = useState<keyof typeof themeLabels>("all")
  const stats = getAllStats().slice(0, 6)
  const filteredTopics = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return topics.filter((topic) => {
      const matchesTheme = theme === "all" || topic.theme === theme
      const searchable = [
        topic.title,
        topic.shortTitle,
        topic.region,
        topic.status,
        topic.summary,
        topic.statusBrief.headline,
        ...topic.modules.map((module) => module.title),
      ]
        .join(" ")
        .toLowerCase()

      return matchesTheme && searchable.includes(normalizedQuery)
    })
  }, [query, theme])

  return (
    <div className="min-h-svh bg-[#f7f4ee] text-zinc-950">
      <SiteHeader />
      <main>
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
            <div>
              <p className="mb-5 text-xs font-black tracking-[0.22em] text-red-700 uppercase">
                Research-backed topic organizing
              </p>
              <h1 className="max-w-4xl text-5xl leading-[0.9] font-black tracking-normal text-zinc-950 sm:text-7xl lg:text-8xl">
                One home for civic fights that need receipts.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-700 sm:text-xl">
                A combined TanStack Start site for civic research dossiers.
                Browse the directory, filter by issue family, then open a topic
                for its own evidence structure: legal dockets, money trails,
                exposure pathways, claim ledgers, or policy levers.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#topics"
                  className="inline-flex h-11 items-center border border-zinc-950 bg-zinc-950 px-5 text-xs font-black tracking-[0.16em] text-white uppercase hover:bg-white hover:text-zinc-950"
                >
                  Browse Topics
                </a>
                <a
                  href="#sources"
                  className="inline-flex h-11 items-center border border-zinc-300 bg-white px-5 text-xs font-black tracking-[0.16em] text-zinc-950 uppercase hover:border-zinc-950"
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
                      <p className="text-3xl leading-none font-black">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-sm leading-5 text-zinc-700">
                        {stat.label}
                      </p>
                    </div>
                    <span className="text-[10px] font-black tracking-[0.14em] text-zinc-500 uppercase">
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
              <p className="text-xs font-black tracking-[0.2em] text-zinc-500 uppercase">
                Active Topics
              </p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                Built for a growing research library
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-zinc-600">
              Each card stays compact. The deep structure moves inside the
              dossier where modules can match the topic instead of forcing every
              issue into the same layout.
            </p>
          </div>

          <div className="sticky top-0 z-10 mb-6 border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black tracking-[0.16em] text-zinc-500 uppercase">
                  Search topics
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by topic, region, status, or module"
                  className="h-11 w-full border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-950"
                />
              </label>
              <div>
                <p className="mb-2 text-[10px] font-black tracking-[0.16em] text-zinc-500 uppercase">
                  Filter
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(themeLabels).map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() =>
                        setTheme(value as keyof typeof themeLabels)
                      }
                      className={`h-11 border px-4 text-xs font-black tracking-[0.14em] uppercase ${
                        theme === value
                          ? "border-zinc-950 bg-zinc-950 text-white"
                          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-zinc-500">
              Showing {filteredTopics.length} of {topics.length} topics
            </p>
          </div>

          <div className="grid gap-px overflow-hidden border border-zinc-200 bg-zinc-200 lg:grid-cols-2">
            {filteredTopics.map((topic) => (
              <article
                key={topic.slug}
                className="grid bg-white lg:grid-cols-[220px_1fr]"
              >
                <div className={`p-5 ${themeStyles[topic.theme]}`}>
                  <div className="flex items-center justify-between gap-3 lg:block">
                    <p className="text-xs font-black tracking-[0.18em] uppercase opacity-80">
                      Topic {topic.topicNumber}
                    </p>
                    <p className="text-xs font-black tracking-[0.14em] uppercase opacity-80 lg:mt-3">
                      {topic.region}
                    </p>
                  </div>
                  <p className="mt-8 text-[10px] font-black tracking-[0.14em] uppercase opacity-80">
                    {themeLabels[topic.theme]}
                  </p>
                </div>

                <div className="flex min-h-[280px] flex-col p-5">
                  <h3 className="text-2xl leading-tight font-black">
                    {topic.title}
                  </h3>
                  <p className="text-sm font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                    {topic.status}
                  </p>
                  <p className="mt-4 line-clamp-4 text-sm leading-6 text-zinc-700">
                    {topic.summary}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {topic.modules.slice(0, 3).map((module) => (
                      <span
                        key={module.title}
                        className="border border-zinc-200 bg-[#f7f4ee] px-2 py-1 text-[10px] font-black tracking-[0.12em] text-zinc-600 uppercase"
                      >
                        {module.eyebrow}
                      </span>
                    ))}
                  </div>

                  <Link
                    to="/topics/$slug"
                    params={{ slug: topic.slug }}
                    className="mt-auto inline-flex h-11 items-center justify-center border border-zinc-950 bg-zinc-950 px-5 text-xs font-black tracking-[0.16em] text-white uppercase hover:bg-white hover:text-zinc-950"
                  >
                    Open Dossier
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
                <p className="text-xs font-black tracking-[0.2em] text-zinc-500 uppercase">
                  Citation Pattern
                </p>
                <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                  Modules carry source links with them.
                </h2>
                <p className="mt-4 text-sm leading-6 text-zinc-600">
                  Each dossier module stores indexes into the topic&apos;s
                  source library. That keeps legal findings, money trails,
                  exposure pathways, and claim ledgers tied to the documents
                  they depend on.
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
