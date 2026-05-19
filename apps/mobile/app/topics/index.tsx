import { Link } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { topics } from "@/src/lib/topics"
import { useSavedTopics } from "@/src/lib/useSavedTopics"
import {
  TopicCard,
  urgencyClasses,
} from "@/src/components/topics/MobileTopicComponents"

const themeLabels = {
  ethics: "Ethics",
  surveillance: "Surveillance",
  infrastructure: "Infrastructure",
  future: "Public health and elections",
} as const

type ThemeFilter = "all" | keyof typeof themeLabels

export default function TopicsIndexScreen() {
  const [query, setQuery] = useState("")
  const [theme, setTheme] = useState<ThemeFilter>("all")
  const { isSaved, toggleSaved } = useSavedTopics()

  const filteredTopics = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return topics.filter((topic) => {
      const matchesTheme = theme === "all" || topic.theme === theme
      const haystack = [
        topic.title,
        topic.shortTitle,
        topic.region,
        topic.status,
        topic.summary,
        topic.statusBrief.headline,
        ...topic.modules.map((module) => module.title),
      ]
        .join(" ")
        .toLowerCase()

      return (
        matchesTheme && (!normalizedQuery || haystack.includes(normalizedQuery))
      )
    })
  }, [query, theme])

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={["top"]}>
      <ScrollView>
        <View className="border-b border-zinc-200 bg-white px-5 pt-6 pb-8">
          <Text className="text-xs font-bold tracking-[2px] text-red-700 uppercase">
            Topics
          </Text>
          <Text className="mt-4 text-5xl leading-[52px] font-bold text-zinc-950">
            Every issue in one place.
          </Text>
          <Text className="mt-4 text-base leading-7 text-zinc-700">
            Search by issue, place, or keyword. Each result opens a plain
            breakdown with updates, sources, and next steps.
          </Text>
        </View>

        <View className="border-b border-zinc-200 bg-white px-5 py-5">
          <Text className="text-xs font-bold tracking-[1.6px] text-zinc-500 uppercase">
            Search Issues
          </Text>
          <TextInput
            autoCapitalize="none"
            className="mt-3 border border-zinc-300 bg-[#f7f4ee] px-4 py-3 text-base text-zinc-950"
            onChangeText={setQuery}
            placeholder="Issue, place, keyword"
            placeholderTextColor="#71717A"
            value={query}
          />
          <ScrollView
            className="mt-4"
            contentContainerClassName="gap-2"
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {(["all", ...Object.keys(themeLabels)] as Array<ThemeFilter>).map(
              (item) => (
                <Pressable
                  className={`border px-4 py-2 ${
                    theme === item
                      ? "border-zinc-950 bg-zinc-950"
                      : "border-zinc-300 bg-white"
                  }`}
                  key={item}
                  onPress={() => setTheme(item)}
                >
                  <Text
                    className={`text-xs font-bold tracking-[1.2px] uppercase ${
                      theme === item ? "text-white" : "text-zinc-700"
                    }`}
                  >
                    {item === "all" ? "All" : themeLabels[item]}
                  </Text>
                </Pressable>
              )
            )}
          </ScrollView>
        </View>

        <View className="px-5 py-6">
          <View className="flex-row items-center justify-between gap-4">
            <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
              Showing {filteredTopics.length} of {topics.length}
            </Text>
            <Link href="/sources" asChild>
              <Pressable className="border border-zinc-300 px-3 py-2">
                <Text className="text-[10px] font-bold tracking-[1.2px] text-zinc-700 uppercase">
                  Sources
                </Text>
              </Pressable>
            </Link>
          </View>
          <View className="mt-3 gap-4">
            {filteredTopics.map((topic) => (
              <View key={topic.slug}>
                <TopicCard topic={topic} />
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
            ))}
          </View>
        </View>

        <View className="border-t border-zinc-200 bg-white px-5 py-6">
          <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
            What Each Issue Includes
          </Text>
          <View className="mt-3 gap-3">
            {topics.map((topic) => (
              <Link href={`/topics/${topic.slug}`} key={topic.slug} asChild>
                <Pressable className="border border-zinc-200 bg-[#f7f4ee] p-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="flex-1 text-sm font-bold text-zinc-950">
                      {topic.shortTitle}
                    </Text>
                    <Text
                      className={`border px-2 py-1 text-[10px] font-bold tracking-[1px] uppercase ${
                        urgencyClasses[topic.statusBrief.urgency]
                      }`}
                    >
                      {topic.statusBrief.urgency}
                    </Text>
                  </View>
                  <Text className="mt-2 text-xs leading-5 text-zinc-600">
                    {topic.modules.map((module) => module.eyebrow).join(" / ")}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
