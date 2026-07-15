import { Link } from "expo-router"
import {
  ArrowRight,
  BellRing,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native"
import { Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useCivicPreferences } from "@/src/lib/CivicPreferencesContext"
import { useCivicEventFeed } from "@/src/lib/liveCivicEvents"
import { topics } from "@/src/lib/topics"

const urgencyDot = {
  urgent: "bg-red-600",
  important: "bg-amber-500",
  watch: "bg-slate-400",
} as const

export default function TodayScreen() {
  const { preferences } = useCivicPreferences()
  const { events: civicEvents } = useCivicEventFeed()
  const followed = new Set(preferences.followedTopicSlugs)
  const matchedEvents = civicEvents.filter((event) =>
    followed.has(event.topicSlug)
  )
  const feed = followed.size ? matchedEvents : civicEvents
  const followedTopics = topics.filter((topic) => followed.has(topic.slug))

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={["top"]}>
      <ScrollView contentContainerClassName="pb-8">
        <View className="px-5 pt-5 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold tracking-[2px] text-red-700 uppercase">
                CivicNote
              </Text>
              <Text className="mt-1 text-4xl font-bold text-slate-950">
                Today
              </Text>
            </View>
            <Link href={"/settings" as never} asChild>
              <Pressable className="h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white">
                <BellRing color="#B91C1C" size={21} />
              </Pressable>
            </Link>
          </View>
          <View className="mt-4 flex-row items-center gap-2">
            <MapPin color="#64748B" size={15} />
            <Text className="text-sm text-slate-500">
              {preferences.locationLabel === "Not set"
                ? "Add an area for local matches"
                : `Watching ${preferences.locationLabel}`}
            </Text>
          </View>
        </View>

        {!preferences.onboardingComplete ? (
          <View className="px-5 pb-5">
            <Link href={"/onboarding" as never} asChild>
              <Pressable className="rounded-[28px] bg-red-700 p-5">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <Sparkles color="#FFFFFF" size={19} />
                </View>
                <Text className="mt-4 text-2xl font-bold text-white">
                  Make this feed yours
                </Text>
                <Text className="mt-2 text-sm leading-6 text-red-50">
                  Pick issues, set a general area, and choose how often
                  CivicNote may alert you.
                </Text>
                <View className="mt-4 flex-row items-center gap-2">
                  <Text className="font-bold text-white">Set up alerts</Text>
                  <ArrowRight color="#FFFFFF" size={17} />
                </View>
              </Pressable>
            </Link>
          </View>
        ) : null}

        <View className="px-5">
          <View className="flex-row items-end justify-between gap-4">
            <View className="flex-1">
              <Text className="text-xs font-bold tracking-[1.6px] text-slate-500 uppercase">
                Your signal
              </Text>
              <Text className="mt-1 text-2xl font-bold text-slate-950">
                What deserves attention
              </Text>
            </View>
            <Text className="text-xs font-bold text-slate-500">
              {feed.length} briefs
            </Text>
          </View>

          <View className="mt-4 gap-3">
            {feed.length === 0 ? (
              <View className="rounded-[28px] border border-dashed border-slate-300 bg-white p-6">
                <Text className="text-xl font-bold text-slate-950">
                  Nothing new for your issues yet.
                </Text>
                <Text className="mt-2 text-sm leading-6 text-slate-600">
                  CivicNote will keep checking verified public developments
                  without filling your feed with unrelated alerts.
                </Text>
              </View>
            ) : null}
            {feed.map((event) => (
              <Link
                asChild
                href={`/alerts/${event.id}` as never}
                key={event.id}
              >
                <Pressable className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <View className="flex-row items-center gap-2">
                    <View
                      className={`h-2 w-2 rounded-full ${urgencyDot[event.urgency]}`}
                    />
                    <Text className="flex-1 text-xs font-bold tracking-[1.1px] text-slate-500 uppercase">
                      {event.topic} · {event.location}
                    </Text>
                    <ChevronRight color="#94A3B8" size={18} />
                  </View>
                  <Text className="mt-4 text-2xl leading-8 font-bold text-slate-950">
                    {event.title}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-slate-600">
                    {event.summary}
                  </Text>
                  <View className="mt-4 rounded-[18px] bg-stone-50 p-4">
                    <Text className="text-xs font-bold tracking-[1px] text-red-700 uppercase">
                      Why you’re seeing this
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-slate-600">
                      {followed.has(event.topicSlug)
                        ? `You follow ${event.topic}.`
                        : "Suggested civic brief—follow the topic to personalize alerts."}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        <View className="mt-7 border-y border-slate-200 bg-white px-5 py-6">
          <View className="flex-row items-center gap-2">
            <ShieldCheck color="#15803D" size={19} />
            <Text className="text-xs font-bold tracking-[1.5px] text-slate-500 uppercase">
              Trust layer
            </Text>
          </View>
          <Text className="mt-3 text-xl font-bold text-slate-950">
            Briefs are not meeting calendars.
          </Text>
          <Text className="mt-2 text-sm leading-6 text-slate-600">
            CivicNote links the underlying evidence and clearly asks you to
            verify official agendas before attending or submitting comment.
          </Text>
          <Link href="/methodology" asChild>
            <Pressable className="mt-4">
              <Text className="font-bold text-red-700">
                How claims are checked
              </Text>
            </Pressable>
          </Link>
        </View>

        {followedTopics.length ? (
          <View className="px-5 pt-6">
            <Text className="text-xs font-bold tracking-[1.6px] text-slate-500 uppercase">
              Following
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {followedTopics.map((topic) => (
                <Link asChild href={`/topics/${topic.slug}`} key={topic.slug}>
                  <Pressable className="rounded-full border border-slate-200 bg-white px-4 py-3">
                    <Text className="font-bold text-slate-700">
                      {topic.shortTitle}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
