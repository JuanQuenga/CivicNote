import { Link } from "@tanstack/react-router"

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-sm font-black uppercase tracking-[0.22em] text-zinc-950"
        >
          Civic Research Hub
        </Link>
        <nav className="flex items-center gap-5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
          <Link to="/" className="hover:text-zinc-950">
            Topics
          </Link>
          <a
            href="https://dashboard.convex.dev/"
            className="hidden hover:text-zinc-950 sm:inline"
            target="_blank"
            rel="noreferrer"
          >
            Convex
          </a>
        </nav>
      </div>
    </header>
  )
}
