import { useCivicPreferences } from "@/src/lib/CivicPreferencesContext"

export function useSavedTopics() {
  const { preferences, isSaved, toggleSaved } = useCivicPreferences()
  return { savedSlugs: preferences.followedTopicSlugs, isSaved, toggleSaved }
}
