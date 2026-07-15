import { useId, useState } from "react"

import type { AlertCadence, CivicPosition } from "@/lib/useCivicPreferences"
import { useCivicPreferences } from "@/lib/useCivicPreferences"

const stateOptions = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const

const cadences: Array<{ value: AlertCadence; label: string; detail: string }> =
  [
    { value: "instant", label: "Urgent only", detail: "Votes and deadlines" },
    { value: "daily", label: "Daily brief", detail: "One useful digest" },
    { value: "weekly", label: "Weekly", detail: "The bigger picture" },
  ]

const positions: Array<{ value: CivicPosition; label: string }> = [
  { value: "monitor", label: "Keep me informed" },
  { value: "oppose", label: "Help me oppose" },
  { value: "support", label: "Help me support" },
]

type AlertPreferencesProps = {
  compact?: boolean
  onComplete?: () => void
}

export function AlertPreferences({
  compact = false,
  onComplete,
}: AlertPreferencesProps) {
  const { preferences, updatePreferences } = useCivicPreferences()
  const [permissionMessage, setPermissionMessage] = useState("")
  const cityId = useId()
  const stateId = useId()

  const requestNotifications = async () => {
    if (preferences.notificationsEnabled) {
      updatePreferences({ notificationsEnabled: false })
      setPermissionMessage("Browser alert previews are off.")
      return
    }

    if (!("Notification" in window)) {
      setPermissionMessage("Browser notifications are not supported here.")
      return
    }

    const permission = await Notification.requestPermission()
    const enabled = permission === "granted"
    updatePreferences({ notificationsEnabled: enabled })
    setPermissionMessage(
      enabled
        ? "Browser previews are allowed. Remote alerts arrive through the CivicNote mobile app."
        : "Browser previews remain off. You can change this in browser settings."
    )
  }

  return (
    <div className={compact ? "grid gap-5" : "grid gap-7"}>
      <fieldset>
        <legend className="text-[11px] font-black tracking-[0.16em] text-zinc-500 uppercase">
          Your area
        </legend>
        <p className="mt-2 text-sm leading-5 text-zinc-600">
          We store the place, not your precise address.
        </p>
        <div className="mt-3 grid grid-cols-[1fr_1.15fr] gap-2">
          <label htmlFor={cityId} className="sr-only">
            City
          </label>
          <input
            id={cityId}
            value={preferences.city}
            onChange={(event) =>
              updatePreferences({ city: event.target.value })
            }
            placeholder="City"
            autoComplete="address-level2"
            className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold transition outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
          />
          <label htmlFor={stateId} className="sr-only">
            State
          </label>
          <select
            id={stateId}
            value={preferences.state}
            onChange={(event) =>
              updatePreferences({ state: event.target.value })
            }
            autoComplete="address-level1"
            className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold transition outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
          >
            {stateOptions.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] font-black tracking-[0.16em] text-zinc-500 uppercase">
          Alert me
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {cadences.map((cadence) => (
            <button
              key={cadence.value}
              type="button"
              aria-pressed={preferences.cadence === cadence.value}
              onClick={() => updatePreferences({ cadence: cadence.value })}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                preferences.cadence === cadence.value
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400"
              }`}
            >
              <span className="block text-xs font-black">{cadence.label}</span>
              <span
                className={`mt-1 block text-[11px] ${
                  preferences.cadence === cadence.value
                    ? "text-zinc-400"
                    : "text-zinc-500"
                }`}
              >
                {cadence.detail}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] font-black tracking-[0.16em] text-zinc-500 uppercase">
          My goal
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {positions.map((position) => (
            <button
              key={position.value}
              type="button"
              aria-pressed={preferences.position === position.value}
              onClick={() => updatePreferences({ position: position.value })}
              className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                preferences.position === position.value
                  ? "border-red-700 bg-red-50 text-red-800"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {position.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black">Browser alert previews</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Preview time-sensitive alerts here. Mobile handles remote push.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.notificationsEnabled}
            aria-label="Enable browser alert previews"
            onClick={() => void requestNotifications()}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              preferences.notificationsEnabled ? "bg-red-700" : "bg-zinc-300"
            }`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                preferences.notificationsEnabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
        {permissionMessage ? (
          <p aria-live="polite" className="mt-3 text-xs text-zinc-600">
            {permissionMessage}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <div>
          <p className="text-sm font-black">Protect quiet hours</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Hold non-critical alerts overnight for the next digest.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={preferences.quietHoursEnabled}
          aria-label="Protect quiet hours"
          onClick={() =>
            updatePreferences({
              quietHoursEnabled: !preferences.quietHoursEnabled,
            })
          }
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            preferences.quietHoursEnabled ? "bg-zinc-950" : "bg-zinc-300"
          }`}
        >
          <span
            className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
              preferences.quietHoursEnabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      {onComplete ? (
        <button
          type="button"
          onClick={onComplete}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-red-700 px-5 text-xs font-black tracking-[0.12em] text-white uppercase transition hover:bg-red-800"
        >
          Save alert settings
        </button>
      ) : null}
    </div>
  )
}
