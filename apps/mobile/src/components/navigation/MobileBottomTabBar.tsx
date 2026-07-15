import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect"
import * as Haptics from "expo-haptics"
import { usePathname, useRouter } from "expo-router"
import {
  BookOpen,
  ClipboardCheck,
  Home,
  Map,
  Settings,
} from "lucide-react-native"
import { Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { ComponentType } from "react"

type TabDefinition = {
  href: "/" | "/topics" | "/act" | "/map" | "/settings"
  label: string
  icon: ComponentType<{
    color: string
    fill?: string
    size: number
    strokeWidth?: number
  }>
  matches: (pathname: string) => boolean
}

const tabs: Array<TabDefinition> = [
  {
    href: "/",
    label: "Today",
    icon: Home,
    matches: (pathname) => pathname === "/",
  },
  {
    href: "/topics",
    label: "Topics",
    icon: BookOpen,
    matches: (pathname) => pathname === "/topics",
  },
  {
    href: "/act",
    label: "Act",
    icon: ClipboardCheck,
    matches: (pathname) => pathname === "/act",
  },
  {
    href: "/map",
    label: "Map",
    icon: Map,
    matches: (pathname) => pathname === "/map",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    matches: (pathname) => pathname === "/settings",
  },
]

const DETAIL_PATH = /^\/(topics|alerts)\/.+/

function NavButton({
  tab,
  active,
  onPress,
}: {
  tab: TabDefinition
  active: boolean
  onPress: () => void
}) {
  const Icon = tab.icon
  const color = active ? "#D9151E" : "#64748B"
  return (
    <Pressable
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
    >
      <View style={[styles.iconWell, active && styles.iconWellActive]}>
        <Icon
          color={color}
          fill={active && tab.label !== "Act" ? color : "transparent"}
          size={21}
          strokeWidth={active ? 2.5 : 2.1}
        />
      </View>
      <Text style={[styles.label, active && styles.labelActive]}>
        {tab.label}
      </Text>
    </Pressable>
  )
}

export function MobileBottomTabBar() {
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const useGlass =
    Platform.OS === "ios" &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable()

  if (DETAIL_PATH.test(pathname) || pathname === "/onboarding") return null

  const content = (
    <View style={styles.row}>
      {tabs.map((tab) => (
        <NavButton
          active={tab.matches(pathname)}
          key={tab.href}
          onPress={() => {
            void Haptics.selectionAsync()
            router.replace(tab.href as never)
          }}
          tab={tab}
        />
      ))}
    </View>
  )

  return (
    <View
      pointerEvents="box-none"
      style={[styles.safeArea, { height: 76 + insets.bottom }]}
    >
      <View pointerEvents="none" style={styles.scrim} />
      {useGlass ? (
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          style={styles.capsule}
          tintColor="rgba(255,255,255,0.16)"
        >
          {content}
        </GlassView>
      ) : (
        <View style={[styles.capsule, styles.legacyCapsule]}>{content}</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 6,
    backgroundColor: "transparent",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(247,244,238,0.92)",
  },
  capsule: {
    borderRadius: 34,
    borderCurve: "continuous",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(100,116,139,0.28)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 10,
  },
  legacyCapsule: {
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  row: {
    height: 62,
    flexDirection: "row",
    alignItems: "stretch",
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    borderRadius: 28,
  },
  pressed: { opacity: 0.62, transform: [{ scale: 0.96 }] },
  iconWell: {
    minWidth: 42,
    height: 32,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWellActive: { backgroundColor: "rgba(217,21,30,0.10)" },
  label: {
    color: "#64748B",
    fontFamily: "Outfit_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.25,
  },
  labelActive: { color: "#B91C1C" },
})
