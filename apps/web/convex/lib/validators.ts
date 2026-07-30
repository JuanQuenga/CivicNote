import { v } from "convex/values"

// Shared between the schema and the functions that write against it, so a
// scope literal is spelled once. `apiV1` and the iOS client both key their
// region filtering off these exact five values.
export const geographicScope = v.union(
  v.literal("local"),
  v.literal("state"),
  v.literal("regional"),
  v.literal("national"),
  v.literal("international")
)

// The anonymous device identity every mobile endpoint is keyed on.
export function validateInstallationId(value: string) {
  if (value.length < 16 || value.length > 200) {
    throw new Error("Invalid installationId")
  }
}

export function googleNewsFeedUrl(query: string) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}`
}

export type GeographicScope =
  | "local"
  | "state"
  | "regional"
  | "national"
  | "international"
