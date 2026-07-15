import { useCallback, useEffect, useMemo, useState } from "react"

export type AlertCadence = "instant" | "daily" | "weekly"
export type CivicPosition = "oppose" | "support" | "monitor"

export type CivicPreferences = {
  city: string
  state: string
  cadence: AlertCadence
  position: CivicPosition
  notificationsEnabled: boolean
  quietHoursEnabled: boolean
}

const STORAGE_KEY = "civicnote:alert-preferences:v1"
const PREFERENCES_EVENT = "civicnote:preferences-changed"

type StoredPreferences = {
  city?: unknown
  state?: unknown
  cadence?: unknown
  position?: unknown
  intent?: unknown
  notificationsEnabled?: unknown
  quietHoursEnabled?: unknown
}

const defaultPreferences: CivicPreferences = {
  city: "",
  state: "Michigan",
  cadence: "instant",
  position: "monitor",
  notificationsEnabled: false,
  quietHoursEnabled: true,
}

function isCadence(value: unknown): value is AlertCadence {
  return value === "instant" || value === "daily" || value === "weekly"
}

function isPosition(value: unknown): value is CivicPosition {
  return value === "oppose" || value === "support" || value === "monitor"
}

function readPreferences(): CivicPreferences {
  if (typeof window === "undefined") return defaultPreferences

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}"
    ) as StoredPreferences
    const storedCadence =
      stored.cadence === "urgent" ? "instant" : stored.cadence

    return {
      city: typeof stored.city === "string" ? stored.city : "",
      state: typeof stored.state === "string" ? stored.state : "Michigan",
      cadence: isCadence(storedCadence) ? storedCadence : "instant",
      position: isPosition(stored.position)
        ? stored.position
        : isPosition(stored.intent)
          ? stored.intent
          : "monitor",
      notificationsEnabled: stored.notificationsEnabled === true,
      quietHoursEnabled: stored.quietHoursEnabled !== false,
    }
  } catch {
    return defaultPreferences
  }
}

export function useCivicPreferences() {
  const [preferences, setPreferencesState] =
    useState<CivicPreferences>(defaultPreferences)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setPreferencesState(readPreferences())
    setIsLoaded(true)

    const syncPreferences = () => setPreferencesState(readPreferences())
    window.addEventListener(PREFERENCES_EVENT, syncPreferences)
    window.addEventListener("storage", syncPreferences)

    return () => {
      window.removeEventListener(PREFERENCES_EVENT, syncPreferences)
      window.removeEventListener("storage", syncPreferences)
    }
  }, [])

  const setPreferences = useCallback(
    (
      next: CivicPreferences | ((current: CivicPreferences) => CivicPreferences)
    ) => {
      setPreferencesState((current) => {
        const value = typeof next === "function" ? next(current) : next
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
          window.dispatchEvent(new Event(PREFERENCES_EVENT))
        }
        return value
      })
    },
    []
  )

  const updatePreferences = useCallback(
    (updates: Partial<CivicPreferences>) => {
      setPreferences((current) => ({ ...current, ...updates }))
    },
    [setPreferences]
  )

  return useMemo(
    () => ({ preferences, setPreferences, updatePreferences, isLoaded }),
    [preferences, setPreferences, updatePreferences, isLoaded]
  )
}
