import { useEffect, useRef, useState } from "react"
import {
  Animated,
  DeviceEventEmitter,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  Home,
  Map,
  Radio,
  X,
} from "lucide-react-native"
import { topics } from "@/src/lib/topics"

export const MOBILE_OPEN_SIDE_MENU_EVENT = "mobile-side-menu:open"

function MenuItem({
  icon: Icon,
  label,
  meta,
  onPress,
}: {
  icon: React.ComponentType<{
    color: string
    size: number
    strokeWidth?: number
  }>
  label: string
  meta?: string
  onPress: () => void
}) {
  return (
    <Pressable
      className="flex-row items-center gap-4 border-b border-white/10 px-1 py-4"
      onPress={onPress}
    >
      <View className="h-9 w-9 items-center justify-center border border-white/15 bg-white/5">
        <Icon color="#FAFAFA" size={19} strokeWidth={2.2} />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-white">{label}</Text>
        {meta ? (
          <Text className="mt-1 text-xs font-semibold tracking-[1px] text-zinc-500 uppercase">
            {meta}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}

export function MobileSideMenu() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const menuWidth = Math.min(width * 0.86, 380)
  const translateX = useRef(new Animated.Value(-menuWidth)).current
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const open = DeviceEventEmitter.addListener(
      MOBILE_OPEN_SIDE_MENU_EVENT,
      () => {
        setIsOpen(true)
      }
    )

    return () => open.remove()
  }, [])

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isOpen ? 0 : -menuWidth,
      tension: 90,
      friction: 16,
      useNativeDriver: true,
    }).start()
  }, [isOpen, menuWidth, translateX])

  const close = () => setIsOpen(false)
  const navigate = (href: string) => {
    close()
    router.push(href as never)
  }

  return (
    <View pointerEvents={isOpen ? "auto" : "none"} style={styles.overlay}>
      <Pressable className="flex-1 bg-black/45" onPress={close} />
      <Animated.View
        style={[
          styles.menu,
          {
            width: menuWidth,
            paddingTop: insets.top + 18,
            paddingBottom: insets.bottom + 18,
            transform: [{ translateX }],
          },
        ]}
      >
        <View className="flex-row items-start justify-between gap-4 px-5">
          <View className="flex-1">
            <Text className="text-xs font-bold tracking-[2px] text-red-400 uppercase">
              Civic Research Hub
            </Text>
            <Text className="mt-3 text-3xl leading-8 font-bold text-white">
              Research built for receipts.
            </Text>
          </View>
          <Pressable
            className="h-10 w-10 items-center justify-center border border-white/15"
            onPress={close}
          >
            <X color="#FAFAFA" size={20} />
          </Pressable>
        </View>

        <ScrollView className="mt-6 px-5" contentContainerClassName="pb-6">
          <MenuItem icon={Home} label="Home" onPress={() => navigate("/")} />
          <MenuItem
            icon={Map}
            label="Research Map"
            meta="Regional topic overview"
            onPress={() => {
              close()
              DeviceEventEmitter.emit("research-map:open")
            }}
          />
          <MenuItem
            icon={Radio}
            label="Status Briefs"
            meta="Latest developments"
            onPress={() => {
              close()
              DeviceEventEmitter.emit("research-map:open", { mode: "status" })
            }}
          />
          <MenuItem
            icon={FileText}
            label="Source Model"
            meta="Claims linked to evidence"
            onPress={() => {
              close()
              DeviceEventEmitter.emit("research-map:open", { mode: "sources" })
            }}
          />

          <Text className="mt-7 text-xs font-bold tracking-[2px] text-zinc-500 uppercase">
            Topics
          </Text>
          <View className="mt-2">
            {topics.map((topic) => (
              <MenuItem
                icon={BookOpen}
                key={topic.slug}
                label={topic.shortTitle}
                meta={`${topic.region} / ${topic.statusBrief.urgency} urgency`}
                onPress={() => navigate(`/topics/${topic.slug}`)}
              />
            ))}
          </View>

          <MenuItem
            icon={ArrowUpRight}
            label="Open Web Hub"
            meta="localhost web app"
            onPress={() => {
              void Linking.openURL("http://localhost:3000")
            }}
          />
        </ScrollView>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    flexDirection: "row",
  },
  menu: {
    ...StyleSheet.absoluteFillObject,
    right: undefined,
    backgroundColor: "#09090B",
  },
})
