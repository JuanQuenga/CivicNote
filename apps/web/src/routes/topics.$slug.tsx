import { Link, createFileRoute } from "@tanstack/react-router"

import { SiteHeader } from "@/components/SiteHeader"
import { SourceLinks } from "@/components/SourceLinks"
import { getTopicBySlug, topics } from "@/lib/topics"

export const Route = createFileRoute("/topics/$slug")({
  component: TopicPage,
})

function TopicPage() {
  const { slug } = Route.useParams()
  const topic = getTopicBySlug(slug)

  if (!topic) {
    return (
      <div className="min-h-svh bg-[#f7f4ee] text-zinc-950">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
            Topic not found
          </p>
          <h1 className="mt-4 text-4xl font-black">
            That topic has not been added yet.
          </h1>
          <Link
            to="/"
            className="mt-8 inline-flex h-11 items-center border border-zinc-950 bg-zinc-950 px-5 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-white hover:text-zinc-950"
          >
            Back to Topics
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-[#f7f4ee] text-zinc-950">
      <SiteHeader />
      <main>
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
                Topic {topic.topicNumber} / {topic.region} / Updated{" "}
                {topic.updatedAt}
              </p>
              <h1 className="mt-5 text-5xl font-black leading-[0.92] sm:text-7xl">
                {topic.title}
              </h1>
              <p className="mt-6 text-xl leading-8 text-zinc-700">
                {topic.tagline}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
          {topic.stats.map((stat) => (
            <article
              key={stat.label}
              className="border border-zinc-200 bg-white p-6"
            >
              <p className="text-4xl font-black">{stat.value}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-700">
                {stat.label}
              </p>
              <div className="mt-4">
                <SourceLinks topic={topic} indexes={stat.sourceIndexes} />
              </div>
            </article>
          ))}
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <article className="border border-zinc-200 bg-white p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
              Why it matters
            </p>
            <p className="mt-5 text-lg leading-8 text-zinc-700">
              {topic.summary}
            </p>
          </article>

          <div className="grid gap-4">
            {topic.arguments.map((argument) => (
              <article
                key={argument.title}
                className="border border-zinc-200 bg-white p-6"
              >
                <h2 className="text-2xl font-black">{argument.title}</h2>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-red-700">
                  Argument
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  {argument.claim}
                </p>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-800">
                  Response
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  {argument.counterpoint}
                </p>
                <div className="mt-5">
                  <SourceLinks topic={topic} indexes={argument.sourceIndexes} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                  Research Findings
                </p>
                <h2 className="mt-2 text-3xl font-black">Evidence snapshot</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-zinc-600">
                These are intentionally structured so later AI deep research can
                add or revise findings without changing the page code.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {topic.findings.map((finding) => (
                <article
                  key={finding.title}
                  className="border border-zinc-200 bg-[#f7f4ee] p-6"
                >
                  <h3 className="text-xl font-black">{finding.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-700">
                    {finding.body}
                  </p>
                  <div className="mt-4">
                    <SourceLinks topic={topic} indexes={finding.sourceIndexes} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
              Public Action
            </p>
            <h2 className="mt-2 text-3xl font-black">What to ask next</h2>
          </div>
          <div className="grid gap-3">
            {topic.actions.map((action, index) => (
              <div
                key={action}
                className="flex gap-4 border border-zinc-200 bg-white p-5"
              >
                <span className="text-sm font-black text-red-700">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <p className="text-sm leading-6 text-zinc-700">{action}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-zinc-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                  Source Library
                </p>
                <h2 className="mt-2 text-3xl font-black">Linked documents</h2>
              </div>
              <Link
                to="/"
                className="inline-flex h-10 items-center justify-center border border-white px-4 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-white hover:text-zinc-950"
              >
                All Topics
              </Link>
            </div>
            <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2">
              {topic.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-zinc-950 p-5 hover:bg-zinc-900"
                >
                  <p className="text-sm font-black">{source.title}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    {source.publisher} / {source.year}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {source.note}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
            Related Topics
          </p>
          <div className="flex flex-wrap gap-3">
            {topics
              .filter((item) => item.slug !== topic.slug)
              .map((item) => (
                <Link
                  key={item.slug}
                  to="/topics/$slug"
                  params={{ slug: item.slug }}
                  className="border border-zinc-300 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-800 hover:border-zinc-950"
                >
                  {item.shortTitle}
                </Link>
              ))}
          </div>
        </section>
      </main>
    </div>
  )
}
