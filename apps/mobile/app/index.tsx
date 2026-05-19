import { Link } from "expo-router"
import { Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { getAllStats, topics } from "@/src/lib/topics"

const themeClasses = {
  ethics: "border-red-200 bg-red-50",
  surveillance: "border-zinc-300 bg-zinc-900",
  infrastructure: "border-emerald-200 bg-emerald-50",
  future: "border-amber-200 bg-amber-50",
} as const

const themeTextClasses = {
  ethics: "text-red-950",
  surveillance: "text-white",
  infrastructure: "text-emerald-950",
  future: "text-amber-950",
} as const

export default function HomeScreen() {
  const stats = getAllStats().slice(0, 4)

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]">
      <ScrollView contentContainerClassName="pb-10">
        <View className="border-b border-zinc-200 bg-white px-5 pt-6 pb-8">
          <Text className="text-xs font-bold tracking-[2px] text-red-700 uppercase">
            Research-backed topic organizing
          </Text>
          <Text className="mt-4 text-5xl leading-[52px] font-bold text-zinc-950">
            Civic fights that need receipts.
          </Text>
          <Text className="mt-4 text-base leading-7 text-zinc-700">
            Browse structured research on public decisions, evidence, status
            updates, and actions you can take.
          </Text>
        </View>

        <View className="px-5 py-6">
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
                <Pressable className="border border-zinc-200 bg-white p-4">
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

        <View className="px-5">
          <Text className="text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
            Active Topics
          </Text>
          <View className="mt-3 gap-4">
            {topics.map((topic) => (
              <Link href={`/topics/${topic.slug}`} key={topic.slug} asChild>
                <Pressable
                  className={`border p-5 ${themeClasses[topic.theme]}`}
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <Text
                      className={`text-xs font-bold tracking-[1.8px] uppercase ${
                        themeTextClasses[topic.theme]
                      }`}
                    >
                      Topic {topic.topicNumber}
                    </Text>
                    <Text
                      className={`text-xs font-bold tracking-[1.4px] uppercase ${
                        themeTextClasses[topic.theme]
                      }`}
                    >
                      {topic.region}
                    </Text>
                  </View>
                  <Text
                    className={`mt-8 text-3xl leading-8 font-bold ${
                      themeTextClasses[topic.theme]
                    }`}
                  >
                    {topic.title}
                  </Text>
                  <Text
                    className={`mt-4 text-sm font-semibold tracking-[1.4px] uppercase ${
                      themeTextClasses[topic.theme]
                    }`}
                  >
                    {topic.status}
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
