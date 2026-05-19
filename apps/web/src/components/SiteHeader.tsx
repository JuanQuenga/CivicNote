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
          <Link to="/updates" className="hidden hover:text-zinc-950 sm:inline">
            Updates
          </Link>
          <Link to="/actions" className="hidden hover:text-zinc-950 sm:inline">
            Actions
          </Link>
          <Link to="/sources" className="hidden hover:text-zinc-950 sm:inline">
            Sources
          </Link>
          <Link
            to="/methodology"
            className="hidden hover:text-zinc-950 md:inline"
          >
            Method
          </Link>
        </nav>
      </div>
    </header>
  )
}
