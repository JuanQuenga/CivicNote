import { Link } from "expo-router"
import { ArrowRight, LocateFixed, MapPin } from "lucide-react-native"
import { Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useCivicEventFeed } from "@/src/lib/liveCivicEvents"
import { useCivicPreferences } from "@/src/lib/CivicPreferencesContext"

export default function CivicMapScreen() {
  const { events: civicEvents } = useCivicEventFeed()
  const { preferences } = useCivicPreferences()
  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={["top"]}>
      <ScrollView contentContainerClassName="pb-8">
        <View className="bg-slate-950 px-5 pt-6 pb-8">
          <View className="flex-row items-center gap-2">
            <LocateFixed color="#FCA5A5" size={17} />
            <Text className="text-xs font-bold tracking-[2px] text-red-300 uppercase">
              {preferences.locationLabel === "Not set"
                ? "Civic map"
                : preferences.locationLabel}
            </Text>
          </View>
          <Text className="mt-3 text-4xl leading-[43px] font-bold text-white">
            Follow where public power is moving.
          </Text>
          <Text className="mt-3 text-base leading-7 text-slate-300">
            A place-first view of documented developments. Always verify a
            meeting against the official agenda before you travel.
          </Text>
        </View>
        <View className="gap-3 px-5 py-6">
          {civicEvents.map((event) => (
            <Link asChild href={`/alerts/${event.id}` as never} key={event.id}>
              <Pressable className="rounded-[26px] border border-slate-200 bg-white p-5">
                <View className="flex-row items-start gap-3">
                  <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-red-50">
                    <MapPin color="#D9151E" size={19} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold tracking-[1px] text-red-700 uppercase">
                      {event.location}
                    </Text>
                    <Text className="mt-2 text-xl leading-7 font-bold text-slate-950">
                      {event.title}
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-slate-600">
                      {event.summary}
                    </Text>
                    <View className="mt-4 flex-row items-center gap-2">
                      <Text className="font-bold text-red-700">View brief</Text>
                      <ArrowRight color="#B91C1C" size={16} />
                    </View>
                  </View>
                </View>
              </Pressable>
            </Link>
          ))}
          <Link asChild href="/topics/michigan-surveillance-stack">
            <Pressable className="rounded-[26px] bg-red-700 p-5">
              <Text className="text-xs font-bold tracking-[1.5px] text-red-100 uppercase">
                Interactive map
              </Text>
              <Text className="mt-2 text-2xl font-bold text-white">
                Explore the surveillance stack
              </Text>
              <Text className="mt-2 text-sm leading-6 text-red-50">
                Open reported ALPR and Flock locations from the sourced topic
                brief.
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
