import { Link, Stack, useLocalSearchParams } from "expo-router"
import {
  ArrowUpRight,
  CalendarClock,
  MapPin,
  Share2,
  ShieldCheck,
  Users,
} from "lucide-react-native"
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useCivicEventDetail } from "@/src/lib/liveCivicEvents"

const urgencyStyles = {
  urgent: "bg-red-50 text-red-800",
  important: "bg-amber-50 text-amber-800",
  watch: "bg-slate-100 text-slate-700",
} as const

export default function CivicEventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { event, isLoading } = useCivicEventDetail(id)
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f7f4ee]">
        <ActivityIndicator color="#B91C1C" />
        <Text className="mt-3 font-bold text-slate-600">
          Loading civic alert…
        </Text>
      </SafeAreaView>
    )
  }
  if (!event) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f7f4ee] px-6">
        <Text className="text-2xl font-bold text-slate-950">
          This alert is no longer available.
        </Text>
        <Link href="/" className="mt-4 font-bold text-red-700">
          Return to Today
        </Link>
      </SafeAreaView>
    )
  }

  const checkedLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(event.checkedAt))
  const meetingLabel = event.startsAt
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(event.startsAt))
    : null

  return (
    <>
      <Stack.Screen options={{ title: event.topic }} />
      <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={["bottom"]}>
        <ScrollView contentContainerClassName="pb-10">
          <View className="bg-slate-950 px-5 pt-7 pb-8">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${urgencyStyles[event.urgency]}`}
              >
                {event.urgency}
              </Text>
              <Text className="text-xs font-bold tracking-[1px] text-slate-400 uppercase">
                {event.topic} · checked {checkedLabel}
              </Text>
            </View>
            <Text className="mt-5 text-4xl leading-[43px] font-bold text-white">
              {event.title}
            </Text>
            <Text className="mt-4 text-base leading-7 text-slate-300">
              {event.summary}
            </Text>
            <View className="mt-6 flex-row items-center gap-2">
              <MapPin color="#FCA5A5" size={17} />
              <Text className="font-bold text-red-200">{event.location}</Text>
            </View>
            {event.scheduleVerified && meetingLabel ? (
              <View className="mt-5 rounded-[20px] bg-white/10 p-4">
                <View className="flex-row items-center gap-2">
                  <CalendarClock color="#FCA5A5" size={18} />
                  <Text className="font-bold text-white">{meetingLabel}</Text>
                </View>
                {event.venue ? (
                  <Text className="mt-2 text-sm text-slate-300">
                    {event.venue}
                  </Text>
                ) : null}
                <Text className="mt-2 text-xs leading-5 text-slate-400">
                  Schedule verified when this brief was checked. Confirm the
                  official agenda before traveling.
                </Text>
              </View>
            ) : null}
          </View>

          <View className="gap-4 px-5 py-6">
            <View className="rounded-[26px] border border-slate-200 bg-white p-5">
              <Text className="text-xs font-bold tracking-[1.5px] text-red-700 uppercase">
                Why this matters
              </Text>
              <Text className="mt-3 text-base leading-7 text-slate-700">
                {event.whyItMatters}
              </Text>
            </View>

            <View className="rounded-[26px] bg-red-700 p-5">
              <View className="flex-row items-center gap-2">
                <Users color="#FECACA" size={19} />
                <Text className="text-xs font-bold tracking-[1.5px] text-red-100 uppercase">
                  Ask the decision-maker
                </Text>
              </View>
              <Text className="mt-3 text-sm font-bold text-white">
                {event.decisionMaker}
              </Text>
              <Text className="mt-4 rounded-[20px] bg-white/10 p-4 text-base leading-7 text-white">
                “{event.script}”
              </Text>
              <Pressable
                className="mt-4 flex-row items-center justify-center gap-2 rounded-full bg-white px-5 py-4"
                onPress={() =>
                  void Share.share({
                    message: `${event.title}\n\n${event.script}\n\n${event.actionUrl}`,
                  })
                }
              >
                <Share2 color="#B91C1C" size={18} />
                <Text className="font-bold text-red-800">
                  Share action script
                </Text>
              </Pressable>
            </View>

            <View className="rounded-[26px] border border-slate-200 bg-white p-5">
              <View className="flex-row items-center gap-2">
                <ShieldCheck color="#15803D" size={20} />
                <Text className="text-xs font-bold tracking-[1.5px] text-slate-500 uppercase">
                  Evidence
                </Text>
              </View>
              <Text className="mt-3 text-sm leading-6 text-slate-600">
                CivicNote separates documented facts from general risks. Check
                official agendas for live meeting dates and last-minute changes.
              </Text>
              <View className="mt-4 gap-2">
                {event.evidence.map((source) => (
                  <Pressable
                    className="rounded-[18px] bg-stone-50 p-4"
                    key={source.url}
                    onPress={() => void Linking.openURL(source.url)}
                  >
                    <View className="flex-row items-start gap-3">
                      <View className="flex-1">
                        <Text className="font-bold text-slate-950">
                          {source.label}
                        </Text>
                        <Text className="mt-1 text-xs text-slate-500">
                          {source.publisher}
                        </Text>
                      </View>
                      <ArrowUpRight color="#B91C1C" size={18} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              className="flex-row items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4"
              onPress={() => void Linking.openURL(event.actionUrl)}
            >
              <CalendarClock color="#FFFFFF" size={18} />
              <Text className="font-bold text-white">{event.actionLabel}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
