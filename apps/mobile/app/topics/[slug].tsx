import { useLocalSearchParams } from "expo-router"
import { Linking, Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { getTopicBySlug } from "@/src/lib/topics"

const urgencyClasses = {
  low: "border-zinc-300 bg-zinc-100 text-zinc-800",
  medium: "border-amber-300 bg-amber-50 text-amber-900",
  high: "border-red-300 bg-red-50 text-red-900",
} as const

function SourceList({
  indexes,
  sources,
}: {
  indexes: Array<number>
  sources: Array<{
    title: string
    publisher: string
    year: number
    url: string
  }>
}) {
  return (
    <View className="mt-4 gap-2">
      {indexes.map((index) => {
        const source = sources[index]
        if (!source) return null

        return (
          <Pressable
            key={`${source.url}-${index}`}
            className="border-l-2 border-zinc-950 pl-3"
            onPress={() => {
              void Linking.openURL(source.url)
            }}
          >
            <Text className="text-xs font-bold text-zinc-950">
              {source.publisher}, {source.year}
            </Text>
            <Text className="mt-1 text-xs leading-5 text-zinc-600">
              {source.title}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default function TopicScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const topic = slug ? getTopicBySlug(slug) : undefined

  if (!topic) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f7f4ee] px-6">
        <Text className="text-center text-3xl font-bold text-zinc-950">
          Topic not found
        </Text>
        <Text className="mt-3 text-center text-base text-zinc-600">
          That research topic has not been added to the hub.
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={["bottom"]}>
      <ScrollView contentContainerClassName="pb-10">
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
        </View>

        <View className="bg-zinc-950 px-5 py-6">
          <View className="flex-row flex-wrap items-center gap-3">
            <Text className="text-xs font-bold tracking-[2px] text-zinc-400 uppercase">
              Current Status
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
          <Text className="mt-5 text-xs font-bold tracking-[1.4px] text-zinc-500 uppercase">
            Last checked {topic.statusBrief.lastChecked}
          </Text>
        </View>

        <View className="gap-4 px-5 py-6">
          {topic.stats.map((stat) => (
            <View
              key={stat.label}
              className="border border-zinc-200 bg-white p-5"
            >
              <Text className="text-4xl font-bold text-zinc-950">
                {stat.value}
              </Text>
              <Text className="mt-3 text-sm leading-6 text-zinc-700">
                {stat.label}
              </Text>
              <SourceList
                indexes={stat.sourceIndexes}
                sources={topic.sources}
              />
            </View>
          ))}
        </View>

        <View className="border-y border-zinc-200 bg-white px-5 py-6">
          <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
            Why it matters
          </Text>
          <Text className="mt-4 text-base leading-7 text-zinc-700">
            {topic.summary}
          </Text>
        </View>

        <View className="gap-4 px-5 py-6">
          <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
            Research Findings
          </Text>
          {topic.findings.map((finding) => (
            <View
              key={finding.title}
              className="border border-zinc-200 bg-white p-5"
            >
              <Text className="text-xl font-bold text-zinc-950">
                {finding.title}
              </Text>
              <Text className="mt-3 text-sm leading-6 text-zinc-700">
                {finding.body}
              </Text>
              <SourceList
                indexes={finding.sourceIndexes}
                sources={topic.sources}
              />
            </View>
          ))}
        </View>

        <View className="gap-4 border-y border-zinc-200 bg-white px-5 py-6">
          <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
            Public Action
          </Text>
          {topic.actions.map((action) => (
            <View
              key={action.title}
              className="border border-zinc-200 bg-[#f7f4ee] p-5"
            >
              <Text className="text-xl font-bold text-zinc-950">
                {action.title}
              </Text>
              <Text className="mt-3 text-sm leading-6 text-zinc-700">
                {action.description}
              </Text>
              <Text className="mt-4 text-xs font-bold tracking-[1.4px] text-red-700 uppercase">
                {action.audience} / {action.difficulty}
              </Text>
              {action.ctaUrl ? (
                <Pressable
                  className="mt-4 items-center border border-zinc-950 bg-zinc-950 px-4 py-3"
                  onPress={() => {
                    void Linking.openURL(action.ctaUrl!)
                  }}
                >
                  <Text className="text-xs font-bold tracking-[1.6px] text-white uppercase">
                    {action.ctaLabel}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
