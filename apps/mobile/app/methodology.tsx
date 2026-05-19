import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { methodologyPrinciples } from "@/src/lib/service"

export default function MethodologyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={["top"]}>
      <ScrollView>
        <View className="border-b border-zinc-200 bg-white px-5 pt-6 pb-8">
          <Text className="text-xs font-bold tracking-[2px] text-red-700 uppercase">
            Methodology
          </Text>
          <Text className="mt-4 text-5xl leading-[52px] font-bold text-zinc-950">
            How to trust the work.
          </Text>
          <Text className="mt-4 text-base leading-7 text-zinc-700">
            Civic work needs visible sourcing, clear claim status, and useful
            next steps without overstating what the record proves.
          </Text>
        </View>

        <View className="gap-4 px-5 py-6">
          {methodologyPrinciples.map((principle) => (
            <View
              key={principle.title}
              className="border border-zinc-200 bg-white p-5"
            >
              <Text className="text-2xl font-bold text-zinc-950">
                {principle.title}
              </Text>
              <Text className="mt-3 text-sm leading-6 text-zinc-700">
                {principle.body}
              </Text>
            </View>
          ))}
        </View>

        <View className="border-y border-zinc-200 bg-zinc-950 px-5 py-6">
          {["documented", "contested", "unsupported", "watch"].map(
            (status) => (
              <View key={status} className="border-b border-white/10 py-4">
                <Text className="text-xs font-bold tracking-[1.6px] text-red-400 uppercase">
                  {status}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-zinc-300">
                  A visible label for how strong or unsettled a claim is.
                </Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
