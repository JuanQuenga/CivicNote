import { useRouter } from "expo-router"
import { Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { AlertPreferencesPanel } from "@/src/components/alerts/AlertPreferencesPanel"
import { useCivicPreferences } from "@/src/lib/CivicPreferencesContext"

export default function OnboardingScreen() {
  const router = useRouter()
  const { preferences, setOnboardingComplete } = useCivicPreferences()
  const canFinish = preferences.followedTopicSlugs.length > 0
  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="px-5 pt-6 pb-8">
        <Text className="text-xs font-bold tracking-[2px] text-red-700 uppercase">
          Make it yours
        </Text>
        <Text className="mt-3 text-4xl leading-[43px] font-bold text-slate-950">
          Follow public decisions before they become done deals.
        </Text>
        <Text className="mt-3 mb-6 text-base leading-7 text-slate-600">
          Start with one issue. Add your general area for nearby hearings and
          choose how often CivicNote may interrupt you.
        </Text>
        <AlertPreferencesPanel compact />
        <Pressable
          accessibilityRole="button"
          className={`mt-7 items-center rounded-full px-5 py-4 ${
            canFinish ? "bg-red-700" : "bg-slate-300"
          }`}
          disabled={!canFinish}
          onPress={() => {
            setOnboardingComplete(true)
            router.replace("/")
          }}
        >
          <Text className="text-base font-bold text-white">
            Start following {preferences.followedTopicSlugs.length || ""}{" "}
            {preferences.followedTopicSlugs.length === 1 ? "issue" : "issues"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
