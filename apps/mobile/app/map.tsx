import { Link } from "expo-router"
import { Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { topics } from "@/src/lib/topics"
import { urgencyClasses } from "@/src/components/topics/MobileTopicComponents"

const urgencyRank = { high: 0, medium: 1, low: 2 } as const

export default function ActionScreen() {
  const actions = topics
    .flatMap((topic) =>
      topic.actions.map((action) => ({
        ...action,
        region: topic.region,
        slug: topic.slug,
        topic: topic.shortTitle,
      }))
    )
    .sort((a, b) => urgencyRank[a.urgency] - urgencyRank[b.urgency])

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]">
      <ScrollView contentContainerClassName="pb-10">
        <View className="border-b border-zinc-200 bg-white px-5 pt-6 pb-8">
          <Text className="text-xs font-bold tracking-[2px] text-red-700 uppercase">
            Take Action
          </Text>
          <Text className="mt-4 text-5xl leading-[52px] font-bold text-zinc-950">
            Small steps that actually help.
          </Text>
          <Text className="mt-4 text-base leading-7 text-zinc-700">
            Pick an issue, see the next useful move, and use plain language you
            can send or say today.
          </Text>
        </View>

        <View className="gap-4 px-5 py-6">
          <View>
            <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
              Start Here
            </Text>
            <Text className="mt-1 text-2xl font-bold text-zinc-950">
              Best next moves
            </Text>
          </View>

          {actions.slice(0, 8).map((action, index) => (
            <Link
              href={`/topics/${action.slug}`}
              key={`${action.slug}-${action.title}`}
              asChild
            >
              <Pressable className="border border-zinc-200 bg-white p-5">
                <View className="flex-row flex-wrap items-center gap-3">
                  <Text className="text-sm font-bold text-red-700">
                    {(index + 1).toString().padStart(2, "0")}
                  </Text>
                  <Text
                    className={`border px-3 py-1 text-[10px] font-bold tracking-[1.4px] uppercase ${
                      urgencyClasses[action.urgency]
                    }`}
                  >
                    {action.urgency}
                  </Text>
                  <Text className="text-[10px] font-bold tracking-[1.4px] text-zinc-500 uppercase">
                    {action.topic} / {action.difficulty}
                  </Text>
                </View>
                <Text className="mt-4 text-2xl font-bold text-zinc-950">
                  {action.title}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-zinc-700">
                  {action.description}
                </Text>
                <Text className="mt-4 border-l-2 border-zinc-950 bg-[#f7f4ee] px-4 py-3 text-sm leading-6 text-zinc-700">
                  {action.script}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>

        <View className="border-t border-zinc-200 bg-white px-5 py-6">
          <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
            By Issue
          </Text>
          <View className="mt-3 gap-3">
            {topics.map((topic) => (
              <Link href={`/topics/${topic.slug}`} key={topic.slug} asChild>
                <Pressable className="border border-zinc-200 bg-[#f7f4ee] p-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-zinc-950">
                        {topic.shortTitle}
                      </Text>
                      <Text className="mt-2 text-sm leading-6 text-zinc-700">
                        {topic.actions[0]?.title ?? "Open the issue brief"}
                      </Text>
                    </View>
                    <Text
                      className={`border px-2 py-1 text-[10px] font-bold tracking-[1px] uppercase ${
                        urgencyClasses[topic.statusBrief.urgency]
                      }`}
                    >
                      {topic.statusBrief.urgency}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
