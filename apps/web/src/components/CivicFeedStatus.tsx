import type { CivicFeedStatus as FeedStatus } from "@/lib/useLiveCivicAlerts"

type CivicFeedStatusProps = {
  status: FeedStatus
  fetchedAt: number | null
  dark?: boolean
}

export function CivicFeedStatus({
  status,
  fetchedAt,
  dark = false,
}: CivicFeedStatusProps) {
  const label =
    status === "live"
      ? "Live"
      : status === "offline"
        ? `Offline — showing data from ${relativeTime(fetchedAt)}`
        : status === "stale"
          ? "Stale — refresh recommended"
          : "Checking for updates…"
  const dot =
    status === "live"
      ? "bg-emerald-600"
      : status === "loading"
        ? "bg-amber-500 animate-pulse"
        : "bg-amber-600"

  return (
    <div className="flex flex-col items-start gap-2">
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black shadow-sm ${
          dark
            ? "border-white/10 bg-white/10 text-zinc-100"
            : "border-zinc-200 bg-white text-zinc-700"
        }`}
      >
        <span className={`size-1.5 rounded-full ${dot}`} />
        {label}
      </span>
      {status === "offline" || status === "stale" ? (
        <p
          className={`max-w-xl text-xs leading-5 ${
            dark ? "text-zinc-400" : "text-zinc-600"
          }`}
        >
          Check meeting times and deadlines at the linked official source before
          acting.
        </p>
      ) : null}
    </div>
  )
}

function relativeTime(fetchedAt: number | null) {
  if (!fetchedAt) return "the saved starter brief"
  const elapsedMinutes = Math.max(
    0,
    Math.round((Date.now() - fetchedAt) / 60_000)
  )
  if (elapsedMinutes < 1) return "just now"
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`
  }
  const elapsedHours = Math.round(elapsedMinutes / 60)
  if (elapsedHours < 24) {
    return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`
  }
  const elapsedDays = Math.round(elapsedHours / 24)
  return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`
}
