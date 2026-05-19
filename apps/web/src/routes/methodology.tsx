import { createFileRoute } from "@tanstack/react-router"

import { SiteHeader } from "@/components/SiteHeader"
import { methodologyPrinciples } from "@/lib/service"

export const Route = createFileRoute("/methodology")({
  component: MethodologyPage,
})

function MethodologyPage() {
  return (
    <div className="min-h-svh bg-[#f7f4ee] text-zinc-950">
      <SiteHeader />
      <main>
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-xs font-black tracking-[0.2em] text-red-700 uppercase">
              Methodology
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl leading-none font-black sm:text-7xl">
              How the hub decides what belongs in a civic dossier.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700">
              This page is the trust layer: source selection, claim status,
              corrections, currentness, and how future AI-assisted summaries
              should be reviewed before publication.
            </p>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          {methodologyPrinciples.map((principle) => (
            <article
              key={principle.title}
              className="border border-zinc-200 bg-white p-6"
            >
              <h2 className="text-2xl font-black">{principle.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-700">
                {principle.body}
              </p>
            </article>
          ))}
        </section>
        <section className="border-y border-zinc-200 bg-zinc-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[
              ["documented", "Directly supported by linked sources."],
              ["contested", "Credible sources disagree or scope is disputed."],
              ["unsupported", "The claim lacks adequate source support."],
              ["watch", "The record is still moving or incomplete."],
            ].map(([status, body]) => (
              <div key={status} className="border border-white/10 bg-zinc-900 p-5">
                <p className="text-xs font-black tracking-[0.16em] text-red-400 uppercase">
                  {status}
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
