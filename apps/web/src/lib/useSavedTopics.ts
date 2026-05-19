import { useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "civic-research-hub:saved-topics"

function readSavedTopics() {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Array<string>) : []
  } catch {
    return []
  }
}

export function useSavedTopics() {
  const [savedSlugs, setSavedSlugs] = useState<Array<string>>([])

  useEffect(() => {
    setSavedSlugs(readSavedTopics())
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSlugs))
  }, [savedSlugs])

  return useMemo(
    () => ({
      savedSlugs,
      isSaved: (slug: string) => savedSlugs.includes(slug),
      toggleSaved: (slug: string) => {
        setSavedSlugs((current) =>
          current.includes(slug)
            ? current.filter((item) => item !== slug)
            : [...current, slug],
        )
      },
    }),
    [savedSlugs],
  )
}
