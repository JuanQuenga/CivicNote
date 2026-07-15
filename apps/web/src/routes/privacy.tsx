import { Link, createFileRoute } from "@tanstack/react-router"

import { SiteHeader } from "@/components/SiteHeader"

export const Route = createFileRoute("/privacy")({ component: PrivacyPage })

// Draft only: final privacy and retention language requires CivicNote owner/legal approval before launch.
function PrivacyPage() {
  return (
    <div className="min-h-svh bg-[#f8f5ef] text-zinc-950">
      <SiteHeader />
      <main>
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-[11px] font-black tracking-[0.18em] text-red-700 uppercase">
              Privacy draft · July 2026
            </p>
            <h1 className="mt-5 text-5xl leading-[0.94] font-black tracking-[-0.05em] sm:text-7xl">
              Civic alerts without a personal dossier.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              CivicNote is designed to work without an account, advertising
              profile, or precise-location history.
            </p>
          </div>
        </header>

        <div className="mx-auto grid max-w-4xl gap-5 px-4 py-10 sm:px-6 sm:py-14">
          <PrivacySection title="What CivicNote collects">
            <p>
              CivicNote may store an anonymous installation ID, a push token or
              browser push subscription, followed topics, a coarse region such as
              state or city, alert cadence, notification state, and other settings
              you choose. These fields let the service match civic events to this
              installation and deliver the alerts you requested.
            </p>
          </PrivacySection>
          <PrivacySection title="What CivicNote does not collect">
            <p>
              Version 1 does not require an account. CivicNote does not ask for
              your name, email address, contacts, or precise address. It does not
              use advertising trackers, sell personal data, or build cross-site
              browsing profiles.
            </p>
          </PrivacySection>
          <PrivacySection title="Location and device permissions">
            <p>
              You can enter a state or city manually. If a client offers “use
              current area,” location access should occur only after your explicit
              action and retain a coarse area rather than precise coordinates.
              Notification permission is requested only after you choose to enable
              alerts.
            </p>
          </PrivacySection>
          <PrivacySection title="Storage, deletion, and retention">
            <p>
              Feed and alert copies may be stored on your device for offline use.
              You can remove local website data through browser settings and
              unsubscribe from push in CivicNote alert settings. The production
              retention period and installation-deletion process are still being
              finalized and must be approved before launch; this draft does not
              promise a period that has not yet been implemented.
            </p>
          </PrivacySection>
          <PrivacySection title="Questions">
            <p>
              Contact the launch team at{" "}
              <a
                href="mailto:support@civicnote.org"
                className="font-black text-red-700 underline underline-offset-4"
              >
                support@civicnote.org
              </a>
              . This address is a launch placeholder until the owner confirms the
              final support domain and response process.
            </p>
          </PrivacySection>
          <p className="text-sm text-zinc-600">
            Learn more about our{" "}
            <Link
              to="/methodology"
              className="font-black text-zinc-950 underline decoration-red-700 decoration-2 underline-offset-4"
            >
              editorial methodology
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  )
}

function PrivacySection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-black tracking-tight">{title}</h2>
      <div className="mt-4 text-sm leading-7 text-zinc-600">{children}</div>
    </section>
  )
}
