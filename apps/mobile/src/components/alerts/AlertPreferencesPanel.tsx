import { useState } from "react"
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native"
import { Bell, Check, LocateFixed, MapPin } from "lucide-react-native"
import {
  useCivicPreferences,
  type AlertCadence,
  type CivicPosition,
} from "@/src/lib/CivicPreferencesContext"
import { useNotifications } from "@/src/lib/NotificationContext"
import { topics } from "@/src/lib/topics"

const cadenceOptions: Array<{
  value: AlertCadence
  label: string
  description: string
}> = [
  {
    value: "urgent",
    label: "Urgent only",
    description:
      "Hear about hearings, votes, and deadlines with little time left.",
  },
  {
    value: "daily",
    label: "Daily brief",
    description: "One compact roundup on days when your issues move.",
  },
  {
    value: "weekly",
    label: "Weekly brief",
    description: "A calmer summary of changes and upcoming decision points.",
  },
]

const positionOptions: Array<{ value: CivicPosition; label: string }> = [
  { value: "monitor", label: "Keep me informed" },
  { value: "oppose", label: "Help me oppose" },
  { value: "support", label: "Help me support" },
]

export function AlertPreferencesPanel({
  compact = false,
}: {
  compact?: boolean
}) {
  const {
    preferences,
    isSaved,
    toggleSaved,
    setCadence,
    setPosition,
    setManualLocation,
    useCurrentLocation,
  } = useCivicPreferences()
  const notifications = useNotifications()
  const [manualLocation, setManualLocationInput] = useState(
    preferences.locationLabel === "Not set" ? "" : preferences.locationLabel
  )
  const [locationBusy, setLocationBusy] = useState(false)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)

  return (
    <View className="gap-5">
      <View className="rounded-[28px] border border-slate-200 bg-white p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-red-50">
            <Bell color="#D9151E" size={21} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-950">
              Push alerts
            </Text>
            <Text className="mt-1 text-sm text-slate-500">
              {notifications.isRegistered
                ? "Enabled on this device"
                : notifications.status === "granted"
                  ? "Device permission is on; server alerts are paused"
                  : "Off until you choose to enable them"}
            </Text>
          </View>
          {notifications.isRegistered ? (
            <Check color="#15803D" size={22} />
          ) : null}
        </View>
        {!notifications.isRegistered ? (
          <Pressable
            accessibilityRole="button"
            className="mt-5 items-center rounded-full bg-slate-950 px-5 py-4"
            disabled={notifications.isRegistering}
            onPress={() => void notifications.enableNotifications()}
          >
            {notifications.isRegistering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-bold text-white">Enable civic alerts</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            className="mt-5 items-center rounded-full border border-slate-200 px-5 py-4"
            disabled={notifications.isRegistering}
            onPress={() => void notifications.disableNotifications()}
          >
            {notifications.isRegistering ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text className="font-bold text-slate-700">
                Pause civic alerts
              </Text>
            )}
          </Pressable>
        )}
        {notifications.message ? (
          <Text className="mt-3 text-sm leading-5 text-slate-600">
            {notifications.message}
          </Text>
        ) : null}
        {notifications.status === "denied" ? (
          <Pressable
            className="mt-3"
            onPress={() => void Linking.openSettings()}
          >
            <Text className="font-bold text-red-700">Open device settings</Text>
          </Pressable>
        ) : null}
      </View>

      <View>
        <Text className="text-xs font-bold tracking-[1.6px] text-slate-500 uppercase">
          Your issues
        </Text>
        {!compact ? (
          <Text className="mt-2 text-sm leading-6 text-slate-600">
            Follow what you care about. You can change this at any time.
          </Text>
        ) : null}
        <View className="mt-3 flex-row flex-wrap gap-2">
          {topics.map((topic) => {
            const selected = isSaved(topic.slug)
            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                className={`rounded-full border px-4 py-3 ${
                  selected
                    ? "border-red-700 bg-red-50"
                    : "border-slate-200 bg-white"
                }`}
                key={topic.slug}
                onPress={() => toggleSaved(topic.slug)}
              >
                <Text
                  className={`text-sm font-bold ${
                    selected ? "text-red-800" : "text-slate-700"
                  }`}
                >
                  {selected ? "✓ " : ""}
                  {topic.shortTitle}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View>
        <Text className="text-xs font-bold tracking-[1.6px] text-slate-500 uppercase">
          Your area
        </Text>
        <View className="mt-3 rounded-[24px] border border-slate-200 bg-white p-4">
          <View className="flex-row items-center gap-3">
            <MapPin color="#D9151E" size={20} />
            <Text className="flex-1 font-bold text-slate-950">
              {preferences.locationLabel}
            </Text>
          </View>
          <Pressable
            className="mt-4 flex-row items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-3"
            disabled={locationBusy}
            onPress={async () => {
              setLocationBusy(true)
              try {
                const result = await useCurrentLocation()
                setLocationMessage(result.message)
              } catch {
                setLocationMessage(
                  "We couldn’t determine your area. Enter it manually instead."
                )
              } finally {
                setLocationBusy(false)
              }
            }}
          >
            {locationBusy ? (
              <ActivityIndicator color="#B91C1C" />
            ) : (
              <>
                <LocateFixed color="#B91C1C" size={17} />
                <Text className="font-bold text-red-800">Use current area</Text>
              </>
            )}
          </Pressable>
          <View className="mt-3 flex-row gap-2">
            <TextInput
              autoCapitalize="words"
              className="flex-1 rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-slate-950"
              onChangeText={setManualLocationInput}
              placeholder="City, ST — for example Detroit, MI"
              placeholderTextColor="#94A3B8"
              value={manualLocation}
            />
            <Pressable
              className="justify-center rounded-2xl bg-slate-950 px-4"
              onPress={() => {
                setManualLocation(manualLocation)
                setLocationMessage("Area saved.")
              }}
            >
              <Text className="font-bold text-white">Save</Text>
            </Pressable>
          </View>
          {locationMessage ? (
            <Text className="mt-2 text-xs leading-5 text-slate-500">
              {locationMessage}
            </Text>
          ) : null}
          <Text className="mt-3 text-xs leading-5 text-slate-500">
            CivicNote stores the area label, not your precise coordinates.
          </Text>
        </View>
      </View>

      <View>
        <Text className="text-xs font-bold tracking-[1.6px] text-slate-500 uppercase">
          Your goal
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {positionOptions.map((option) => {
            const selected = preferences.position === option.value
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                className={`rounded-full border px-4 py-3 ${
                  selected
                    ? "border-red-700 bg-red-50"
                    : "border-slate-200 bg-white"
                }`}
                key={option.value}
                onPress={() => setPosition(option.value)}
              >
                <Text
                  className={`font-bold ${
                    selected ? "text-red-800" : "text-slate-700"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View>
        <Text className="text-xs font-bold tracking-[1.6px] text-slate-500 uppercase">
          Alert pace
        </Text>
        <View className="mt-3 gap-2">
          {cadenceOptions.map((option) => {
            const selected = preferences.cadence === option.value
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                className={`rounded-[22px] border p-4 ${
                  selected
                    ? "border-red-700 bg-red-50"
                    : "border-slate-200 bg-white"
                }`}
                key={option.value}
                onPress={() => setCadence(option.value)}
              >
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="font-bold text-slate-950">
                    {option.label}
                  </Text>
                  {selected ? <Check color="#B91C1C" size={19} /> : null}
                </View>
                <Text className="mt-1 text-sm leading-5 text-slate-600">
                  {option.description}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}
