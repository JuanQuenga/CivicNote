import { Link, createFileRoute } from "@tanstack/react-router"

import { SiteHeader } from "@/components/SiteHeader"

export const Route = createFileRoute("/support")({ component: SupportPage })

function SupportPage() {
  return (
    <div className="min-h-svh bg-[#f8f5ef] text-zinc-950">
      <SiteHeader />
      <main>
        <header className="bg-zinc-950 text-white">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-[11px] font-black tracking-[0.18em] text-red-400 uppercase">
              Support
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl leading-[0.94] font-black tracking-[-0.05em] sm:text-7xl">
              Help with the alert, not just the app.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Report incorrect civic information, a broken official link, an
              accessibility barrier, or a technical problem.
            </p>
          </div>
        </header>

        <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10 sm:px-6 sm:py-14 md:grid-cols-2">
          {[
            {
              title: "Something is factually wrong",
              body: "Send the alert URL, the disputed sentence, and an official record or other source that helps us verify the correction.",
            },
            {
              title: "A deadline or meeting changed",
              body: "Use the official organizer or agency page first. Then tell us which CivicNote alert needs an urgent update.",
            },
            {
              title: "Notifications are not arriving",
              body: "Check browser or device notification permission, confirm alerts are enabled, and include your browser or device version in the report.",
            },
            {
              title: "I need my local data removed",
              body: "Website feed copies and preferences can be cleared from browser site-data settings. Contact us if a production installation deletion flow is unavailable.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-zinc-200 bg-white p-6"
            >
              <h2 className="text-xl font-black">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                {item.body}
              </p>
            </article>
          ))}
        </section>

        <section className="border-y border-zinc-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
            <p className="text-[11px] font-black tracking-[0.16em] text-red-700 uppercase">
              Contact
            </p>
            <a
              href="mailto:support@civicnote.org"
              className="mt-3 inline-block text-2xl font-black underline decoration-red-700 decoration-3 underline-offset-6"
            >
              support@civicnote.org
            </a>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              This is a placeholder launch address. Response times and the final
              support domain require owner approval. CivicNote is not an emergency
              service; contact the relevant public agency for immediate safety or
              legal needs.
            </p>
            <div className="mt-6 flex gap-5 text-sm font-black">
              <Link to="/privacy" className="hover:text-red-700">
                Privacy
              </Link>
              <Link to="/methodology" className="hover:text-red-700">
                Methodology
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
