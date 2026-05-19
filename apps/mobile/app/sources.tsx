import { Link } from "expo-router"
import { Linking, Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { topics } from "@/src/lib/topics"

export default function SourcesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={["top"]}>
      <ScrollView>
        <View className="border-b border-zinc-200 bg-zinc-950 px-5 pt-6 pb-8">
          <Text className="text-xs font-bold tracking-[2px] text-red-400 uppercase">
            Sources
          </Text>
          <Text className="mt-4 text-5xl leading-[52px] font-bold text-white">
            Where the facts come from.
          </Text>
          <Text className="mt-4 text-base leading-7 text-zinc-300">
            Open the reports, records, and news pieces behind each issue. No
            mystery box, no trust-us summary.
          </Text>
        </View>

        <View className="gap-6 px-5 py-6">
          {topics.map((topic) => (
            <View
              key={topic.slug}
              className="border border-zinc-200 bg-white p-5"
            >
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1">
                  <Text className="text-xs font-bold tracking-[1.6px] text-red-700 uppercase">
                    Topic {topic.topicNumber}
                  </Text>
                  <Text className="mt-2 text-2xl font-bold text-zinc-950">
                    {topic.shortTitle}
                  </Text>
                </View>
                <Link href={`/topics/${topic.slug}`} asChild>
                  <Pressable className="border border-zinc-300 px-3 py-2">
                    <Text className="text-[10px] font-bold tracking-[1.2px] text-zinc-700 uppercase">
                      Open
                    </Text>
                  </Pressable>
                </Link>
              </View>
              <View className="mt-4 gap-3">
                {topic.sources.map((source, index) => (
                  <Pressable
                    key={source.url}
                    className="border-l-2 border-zinc-950 bg-[#f7f4ee] px-4 py-3"
                    onPress={() => {
                      void Linking.openURL(source.url)
                    }}
                  >
                    <Text className="text-[10px] font-bold tracking-[1.4px] text-zinc-500 uppercase">
                      Source {index + 1} / {source.publisher} / {source.year}
                    </Text>
                    <Text className="mt-2 text-sm font-bold text-zinc-950">
                      {source.title}
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-zinc-700">
                      {source.note}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
