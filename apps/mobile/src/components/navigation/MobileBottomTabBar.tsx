import { Pressable, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BookOpen, ClipboardCheck, Home, Radio } from "lucide-react-native"
import { usePathname, useRouter } from "expo-router"

const ACTIVE_COLOR = "#18181B"
const INACTIVE_COLOR = "#71717A"

function NavButton({
  active,
  icon: Icon,
  label,
  onPress,
}: {
  active?: boolean
  icon: React.ComponentType<{
    color: string
    size: number
    strokeWidth?: number
  }>
  label: string
  onPress: () => void
}) {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR

  return (
    <Pressable
      className="flex-1 items-center justify-center gap-1"
      onPress={onPress}
    >
      <Icon color={color} size={22} strokeWidth={2.2} />
      <Text
        className={`text-[10px] font-bold tracking-[0.8px] uppercase ${
          active ? "text-zinc-950" : "text-zinc-500"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export function MobileBottomTabBar() {
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const isTopic = pathname.startsWith("/topics")

  return (
    <View
      style={{ height: 58 + insets.bottom, paddingBottom: insets.bottom }}
      className="flex-row border-t border-zinc-200 bg-white"
    >
      <NavButton
        active={pathname === "/"}
        icon={Home}
        label="Home"
        onPress={() => router.replace("/")}
      />
      <NavButton
        active={isTopic}
        icon={BookOpen}
        label="Topics"
        onPress={() => router.replace("/topics")}
      />
      <NavButton
        active={pathname === "/map"}
        icon={ClipboardCheck}
        label="Act"
        onPress={() => router.replace("/map")}
      />
      <NavButton
        active={pathname === "/briefs"}
        icon={Radio}
        label="Status"
        onPress={() => router.replace("/briefs")}
      />
    </View>
  )
}
