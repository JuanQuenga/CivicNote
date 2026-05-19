import { useCallback, useEffect, useMemo, useState } from "react"
import * as SecureStore from "expo-secure-store"

const STORAGE_KEY = "civic-research-hub:saved-topics"

export function useSavedTopics() {
  const [savedSlugs, setSavedSlugs] = useState<Array<string>>([])

  useEffect(() => {
    let mounted = true

    SecureStore.getItemAsync(STORAGE_KEY)
      .then((raw) => {
        if (!mounted || !raw) return
        setSavedSlugs(JSON.parse(raw) as Array<string>)
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(savedSlugs)).catch(
      () => {}
    )
  }, [savedSlugs])

  const toggleSaved = useCallback((slug: string) => {
    setSavedSlugs((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug]
    )
  }, [])

  return useMemo(
    () => ({
      savedSlugs,
      isSaved: (slug: string) => savedSlugs.includes(slug),
      toggleSaved,
    }),
    [savedSlugs, toggleSaved]
  )
}
