import { useEffect, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"

import { AlertPreferences } from "@/components/AlertPreferences"
import { useCivicPreferences } from "@/lib/useCivicPreferences"

export function SiteHeader() {
  const [showPreferences, setShowPreferences] = useState(false)
  const { preferences } = useCivicPreferences()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showPreferences) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowPreferences(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeButtonRef.current?.focus()
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [showPreferences])

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-[#faf8f3]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-red-700 text-sm font-black text-white shadow-sm transition group-hover:rotate-3">
              C
            </span>
            <span className="text-sm font-black tracking-[-0.01em] text-zinc-950">
              CivicNote
            </span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="ml-8 hidden items-center gap-1 md:flex"
          >
            {[
              { to: "/" as const, label: "For you" },
              { to: "/updates" as const, label: "Updates" },
              { to: "/actions" as const, label: "Take action" },
              { to: "/sources" as const, label: "Evidence" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "bg-white text-zinc-950 shadow-sm" }}
                inactiveProps={{
                  className: "text-zinc-500 hover:text-zinc-950",
                }}
                className="rounded-full px-3.5 py-2 text-xs font-black transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 text-xs font-bold text-zinc-500 sm:flex">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-50" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
              </span>
              Monitoring
            </span>
            <button
              type="button"
              onClick={() => setShowPreferences(true)}
              className="ml-1 inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-3.5 text-xs font-black text-white transition hover:bg-red-700"
            >
              <span aria-hidden="true">◎</span>
              <span className="hidden sm:inline">
                {preferences.city || preferences.state || "Set alerts"}
              </span>
              <span className="sm:hidden">Alerts</span>
            </button>
          </div>
        </div>
      </header>

      {showPreferences ? (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-zinc-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setShowPreferences(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-settings-title"
            className="max-h-[92svh] w-full overflow-y-auto rounded-t-3xl bg-[#f8f5ef] p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <p className="text-[11px] font-black tracking-[0.16em] text-red-700 uppercase">
                  Your civic radar
                </p>
                <h2
                  id="alert-settings-title"
                  className="mt-2 text-3xl font-black tracking-tight"
                >
                  Make alerts useful.
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setShowPreferences(false)}
                aria-label="Close alert settings"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-lg font-bold text-zinc-600 shadow-sm hover:text-zinc-950"
              >
                ×
              </button>
            </div>
            <AlertPreferences onComplete={() => setShowPreferences(false)} />
          </section>
        </div>
      ) : null}
    </>
  )
}
