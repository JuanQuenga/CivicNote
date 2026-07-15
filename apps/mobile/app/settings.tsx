import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { AlertPreferencesPanel } from "@/src/components/alerts/AlertPreferencesPanel"

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={["top"]}>
      <ScrollView contentContainerClassName="pb-8">
        <View className="px-5 pt-6 pb-7">
          <Text className="text-xs font-bold tracking-[2px] text-red-700 uppercase">
            Your CivicNote
          </Text>
          <Text className="mt-3 text-4xl leading-[43px] font-bold text-slate-950">
            The right signal, at the right moment.
          </Text>
          <Text className="mt-3 text-base leading-7 text-slate-600">
            Choose your issues, area, and pace. CivicNote will only alert you
            when a sourced development matches those choices.
          </Text>
        </View>
        <View className="px-5">
          <AlertPreferencesPanel />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
