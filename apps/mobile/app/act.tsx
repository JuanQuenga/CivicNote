import { Link } from "expo-router"
import { ArrowRight, Clock3 } from "lucide-react-native"
import { Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { getServiceActions } from "@/src/lib/service"

export default function ActScreen() {
  const actions = getServiceActions().slice(0, 10)
  return (
    <SafeAreaView className="flex-1 bg-[#f7f4ee]" edges={["top"]}>
      <ScrollView contentContainerClassName="pb-8">
        <View className="px-5 pt-6 pb-7">
          <Text className="text-xs font-bold tracking-[2px] text-red-700 uppercase">
            Take action
          </Text>
          <Text className="mt-3 text-4xl leading-[43px] font-bold text-slate-950">
            Useful moves, while they can still matter.
          </Text>
          <Text className="mt-3 text-base leading-7 text-slate-600">
            Every action points to a decision-maker, an evidence-backed ask, and
            words you can adapt.
          </Text>
        </View>
        <View className="gap-3 px-5">
          {actions.map((action, index) => (
            <Link
              asChild
              href={`/topics/${action.slug}`}
              key={`${action.slug}-${action.title}`}
            >
              <Pressable className="rounded-[26px] border border-slate-200 bg-white p-5">
                <View className="flex-row items-center gap-2">
                  <Text className="font-bold text-red-700">
                    {(index + 1).toString().padStart(2, "0")}
                  </Text>
                  <View className="h-1 w-1 rounded-full bg-slate-300" />
                  <Text className="flex-1 text-xs font-bold tracking-[1px] text-slate-500 uppercase">
                    {action.topic}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Clock3 color="#64748B" size={14} />
                    <Text className="text-xs text-slate-500">
                      {action.difficulty}
                    </Text>
                  </View>
                </View>
                <Text className="mt-4 text-xl leading-7 font-bold text-slate-950">
                  {action.title}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-slate-600">
                  {action.description}
                </Text>
                <View className="mt-4 flex-row items-center gap-2">
                  <Text className="font-bold text-red-700">
                    Open action kit
                  </Text>
                  <ArrowRight color="#B91C1C" size={16} />
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
