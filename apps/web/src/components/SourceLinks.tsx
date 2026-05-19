import type { ResearchTopic } from "../../convex/seedTopics"

export function SourceLinks({
  indexes,
  topic,
}: {
  indexes: Array<number>
  topic: ResearchTopic
}) {
  return (
    <span className="inline-flex flex-wrap gap-2">
      {indexes.map((index) => {
        const source = topic.sources[index]

        return (
          <a
            key={`${source.url}-${index}`}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-700 hover:border-zinc-950 hover:text-zinc-950"
          >
            {source.publisher} {source.year}
          </a>
        )
      })}
    </span>
  )
}
