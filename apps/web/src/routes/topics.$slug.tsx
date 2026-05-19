import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import type { CSSProperties } from "react"
import type { ResearchTopic, TopicModule } from "../../convex/seedTopics"

import { SiteHeader } from "@/components/SiteHeader"
import { SourceLinks } from "@/components/SourceLinks"
import { getTopicBySlug, topics } from "@/lib/topics"
import { useSavedTopics } from "@/lib/useSavedTopics"

export const Route = createFileRoute("/topics/$slug")({
  component: TopicPage,
})

const urgencyStyles = {
  low: "border-zinc-300 bg-zinc-100 text-zinc-800",
  medium: "border-amber-300 bg-amber-50 text-amber-900",
  high: "border-red-300 bg-red-50 text-red-900",
} as const

function TopicPage() {
  const { slug } = Route.useParams()
  const topic = getTopicBySlug(slug)
  const { isSaved, toggleSaved } = useSavedTopics()

  if (!topic) {
    return (
      <div className="min-h-svh bg-[#f7f4ee] text-zinc-950">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20">
          <p className="text-xs font-black tracking-[0.2em] text-red-700 uppercase">
            Topic not found
          </p>
          <h1 className="mt-4 text-4xl font-black">
            That topic has not been added yet.
          </h1>
          <Link
            to="/"
            className="mt-8 inline-flex h-11 items-center border border-zinc-950 bg-zinc-950 px-5 text-xs font-black tracking-[0.16em] text-white uppercase hover:bg-white hover:text-zinc-950"
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
              <p className="text-xs font-black tracking-[0.2em] text-red-700 uppercase">
                Topic {topic.topicNumber} / {topic.region} / Updated{" "}
                {topic.updatedAt}
              </p>
              <h1 className="mt-5 text-5xl leading-[0.92] font-black sm:text-7xl">
                {topic.title}
              </h1>
              <p className="mt-6 text-xl leading-8 text-zinc-700">
                {topic.tagline}
              </p>
              <button
                type="button"
                onClick={() => toggleSaved(topic.slug)}
                className={`mt-7 h-11 border px-5 text-xs font-black tracking-[0.16em] uppercase ${
                  isSaved(topic.slug)
                    ? "border-red-700 bg-red-700 text-white"
                    : "border-zinc-950 bg-zinc-950 text-white hover:bg-white hover:text-zinc-950"
                }`}
              >
                {isSaved(topic.slug) ? "Following Topic" : "Follow Topic"}
              </button>
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-200 bg-zinc-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
            <article className="border border-white/10 bg-zinc-900 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-black tracking-[0.2em] text-zinc-400 uppercase">
                  Current Status
                </p>
                <span
                  className={`border px-3 py-1 text-[10px] font-black tracking-[0.14em] uppercase ${urgencyStyles[topic.statusBrief.urgency]}`}
                >
                  {topic.statusBrief.urgency} urgency
                </span>
              </div>
              <h2 className="mt-4 text-3xl leading-tight font-black">
                {topic.statusBrief.headline}
              </h2>
              <p className="mt-4 text-sm leading-6 text-zinc-300">
                {topic.statusBrief.summary}
              </p>
              <dl className="mt-6 grid gap-4 text-sm">
                <div className="border-t border-white/10 pt-4">
                  <dt className="font-black tracking-[0.14em] text-zinc-500 uppercase">
                    Latest Development
                  </dt>
                  <dd className="mt-2 leading-6 text-zinc-200">
                    {topic.statusBrief.latestDevelopment}
                  </dd>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <dt className="font-black tracking-[0.14em] text-zinc-500 uppercase">
                    Next Decision
                  </dt>
                  <dd className="mt-2 leading-6 text-zinc-200">
                    {topic.statusBrief.nextDecisionPoint}
                  </dd>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <dt className="font-black tracking-[0.14em] text-zinc-500 uppercase">
                    Who Can Act
                  </dt>
                  <dd className="mt-2 leading-6 text-zinc-200">
                    {topic.statusBrief.whoCanAct}
                  </dd>
                </div>
              </dl>
              <p className="mt-5 text-xs font-black tracking-[0.14em] text-zinc-500 uppercase">
                Last checked {topic.statusBrief.lastChecked}
              </p>
            </article>

            <div className="grid gap-4 md:grid-cols-2">
              {topic.updates.map((update) => (
                <a
                  key={update.url}
                  href={update.url}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-white/10 bg-white p-5 text-zinc-950 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[10px] font-black tracking-[0.14em] text-red-700 uppercase">
                      {update.tag}
                    </p>
                    <time className="text-[10px] font-black tracking-[0.14em] text-zinc-500 uppercase">
                      {update.publishedAt}
                    </time>
                  </div>
                  <h3 className="mt-4 text-xl leading-tight font-black">
                    {update.title}
                  </h3>
                  <p className="mt-2 text-xs font-black tracking-[0.12em] text-zinc-500 uppercase">
                    {update.publisher}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-700">
                    {update.summary}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
          {topic.modules.map((module, index) => (
            <TopicModuleView
              key={`${module.type}-${module.title}`}
              module={module}
              topic={topic}
              index={index}
            />
          ))}
          {topic.modules.some(
            (module) => module.type === "actionList"
          ) ? null : (
            <TopicModuleView
              module={{
                type: "actionList",
                eyebrow: "Public action",
                title: "Do the next useful thing",
                actions: topic.actions,
              }}
              topic={topic}
              index={topic.modules.length}
            />
          )}
          {topic.modules.some((module) => module.type === "timeline") ? null : (
            <TopicModuleView
              module={{
                type: "timeline",
                eyebrow: "Milestones",
                title: "What moved this topic",
                items: topic.timeline,
              }}
              topic={topic}
              index={topic.modules.length + 1}
            />
          )}
        </section>

        <section className="border-t border-zinc-200 bg-zinc-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black tracking-[0.2em] text-zinc-400 uppercase">
                  Source Library
                </p>
                <h2 className="mt-2 text-3xl font-black">Linked documents</h2>
              </div>
              <Link
                to="/"
                className="inline-flex h-10 items-center justify-center border border-white px-4 text-xs font-black tracking-[0.16em] text-white uppercase hover:bg-white hover:text-zinc-950"
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
                  <p className="mt-2 text-xs font-semibold tracking-[0.12em] text-zinc-400 uppercase">
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
          <p className="mb-4 text-xs font-black tracking-[0.2em] text-zinc-500 uppercase">
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
                  className="border border-zinc-300 bg-white px-4 py-3 text-xs font-black tracking-[0.14em] text-zinc-800 uppercase hover:border-zinc-950"
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

const claimStatusStyles = {
  documented: "border-emerald-300 bg-emerald-50 text-emerald-900",
  contested: "border-amber-300 bg-amber-50 text-amber-900",
  unsupported: "border-red-300 bg-red-50 text-red-900",
  watch: "border-zinc-300 bg-zinc-100 text-zinc-800",
} as const

function TopicModuleView({
  module,
  topic,
  index,
}: {
  module: TopicModule
  topic: ResearchTopic
  index: number
}) {
  const shell =
    index % 2 === 0
      ? "border-zinc-200 bg-white"
      : "border-zinc-200 bg-[#f7f4ee]"

  if (module.type === "briefing") {
    return (
      <article className={`border p-6 sm:p-8 ${shell}`}>
        <ModuleHeader module={module} />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4">
            {module.body.map((paragraph) => (
              <p
                key={paragraph}
                className="text-base leading-8 text-zinc-700 sm:text-lg"
              >
                {paragraph}
              </p>
            ))}
            {module.sourceIndexes ? (
              <SourceLinks topic={topic} indexes={module.sourceIndexes} />
            ) : null}
          </div>
          {module.bullets ? (
            <ul className="grid content-start gap-3">
              {module.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="border-l-2 border-zinc-950 bg-white px-4 py-3 text-sm leading-6 text-zinc-700"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>
    )
  }

  if (module.type === "statGrid") {
    return (
      <article className={`border p-6 sm:p-8 ${shell}`}>
        <ModuleHeader module={module} />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {module.stats.map((stat) => (
            <div
              key={stat.label}
              className="border border-zinc-200 bg-white p-5"
            >
              <p className="text-4xl font-black">{stat.value}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-700">
                {stat.label}
              </p>
              <div className="mt-4">
                <SourceLinks topic={topic} indexes={stat.sourceIndexes} />
              </div>
            </div>
          ))}
        </div>
      </article>
    )
  }

  if (module.type === "evidenceMatrix") {
    return (
      <article className={`border p-6 sm:p-8 ${shell}`}>
        <ModuleHeader module={module} summary={module.summary} />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {module.rows.map((row) => (
            <div
              key={row.label}
              className="border border-zinc-200 bg-white p-5"
            >
              <h3 className="text-xl font-black">{row.label}</h3>
              <p className="mt-4 text-xs font-black tracking-[0.14em] text-emerald-800 uppercase">
                Evidence
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                {row.evidence}
              </p>
              <p className="mt-4 text-xs font-black tracking-[0.14em] text-red-700 uppercase">
                Caveat
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                {row.caveat}
              </p>
              <div className="mt-4">
                <SourceLinks topic={topic} indexes={row.sourceIndexes} />
              </div>
            </div>
          ))}
        </div>
      </article>
    )
  }

  if (module.type === "claimLedger") {
    return (
      <article className={`border p-6 sm:p-8 ${shell}`}>
        <ModuleHeader module={module} />
        <div className="mt-6 grid gap-3">
          {module.rows.map((row) => (
            <div
              key={row.claim}
              className="grid gap-4 border border-zinc-200 bg-white p-5 lg:grid-cols-[0.9fr_120px_1.1fr]"
            >
              <p className="text-sm leading-6 font-semibold text-zinc-950">
                {row.claim}
              </p>
              <span
                className={`h-fit border px-3 py-1 text-center text-[10px] font-black tracking-[0.14em] uppercase ${
                  claimStatusStyles[row.status]
                }`}
              >
                {row.status}
              </span>
              <div>
                <p className="text-sm leading-6 text-zinc-700">{row.finding}</p>
                <div className="mt-4">
                  <SourceLinks topic={topic} indexes={row.sourceIndexes} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    )
  }

  if (module.type === "tracker") {
    return (
      <article className={`border p-6 sm:p-8 ${shell}`}>
        <ModuleHeader module={module} />
        <div className="mt-6 overflow-hidden border border-zinc-200 bg-white">
          <div
            className="hidden border-b border-zinc-200 bg-zinc-950 text-white lg:grid"
            style={{
              gridTemplateColumns: `repeat(${module.columns.length}, minmax(0, 1fr)) 180px`,
            }}
          >
            {module.columns.map((column) => (
              <p
                key={column}
                className="border-r border-white/10 p-4 text-xs font-black tracking-[0.14em] uppercase"
              >
                {column}
              </p>
            ))}
            <p className="p-4 text-xs font-black tracking-[0.14em] uppercase">
              Sources
            </p>
          </div>
          {module.rows.map((row, rowIndex) => (
            <div
              key={`${row.cells.join("-")}-${rowIndex}`}
              className="grid gap-0 border-b border-zinc-200 last:border-b-0 lg:grid-cols-[var(--tracker-cols)]"
              style={
                {
                  "--tracker-cols": `${module.columns
                    .map(() => "minmax(0, 1fr)")
                    .join(" ")} 180px`,
                } as CSSProperties
              }
            >
              {row.cells.map((cell, cellIndex) => (
                <div
                  key={`${cell}-${cellIndex}`}
                  className="border-b border-zinc-100 p-4 lg:border-r lg:border-b-0"
                >
                  <p className="mb-2 text-[10px] font-black tracking-[0.14em] text-zinc-500 uppercase lg:hidden">
                    {module.columns[cellIndex]}
                  </p>
                  <p className="text-sm leading-6 text-zinc-700">{cell}</p>
                </div>
              ))}
              <div className="p-4">
                <SourceLinks topic={topic} indexes={row.sourceIndexes} />
              </div>
            </div>
          ))}
        </div>
      </article>
    )
  }

  if (module.type === "moneyTrail") {
    return (
      <article className={`border p-6 sm:p-8 ${shell}`}>
        <ModuleHeader module={module} />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {module.rows.map((row) => (
            <div
              key={row.actor}
              className="border border-zinc-200 bg-white p-5"
            >
              <p className="text-xs font-black tracking-[0.16em] text-red-700 uppercase">
                {row.actor}
              </p>
              <h3 className="mt-4 text-xl font-black">{row.mechanism}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-700">
                {row.impact}
              </p>
              <div className="mt-4">
                <SourceLinks topic={topic} indexes={row.sourceIndexes} />
              </div>
            </div>
          ))}
        </div>
      </article>
    )
  }

  if (module.type === "policyLevers") {
    return (
      <article className={`border p-6 sm:p-8 ${shell}`}>
        <ModuleHeader module={module} />
        <div className="mt-6 grid gap-4">
          {module.levers.map((lever) => (
            <div
              key={`${lever.actor}-${lever.lever}`}
              className="grid gap-4 border border-zinc-200 bg-white p-5 md:grid-cols-[180px_1fr_1fr]"
            >
              <p className="text-sm font-black text-red-700">{lever.actor}</p>
              <p className="text-sm leading-6 font-semibold text-zinc-950">
                {lever.lever}
              </p>
              <div>
                <p className="text-sm leading-6 text-zinc-700">
                  {lever.pressurePoint}
                </p>
                <div className="mt-4">
                  <SourceLinks topic={topic} indexes={lever.sourceIndexes} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    )
  }

  if (module.type === "actionList") {
    return (
      <article className={`border p-6 sm:p-8 ${shell}`}>
        <ModuleHeader module={module} />
        <div className="mt-6 grid gap-4">
          {module.actions.map((action, actionIndex) => (
            <ActionCard
              action={action}
              index={actionIndex}
              key={action.title}
            />
          ))}
        </div>
      </article>
    )
  }

  return (
    <article className={`border p-6 sm:p-8 ${shell}`}>
      <ModuleHeader module={module} />
      <div className="mt-6 grid gap-4">
        {module.items.map((item) => (
          <div
            key={`${item.date}-${item.title}`}
            className="grid gap-4 border border-zinc-200 bg-white p-5 sm:grid-cols-[120px_1fr]"
          >
            <time className="text-sm font-black tracking-[0.16em] text-red-700 uppercase">
              {item.date}
            </time>
            <div>
              <h3 className="text-xl font-black">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                {item.description}
              </p>
              <div className="mt-4">
                <SourceLinks topic={topic} indexes={item.sourceIndexes} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function ModuleHeader({
  module,
  summary,
}: {
  module: Pick<TopicModule, "title" | "eyebrow">
  summary?: string
}) {
  return (
    <div className="max-w-4xl">
      <p className="text-xs font-black tracking-[0.2em] text-zinc-500 uppercase">
        {module.eyebrow}
      </p>
      <h2 className="mt-2 text-3xl leading-tight font-black sm:text-4xl">
        {module.title}
      </h2>
      {summary ? (
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600">
          {summary}
        </p>
      ) : null}
    </div>
  )
}

function ActionCard({
  action,
  index,
}: {
  action: NonNullable<ReturnType<typeof getTopicBySlug>>["actions"][number]
  index: number
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle"
  )

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(action.script)
      setCopyState("copied")
    } catch {
      const copied = fallbackCopy(action.script)
      setCopyState(copied ? "copied" : "failed")
    }
    window.setTimeout(() => setCopyState("idle"), 1800)
  }

  return (
    <article className="border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-black text-red-700">
          {(index + 1).toString().padStart(2, "0")}
        </span>
        <span
          className={`border px-3 py-1 text-[10px] font-black tracking-[0.14em] uppercase ${urgencyStyles[action.urgency]}`}
        >
          {action.urgency}
        </span>
        <span className="text-[10px] font-black tracking-[0.14em] text-zinc-500 uppercase">
          {action.audience} / {action.difficulty}
        </span>
      </div>
      <h3 className="mt-4 text-2xl font-black">{action.title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-700">
        {action.description}
      </p>
      <blockquote className="mt-4 border-l-2 border-zinc-950 bg-[#f7f4ee] px-4 py-3 text-sm leading-6 text-zinc-700">
        {action.script}
      </blockquote>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copyScript}
          className="inline-flex h-10 items-center border border-zinc-950 bg-zinc-950 px-4 text-xs font-black tracking-[0.14em] text-white uppercase hover:bg-white hover:text-zinc-950"
        >
          {copyState === "copied"
            ? "Copied"
            : copyState === "failed"
              ? "Copy Failed"
              : "Copy Script"}
        </button>
        {action.ctaUrl ? (
          <a
            href={action.ctaUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center border border-zinc-300 bg-white px-4 text-xs font-black tracking-[0.14em] text-zinc-950 uppercase hover:border-zinc-950"
          >
            {action.ctaLabel}
          </a>
        ) : null}
      </div>
    </article>
  )
}

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.left = "-9999px"
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand("copy")
  document.body.removeChild(textarea)
  return copied
}
