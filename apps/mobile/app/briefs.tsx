import { Link } from "expo-router"
import { Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { topics } from "@/src/lib/topics"
import { urgencyClasses } from "@/src/components/topics/MobileTopicComponents"

const urgencyRank = { high: 0, medium: 1, low: 2 } as const

export default function BriefsScreen() {
  const sortedTopics = [...topics].sort(
    (a, b) =>
      urgencyRank[a.statusBrief.urgency] - urgencyRank[b.statusBrief.urgency]
  )

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]">
      <ScrollView contentContainerClassName="pb-10">
        <View className="border-b border-zinc-200 bg-zinc-950 px-5 pt-6 pb-8">
          <Text className="text-xs font-bold tracking-[2px] text-red-400 uppercase">
            Updates
          </Text>
          <Text className="mt-4 text-5xl leading-[52px] font-bold text-white">
            What changed, and what to watch next.
          </Text>
          <Text className="mt-4 text-base leading-7 text-zinc-300">
            A quick scan of each issue: the latest movement, the next moment
            that matters, and who can still do something about it.
          </Text>
        </View>

        <View className="gap-4 px-5 py-6">
          {sortedTopics.map((topic) => (
            <Link href={`/topics/${topic.slug}`} key={topic.slug} asChild>
              <Pressable className="border border-zinc-200 bg-white p-5">
                <View className="flex-row flex-wrap items-center gap-3">
                  <Text className="text-xs font-bold tracking-[1.6px] text-red-700 uppercase">
                    {topic.region}
                  </Text>
                  <Text
                    className={`border px-3 py-1 text-[10px] font-bold tracking-[1.4px] uppercase ${
                      urgencyClasses[topic.statusBrief.urgency]
                    }`}
                  >
                    {topic.statusBrief.urgency} urgency
                  </Text>
                </View>
                <Text className="mt-4 text-2xl leading-8 font-bold text-zinc-950">
                  {topic.statusBrief.headline}
                </Text>
                <Text className="mt-3 text-sm leading-6 text-zinc-700">
                  {topic.statusBrief.summary}
                </Text>
                <View className="mt-5 gap-4 border-t border-zinc-200 pt-4">
                  <View>
                    <Text className="text-[10px] font-bold tracking-[1.4px] text-zinc-500 uppercase">
                      Latest Update
                    </Text>
                    <Text className="mt-1 text-sm leading-6 text-zinc-700">
                      {topic.statusBrief.latestDevelopment}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-[10px] font-bold tracking-[1.4px] text-zinc-500 uppercase">
                      Next Thing To Watch
                    </Text>
                    <Text className="mt-1 text-sm leading-6 text-zinc-700">
                      {topic.statusBrief.nextDecisionPoint}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-[10px] font-bold tracking-[1.4px] text-zinc-500 uppercase">
                      Who Can Do Something
                    </Text>
                    <Text className="mt-1 text-sm leading-6 text-zinc-700">
                      {topic.statusBrief.whoCanAct}
                    </Text>
                  </View>
                </View>
                <Text className="mt-4 text-[10px] font-bold tracking-[1.4px] text-zinc-500 uppercase">
                  Last checked {topic.statusBrief.lastChecked}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
