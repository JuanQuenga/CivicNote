import { Link } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={["top"]}>
      <View className="flex-1 justify-center px-6">
        <Text className="text-4xl font-bold text-zinc-950">Not found</Text>
        <Text className="mt-3 text-base leading-7 text-zinc-600">
          This mobile screen is not part of Civic Research Hub.
        </Text>
        <Link href="/" asChild>
          <Pressable className="mt-8 border border-zinc-950 bg-zinc-950 px-5 py-4">
            <Text className="text-center text-xs font-bold tracking-[1.6px] text-white uppercase">
              Back to Topics
            </Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  )
}
