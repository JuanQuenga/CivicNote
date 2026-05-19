import { useEffect, useMemo, useState } from "react"
import {
  DeviceEventEmitter,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native"
import { X } from "lucide-react-native"
import { topics } from "@/src/lib/topics"
import { MobileMapOverlay } from "./MobileMapOverlay"

type MapMode = "map" | "status" | "sources"

type OpenPayload = {
  mode?: MapMode
}

const topicPositions = [
  { top: "31%", left: "57%" },
  { top: "47%", left: "49%" },
  { top: "58%", left: "42%" },
  { top: "38%", left: "66%" },
] as const

const urgencyClasses = {
  low: "bg-zinc-300",
  medium: "bg-amber-400",
  high: "bg-red-600",
} as const

export function MobileAppMapSheet() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<MapMode>("map")
  const [selectedSlug, setSelectedSlug] = useState(topics[0]?.slug ?? null)
  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.slug === selectedSlug) ?? topics[0],
    [selectedSlug]
  )

  useEffect(() => {
    const toggle = DeviceEventEmitter.addListener("research-map:toggle", () => {
      setIsOpen((current) => !current)
    })
    const open = DeviceEventEmitter.addListener(
      "research-map:open",
      (payload?: OpenPayload) => {
        setMode(payload?.mode ?? "map")
        setIsOpen(true)
      }
    )

    return () => {
      toggle.remove()
      open.remove()
    }
  }, [])

  return (
    <MobileMapOverlay isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <View className="flex-1">
        <View className="flex-row items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
          <View>
            <Text className="text-xs font-bold tracking-[2px] text-red-700 uppercase">
              Research Map
            </Text>
            <Text className="mt-1 text-2xl font-bold text-zinc-950">
              Topic terrain
            </Text>
          </View>
          <Pressable
            className="h-10 w-10 items-center justify-center border border-zinc-200"
            onPress={() => setIsOpen(false)}
          >
            <X color="#18181B" size={20} />
          </Pressable>
        </View>

        <View className="flex-row border-b border-zinc-200 bg-white px-5 py-3">
          {(["map", "status", "sources"] as const).map((item) => (
            <Pressable
              className={`mr-2 border px-4 py-2 ${
                mode === item
                  ? "border-zinc-950 bg-zinc-950"
                  : "border-zinc-200 bg-white"
              }`}
              key={item}
              onPress={() => setMode(item)}
            >
              <Text
                className={`text-xs font-bold tracking-[1.2px] uppercase ${
                  mode === item ? "text-white" : "text-zinc-700"
                }`}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === "map" ? (
          <View className="flex-1 px-5 py-5">
            <View className="min-h-[320px] flex-1 overflow-hidden border border-zinc-300 bg-zinc-950">
              <View className="absolute inset-x-8 top-10 h-44 rotate-[-14deg] rounded-[110px] border border-white/15 bg-emerald-900/40" />
              <View className="absolute bottom-8 left-14 h-44 w-36 rotate-[22deg] rounded-[90px] border border-white/15 bg-blue-900/35" />
              <View className="absolute top-24 right-8 h-52 w-28 rotate-[10deg] rounded-[80px] border border-white/15 bg-amber-900/35" />
              {topics.map((topic, index) => (
                <Pressable
                  key={topic.slug}
                  style={topicPositions[index % topicPositions.length]}
                  className="absolute"
                  onPress={() => setSelectedSlug(topic.slug)}
                >
                  <View
                    className={`h-4 w-4 rounded-full border-2 border-white ${
                      urgencyClasses[topic.statusBrief.urgency]
                    }`}
                  />
                  <Text className="mt-2 max-w-[120px] text-xs font-bold text-white">
                    {topic.shortTitle}
                  </Text>
                </Pressable>
              ))}
            </View>

            {selectedTopic ? (
              <View className="border-x border-b border-zinc-200 bg-white p-5">
                <Text className="text-xs font-bold tracking-[1.6px] text-zinc-500 uppercase">
                  {selectedTopic.region} / {selectedTopic.status}
                </Text>
                <Text className="mt-2 text-2xl font-bold text-zinc-950">
                  {selectedTopic.title}
                </Text>
                <Text className="mt-3 text-sm leading-6 text-zinc-700">
                  {selectedTopic.statusBrief.summary}
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-5 py-5"
            contentContainerClassName="pb-8"
          >
            <View className="gap-4">
              {topics.map((topic) => (
                <View
                  key={topic.slug}
                  className="border border-zinc-200 bg-white p-5"
                >
                  <Text className="text-xs font-bold tracking-[1.6px] text-red-700 uppercase">
                    {topic.region} / {topic.statusBrief.urgency} urgency
                  </Text>
                  <Text className="mt-2 text-xl font-bold text-zinc-950">
                    {mode === "sources"
                      ? `${topic.shortTitle} sources`
                      : topic.statusBrief.headline}
                  </Text>
                  <Text className="mt-3 text-sm leading-6 text-zinc-700">
                    {mode === "sources"
                      ? topic.sources
                          .slice(0, 2)
                          .map(
                            (source) => `${source.publisher}: ${source.title}`
                          )
                          .join("\n")
                      : topic.statusBrief.latestDevelopment}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </MobileMapOverlay>
  )
}
