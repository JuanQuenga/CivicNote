import * as Location from "expo-location"
import * as SecureStore from "expo-secure-store"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"

const STORAGE_KEY = "civicnote:civic-preferences:v1"
const LEGACY_SAVED_TOPICS_KEY = "civicnote:saved-topics"

export type AlertCadence = "urgent" | "daily" | "weekly"
export type CivicPosition = "oppose" | "support" | "monitor"

export type CivicPreferences = {
  followedTopicSlugs: Array<string>
  cadence: AlertCadence
  position: CivicPosition
  locationLabel: string
  regionCode: string
  onboardingComplete: boolean
}

const initialPreferences: CivicPreferences = {
  followedTopicSlugs: [],
  cadence: "urgent",
  position: "monitor",
  locationLabel: "Not set",
  regionCode: "",
  onboardingComplete: false,
}

type PreferencesContextValue = {
  preferences: CivicPreferences
  hydrated: boolean
  isSaved: (slug: string) => boolean
  toggleSaved: (slug: string) => void
  setCadence: (cadence: AlertCadence) => void
  setPosition: (position: CivicPosition) => void
  setOnboardingComplete: (complete: boolean) => void
  setManualLocation: (label: string, regionCode?: string) => void
  useCurrentLocation: () => Promise<{ ok: boolean; message: string }>
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

function parseStoredPreferences(raw: string): CivicPreferences {
  let parsed: Partial<CivicPreferences>
  try {
    parsed = JSON.parse(raw) as Partial<CivicPreferences>
  } catch {
    return initialPreferences
  }
  const cadence =
    parsed.cadence === "urgent" ||
    parsed.cadence === "daily" ||
    parsed.cadence === "weekly"
      ? parsed.cadence
      : initialPreferences.cadence
  const position =
    parsed.position === "oppose" ||
    parsed.position === "support" ||
    parsed.position === "monitor"
      ? parsed.position
      : initialPreferences.position
  return {
    ...initialPreferences,
    ...parsed,
    cadence,
    position,
    followedTopicSlugs: Array.isArray(parsed.followedTopicSlugs)
      ? parsed.followedTopicSlugs.filter(
          (value): value is string => typeof value === "string"
        )
      : [],
  }
}

function parseLegacyTopics(raw: string | null) {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : []
  } catch {
    return []
  }
}

const usStateCodes: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
}

function normalizedRegionCode(region: string | null | undefined) {
  if (!region) return ""
  const normalized = region.trim()
  if (/^[A-Z]{2}$/i.test(normalized)) return normalized.toUpperCase()
  return usStateCodes[normalized] ?? ""
}

export function CivicPreferencesProvider({
  children,
}: {
  children: ReactNode
}) {
  const [preferences, setPreferences] =
    useState<CivicPreferences>(initialPreferences)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      SecureStore.getItemAsync(STORAGE_KEY),
      SecureStore.getItemAsync(LEGACY_SAVED_TOPICS_KEY),
    ])
      .then(([raw, legacyRaw]) => {
        if (!active) return
        if (raw) {
          setPreferences(parseStoredPreferences(raw))
          return
        }
        const followedTopicSlugs = parseLegacyTopics(legacyRaw)
        if (followedTopicSlugs.length) {
          setPreferences((current) => ({ ...current, followedTopicSlugs }))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setHydrated(true)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(preferences)).catch(
      () => {}
    )
  }, [hydrated, preferences])

  const toggleSaved = useCallback((slug: string) => {
    setPreferences((current) => ({
      ...current,
      followedTopicSlugs: current.followedTopicSlugs.includes(slug)
        ? current.followedTopicSlugs.filter((item) => item !== slug)
        : [...current.followedTopicSlugs, slug],
    }))
  }, [])

  const setCadence = useCallback((cadence: AlertCadence) => {
    setPreferences((current) => ({ ...current, cadence }))
  }, [])

  const setPosition = useCallback((position: CivicPosition) => {
    setPreferences((current) => ({ ...current, position }))
  }, [])

  const setOnboardingComplete = useCallback((onboardingComplete: boolean) => {
    setPreferences((current) => ({ ...current, onboardingComplete }))
  }, [])

  const setManualLocation = useCallback(
    (locationLabel: string, regionCode = "") => {
      const normalizedLabel = locationLabel.trim() || "Not set"
      const trailingRegion = normalizedLabel.split(",").at(-1)?.trim()
      setPreferences((current) => ({
        ...current,
        locationLabel: normalizedLabel,
        regionCode:
          normalizedRegionCode(regionCode) ||
          normalizedRegionCode(trailingRegion) ||
          "",
      }))
    },
    []
  )

  const useCurrentLocation = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync()
    if (permission.status !== "granted") {
      return {
        ok: false,
        message:
          "Location access is off. You can enter a city or state instead.",
      }
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })
    const [place] = await Location.reverseGeocodeAsync(position.coords)
    const parts = [place?.city, place?.region].filter(Boolean)
    const locationLabel = parts.join(", ") || "Current area"
    setManualLocation(locationLabel, normalizedRegionCode(place?.region))

    return { ok: true, message: `Local alerts set for ${locationLabel}.` }
  }, [setManualLocation])

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      hydrated,
      isSaved: (slug) => preferences.followedTopicSlugs.includes(slug),
      toggleSaved,
      setCadence,
      setPosition,
      setOnboardingComplete,
      setManualLocation,
      useCurrentLocation,
    }),
    [
      hydrated,
      preferences,
      setCadence,
      setPosition,
      setManualLocation,
      setOnboardingComplete,
      toggleSaved,
      useCurrentLocation,
    ]
  )

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function useCivicPreferences() {
  const value = useContext(PreferencesContext)
  if (!value) {
    throw new Error("useCivicPreferences must be used within its provider")
  }
  return value
}
