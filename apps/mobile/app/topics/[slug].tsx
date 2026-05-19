import { Link, useLocalSearchParams } from "expo-router"
import { Linking, Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { getTopicBySlug, topics } from "@/src/lib/topics"
import { useSavedTopics } from "@/src/lib/useSavedTopics"
import {
  TopicCard,
  TopicModuleView,
  urgencyClasses,
} from "@/src/components/topics/MobileTopicComponents"

export default function TopicScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const topic = slug ? getTopicBySlug(slug) : undefined
  const { isSaved, toggleSaved } = useSavedTopics()

  if (!topic) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f7f4ee] px-6" edges={["top"]}>
        <Text className="text-center text-3xl font-bold text-zinc-950">
          Topic not found
        </Text>
        <Text className="mt-3 text-center text-base text-zinc-600">
          That issue is not in the app yet.
        </Text>
        <Link href="/topics" asChild>
          <Pressable className="mt-6 border border-zinc-950 bg-zinc-950 px-5 py-3">
            <Text className="text-xs font-bold tracking-[1.6px] text-white uppercase">
              Back to Topics
            </Text>
          </Pressable>
        </Link>
      </SafeAreaView>
    )
  }

  const renderedModules = [
    ...topic.modules,
    ...(topic.modules.some((module) => module.type === "actionList")
      ? []
      : [
          {
            type: "actionList" as const,
            eyebrow: "Public action",
            title: "Do the next useful thing",
            actions: topic.actions,
          },
        ]),
    ...(topic.modules.some((module) => module.type === "timeline")
      ? []
      : [
          {
            type: "timeline" as const,
            eyebrow: "Milestones",
            title: "What moved this topic",
            items: topic.timeline,
          },
        ]),
  ]

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={[]}>
      <ScrollView>
        <View className="border-b border-zinc-200 bg-white px-5 py-7">
          <Text className="text-xs font-bold tracking-[2px] text-red-700 uppercase">
            Topic {topic.topicNumber} / {topic.region} / Updated{" "}
            {topic.updatedAt}
          </Text>
          <Text className="mt-4 text-4xl leading-[42px] font-bold text-zinc-950">
            {topic.title}
          </Text>
          <Text className="mt-4 text-lg leading-7 text-zinc-700">
            {topic.tagline}
          </Text>
          <Pressable
            className={`mt-5 items-center border px-4 py-3 ${
              isSaved(topic.slug)
                ? "border-red-700 bg-red-700"
                : "border-zinc-950 bg-zinc-950"
            }`}
            onPress={() => toggleSaved(topic.slug)}
          >
            <Text className="text-xs font-bold tracking-[1.6px] text-white uppercase">
              {isSaved(topic.slug) ? "Following Topic" : "Follow Topic"}
            </Text>
          </Pressable>
        </View>

        <View className="bg-zinc-950 px-5 py-6">
          <View className="flex-row flex-wrap items-center gap-3">
            <Text className="text-xs font-bold tracking-[2px] text-zinc-400 uppercase">
              Right Now
            </Text>
            <Text
              className={`border px-3 py-1 text-[10px] font-bold tracking-[1.4px] uppercase ${
                urgencyClasses[topic.statusBrief.urgency]
              }`}
            >
              {topic.statusBrief.urgency} urgency
            </Text>
          </View>
          <Text className="mt-4 text-3xl leading-8 font-bold text-white">
            {topic.statusBrief.headline}
          </Text>
          <Text className="mt-4 text-sm leading-6 text-zinc-300">
            {topic.statusBrief.summary}
          </Text>
          <View className="mt-6 gap-4 border-t border-white/10 pt-5">
            <View>
              <Text className="text-xs font-bold tracking-[1.4px] text-zinc-500 uppercase">
                Latest Update
              </Text>
              <Text className="mt-2 text-sm leading-6 text-zinc-200">
                {topic.statusBrief.latestDevelopment}
              </Text>
            </View>
            <View>
              <Text className="text-xs font-bold tracking-[1.4px] text-zinc-500 uppercase">
                Next Thing To Watch
              </Text>
              <Text className="mt-2 text-sm leading-6 text-zinc-200">
                {topic.statusBrief.nextDecisionPoint}
              </Text>
            </View>
            <View>
              <Text className="text-xs font-bold tracking-[1.4px] text-zinc-500 uppercase">
                Who Can Do Something
              </Text>
              <Text className="mt-2 text-sm leading-6 text-zinc-200">
                {topic.statusBrief.whoCanAct}
              </Text>
            </View>
          </View>
          <Text className="mt-5 text-xs font-bold tracking-[1.4px] text-zinc-500 uppercase">
            Last checked {topic.statusBrief.lastChecked}
          </Text>
        </View>

        {topic.updates.length ? (
          <View className="gap-4 px-5 py-6">
            <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
              Updates
            </Text>
            {topic.updates.map((update) => (
              <Pressable
                key={update.url}
                className="border border-zinc-200 bg-white p-5"
                onPress={() => {
                  void Linking.openURL(update.url)
                }}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="flex-1 text-[10px] font-bold tracking-[1.4px] text-red-700 uppercase">
                    {update.tag}
                  </Text>
                  <Text className="text-[10px] font-bold tracking-[1.4px] text-zinc-500 uppercase">
                    {update.publishedAt}
                  </Text>
                </View>
                <Text className="mt-3 text-xl font-bold text-zinc-950">
                  {update.title}
                </Text>
                <Text className="mt-2 text-xs font-bold tracking-[1.2px] text-zinc-500 uppercase">
                  {update.publisher}
                </Text>
                <Text className="mt-3 text-sm leading-6 text-zinc-700">
                  {update.summary}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View className="gap-5 px-5 py-6">
          {renderedModules.map((module, index) => (
            <TopicModuleView
              index={index}
              key={`${module.type}-${module.title}`}
              module={module}
              topic={topic}
            />
          ))}
        </View>

        <View className="border-t border-zinc-200 bg-zinc-950 px-5 py-7">
          <Text className="text-xs font-bold tracking-[2px] text-zinc-400 uppercase">
            Sources
          </Text>
          <Text className="mt-2 text-3xl font-bold text-white">
            Read it yourself
          </Text>
          <View className="mt-5 gap-3">
            {topic.sources.map((source, index) => (
              <Pressable
                key={source.url}
                className="border border-white/10 bg-zinc-900 p-5"
                onPress={() => {
                  void Linking.openURL(source.url)
                }}
              >
                <Text className="text-sm font-bold text-white">
                  {source.title}
                </Text>
                <Text className="mt-2 text-xs font-semibold tracking-[1.2px] text-zinc-400 uppercase">
                  {source.publisher} / {source.year} / Source {index + 1}
                </Text>
                <Text className="mt-3 text-sm leading-6 text-zinc-300">
                  {source.note}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="px-5 py-7">
          <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
            Related Issues
          </Text>
          <View className="mt-3 gap-4">
            {topics
              .filter((item) => item.slug !== topic.slug)
              .slice(0, 2)
              .map((item) => (
                <TopicCard compact key={item.slug} topic={item} />
              ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
