import { Link } from "expo-router"
import { Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { getAllStats, topics } from "@/src/lib/topics"
import { getServiceActions, getServiceUpdates } from "@/src/lib/service"
import { useSavedTopics } from "@/src/lib/useSavedTopics"
import {
  TopicCard,
  urgencyClasses,
} from "@/src/components/topics/MobileTopicComponents"

export default function HomeScreen() {
  const { savedSlugs, isSaved, toggleSaved } = useSavedTopics()
  const urgentTopics = topics.filter(
    (topic) => topic.statusBrief.urgency === "high"
  )
  const stats = getAllStats().slice(0, 3)
  const latestUpdates = getServiceUpdates().slice(0, 3)
  const actionQueue = getServiceActions().slice(0, 2)
  const savedTopics = topics.filter((topic) => savedSlugs.includes(topic.slug))

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={["top"]}>
      <ScrollView>
        <View className="border-b border-zinc-200 bg-white px-5 pt-6 pb-8">
          <Text className="text-xs font-bold tracking-[2px] text-red-700 uppercase">
            CivicNote
          </Text>
          <Text className="mt-4 text-5xl leading-[52px] font-bold text-zinc-950">
            A clearer way to follow messy public issues.
          </Text>
          <Text className="mt-4 text-base leading-7 text-zinc-700">
            See what changed, why it matters, and what a regular person can do
            next without digging through a pile of tabs.
          </Text>
        </View>

        <View className="gap-4 px-5 py-6">
          <View className="border border-zinc-200 bg-zinc-950 p-5">
            <Text className="text-xs font-bold tracking-[2px] text-red-400 uppercase">
              Today
            </Text>
            <Text className="mt-2 text-2xl font-bold text-white">
              {savedTopics.length
                ? `${savedTopics.length} watched issue${
                    savedTopics.length === 1 ? "" : "s"
                  }`
                : "Build your watchlist"}
            </Text>
            <Text className="mt-3 text-sm leading-6 text-zinc-300">
              Follow topics to keep urgent updates, action scripts, and source
              links close when you are preparing for a call, email, or meeting.
            </Text>
            {savedTopics.length ? (
              <View className="mt-4 gap-3">
                {savedTopics.slice(0, 3).map((topic) => (
                  <Link href={`/topics/${topic.slug}`} key={topic.slug} asChild>
                    <Pressable className="border border-white/10 bg-zinc-900 p-4">
                      <Text className="text-sm font-bold text-white">
                        {topic.shortTitle}
                      </Text>
                      <Text className="mt-2 text-xs leading-5 text-zinc-400">
                        {topic.statusBrief.nextDecisionPoint}
                      </Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            ) : null}
          </View>

          <View className="flex-row items-end justify-between gap-4">
            <View>
              <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
                Start Here
              </Text>
              <Text className="mt-1 text-2xl font-bold text-zinc-950">
                Needs attention now
              </Text>
            </View>
            <Link href="/briefs" asChild>
              <Pressable className="border border-zinc-950 px-3 py-2">
                <Text className="text-[10px] font-bold tracking-[1.4px] text-zinc-950 uppercase">
                  Status
                </Text>
              </Pressable>
            </Link>
          </View>
          {(urgentTopics.length ? urgentTopics : topics.slice(0, 2)).map(
            (topic) => (
              <View key={topic.slug}>
                <TopicCard compact topic={topic} />
                <Pressable
                  className={`border-x border-b px-4 py-3 ${
                    isSaved(topic.slug)
                      ? "border-red-300 bg-red-50"
                      : "border-zinc-200 bg-white"
                  }`}
                  onPress={() => toggleSaved(topic.slug)}
                >
                  <Text
                    className={`text-center text-[10px] font-bold tracking-[1.4px] uppercase ${
                      isSaved(topic.slug) ? "text-red-900" : "text-zinc-700"
                    }`}
                  >
                    {isSaved(topic.slug) ? "Following" : "Follow topic"}
                  </Text>
                </Pressable>
              </View>
            )
          )}
        </View>

        <View className="border-y border-zinc-200 bg-white px-5 py-6">
          <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
            Signal Stats
          </Text>
          <View className="mt-3 gap-3">
            {stats.map((stat) => (
              <Link
                href={`/topics/${stat.slug}`}
                key={`${stat.slug}-${stat.label}`}
                asChild
              >
                <Pressable className="border border-zinc-200 bg-[#f7f4ee] p-4">
                  <Text className="text-3xl font-bold text-zinc-950">
                    {stat.value}
                  </Text>
                  <Text className="mt-2 text-sm leading-5 text-zinc-700">
                    {stat.label}
                  </Text>
                  <Text className="mt-3 text-[10px] font-bold tracking-[1.5px] text-zinc-500 uppercase">
                    {stat.topic}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        <View className="px-5 py-6">
          <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
            What Changed
          </Text>
          <View className="mt-3 gap-3">
            {latestUpdates.map((update) => (
              <Link
                href={`/topics/${update.slug}`}
                key={`${update.slug}-${update.url}`}
                asChild
              >
                <Pressable className="border border-zinc-200 bg-white p-5">
                  <View className="flex-row items-start justify-between gap-3">
                    <Text className="flex-1 text-[10px] font-bold tracking-[1.4px] text-red-700 uppercase">
                      {update.topic} / {update.tag}
                    </Text>
                    <Text className="text-[10px] font-bold tracking-[1.4px] text-zinc-500 uppercase">
                      {update.publishedAt}
                    </Text>
                  </View>
                  <Text className="mt-3 text-xl font-bold text-zinc-950">
                    {update.title}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-zinc-700">
                    {update.summary}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        <View className="border-y border-zinc-200 bg-white px-5 py-6">
          <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
            Action Queue
          </Text>
          <View className="mt-3 gap-3">
            {actionQueue.map((action) => (
              <Link
                href={`/topics/${action.slug}`}
                key={`${action.slug}-${action.title}`}
                asChild
              >
                <Pressable className="border border-zinc-200 bg-[#f7f4ee] p-4">
                  <Text className="text-[10px] font-bold tracking-[1.4px] text-red-700 uppercase">
                    {action.topic} / {action.difficulty}
                  </Text>
                  <Text className="mt-2 text-xl font-bold text-zinc-950">
                    {action.title}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-zinc-700">
                    {action.description}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        <View className="px-5">
          <View className="flex-row items-center justify-between gap-4">
            <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
              More Issues
            </Text>
            <Text
              className={`border px-3 py-1 text-[10px] font-bold tracking-[1.4px] uppercase ${
                urgencyClasses.high
              }`}
            >
              {topics.length} topics
            </Text>
          </View>
          <View className="mt-3 gap-4">
            {topics.slice(0, 3).map((topic) => (
              <TopicCard compact key={topic.slug} topic={topic} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
