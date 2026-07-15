import { Link } from "@tanstack/react-router"

const navigation = [
  { to: "/" as const, label: "For you", icon: "⌂" },
  { to: "/updates" as const, label: "Updates", icon: "◉" },
  { to: "/actions" as const, label: "Act", icon: "✦" },
  { to: "/sources" as const, label: "Evidence", icon: "▤" },
]

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/90 bg-[#faf8f3]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-4 px-2">
        {navigation.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            activeProps={{
              className: "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200",
            }}
            inactiveProps={{ className: "text-zinc-500" }}
            className="my-1 flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-black transition"
          >
            <span aria-hidden="true" className="text-base leading-none">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
