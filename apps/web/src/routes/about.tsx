import { Link, createFileRoute } from "@tanstack/react-router"

import { SiteHeader } from "@/components/SiteHeader"

export const Route = createFileRoute("/about")({ component: AboutPage })

function AboutPage() {
  return (
    <div className="min-h-svh bg-[#f8f5ef] text-zinc-950">
      <SiteHeader />
      <main>
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <span className="grid size-12 place-items-center rounded-2xl bg-red-700 text-xl font-black text-white">
              C
            </span>
            <p className="mt-8 text-[11px] font-black tracking-[0.18em] text-red-700 uppercase">
              About CivicNote
            </p>
            <h1 className="mt-5 max-w-5xl text-5xl leading-[0.92] font-black tracking-[-0.055em] sm:text-8xl">
              Public decisions should not arrive as a surprise.
            </h1>
          </div>
        </header>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div className="text-lg leading-9 text-zinc-700">
            <p>
              CivicNote is an independent civic information service. It follows
              public records, meetings, votes, hearings, and comment periods, then
              organizes them around the issues and places a person chooses.
            </p>
            <p className="mt-6">
              The goal is not to maximize outrage or time on site. A useful alert
              says what changed, shows the underlying evidence, identifies who can
              still act, and makes the deadline visible.
            </p>
            <p className="mt-6 font-bold text-zinc-950">
              CivicNote is not a government agency, campaign, political party, law
              firm, or emergency service.
            </p>
          </div>
          <aside className="rounded-[2rem] bg-zinc-950 p-7 text-white">
            <p className="text-[11px] font-black tracking-[0.16em] text-red-400 uppercase">
              Editorial commitments
            </p>
            <ul className="mt-5 grid gap-4 text-sm leading-6 text-zinc-300">
              <li>Link material claims to named public or primary sources.</li>
              <li>Separate documented facts from analysis and advocacy.</li>
              <li>Make corrections and currentness visible.</li>
              <li>Reserve alerts for moments when attention can still matter.</li>
              <li>Collect less personal data than the product could collect.</li>
            </ul>
          </aside>
        </section>

        <section className="border-y border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Inspect how the work is done.</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Read the methodology, privacy draft, or send a correction.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/methodology"
                className="rounded-xl bg-zinc-950 px-4 py-3 text-xs font-black text-white"
              >
                Methodology
              </Link>
              <Link
                to="/support"
                className="rounded-xl border border-zinc-300 px-4 py-3 text-xs font-black"
              >
                Support
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
