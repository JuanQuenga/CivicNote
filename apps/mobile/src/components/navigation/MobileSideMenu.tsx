import { useCallback, useEffect, useRef, useState } from "react"
import * as Haptics from "expo-haptics"
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
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import {
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  Home,
  Radio,
} from "lucide-react-native"
import { topics } from "@/src/lib/topics"
import type { ReactNode } from "react"
import type { GestureResponderEvent } from "react-native"

export const MOBILE_OPEN_SIDE_MENU_EVENT = "mobile-side-menu:open"

const MENU_SNAP_VELOCITY = 850
const MENU_EDGE_WIDTH = 44
const MENU_CONTENT_RADIUS = 64
const MENU_CONTENT_EDGE_OVERLAP = 8
const MENU_HAPTIC_SNAP_POINT = 0.5
const MENU_PRESS_CANCEL_DISTANCE = 8

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

function SideMenuContent({
  drawerWidth,
  onExpandedChange,
}: {
  drawerWidth: number
  onExpandedChange: (expanded: boolean) => void
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const navigate = (href: string) => {
    onExpandedChange(false)
    setTimeout(() => {
      router.push(href as never)
    }, 180)
  }

  return (
    <View
      className="absolute bottom-0 left-0 top-0 bg-zinc-950"
      style={{
        width: drawerWidth,
        paddingTop: insets.top + 18,
        paddingBottom: Math.max(insets.bottom, 18),
      }}
    >
      <View className="px-5">
        <Text className="text-xs font-bold tracking-[2px] text-red-400 uppercase">
          Civic Research Hub
        </Text>
        <Text className="mt-3 text-3xl leading-8 font-bold text-white">
          Plain-English notes for issues that need attention.
        </Text>
      </View>

      <ScrollView
        className="mt-6 px-5"
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6"
      >
        <MenuItem icon={Home} label="Home" onPress={() => navigate("/")} />
        <MenuItem
          icon={ClipboardCheck}
          label="Take Action"
          meta="Useful next steps"
          onPress={() => navigate("/map")}
        />
        <MenuItem
          icon={Radio}
          label="Updates"
          meta="What changed recently"
          onPress={() => navigate("/briefs")}
        />
        <MenuItem
          icon={FileText}
          label="Sources"
          meta="Where the facts come from"
          onPress={() => navigate("/sources")}
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
    </View>
  )
}

export function MobileSideMenuShell({
  children,
  expanded,
  isEnabled = true,
  onExpandedChange,
}: {
  children: ReactNode
  expanded: boolean
  isEnabled?: boolean
  onExpandedChange: (expanded: boolean) => void
}) {
  const { width } = useWindowDimensions()
  const drawerWidth = Math.min(width * 0.76, 300)
  const drawerOffset = useRef(new Animated.Value(expanded ? drawerWidth : 0))
    .current
  const [isDrawerOffsetVisible, setIsDrawerOffsetVisible] = useState(expanded)
  const menuGestureActiveRef = useRef(false)
  const menuSnapHapticSideRef = useRef<"before" | "after" | null>(null)
  const contentTouchStartRef = useRef<{ x: number; y: number } | null>(null)

  const triggerMenuSnapHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  }, [])

  const maybeTriggerMenuSnapHaptic = useCallback(
    (offset: number) => {
      if (drawerWidth <= 0) return

      const nextSide =
        offset >= drawerWidth * MENU_HAPTIC_SNAP_POINT ? "after" : "before"
      const previousSide = menuSnapHapticSideRef.current

      if (!previousSide) {
        menuSnapHapticSideRef.current = nextSide
        return
      }

      if (previousSide !== nextSide) {
        menuSnapHapticSideRef.current = nextSide
        triggerMenuSnapHaptic()
      }
    },
    [drawerWidth, triggerMenuSnapHaptic]
  )

  const animateTo = useCallback(
    (toValue: 0 | 1) => {
      Animated.spring(drawerOffset, {
        toValue: toValue * drawerWidth,
        tension: 95,
        friction: 15,
        useNativeDriver: true,
      }).start()
    },
    [drawerOffset, drawerWidth]
  )

  useEffect(() => {
    if (!isEnabled) {
      drawerOffset.setValue(0)
      setIsDrawerOffsetVisible(false)
      return
    }

    animateTo(expanded ? 1 : 0)
  }, [animateTo, drawerOffset, expanded, isEnabled])

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      MOBILE_OPEN_SIDE_MENU_EVENT,
      () => {
        if (isEnabled) onExpandedChange(true)
      }
    )

    return () => {
      subscription.remove()
    }
  }, [isEnabled, onExpandedChange])

  useEffect(() => {
    const listenerId = drawerOffset.addListener(({ value }) => {
      setIsDrawerOffsetVisible(value > 1)
      maybeTriggerMenuSnapHaptic(value)
    })

    return () => {
      drawerOffset.removeListener(listenerId)
    }
  }, [drawerOffset, maybeTriggerMenuSnapHaptic])

  const handleContentTouchStartCapture = useCallback(
    (event: GestureResponderEvent) => {
      contentTouchStartRef.current = {
        x: event.nativeEvent.pageX,
        y: event.nativeEvent.pageY,
      }
      return false
    },
    []
  )

  const handleContentTouchMoveCapture = useCallback(
    (event: GestureResponderEvent) => {
      if (!isEnabled) return false

      const touchStart = contentTouchStartRef.current
      if (!touchStart) return false

      const deltaX = event.nativeEvent.pageX - touchStart.x
      const deltaY = event.nativeEvent.pageY - touchStart.y
      const isHorizontalMenuDrag =
        Math.abs(deltaX) > MENU_PRESS_CANCEL_DISTANCE &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.2

      if (!isHorizontalMenuDrag) return false
      if (expanded) return true

      return touchStart.x <= MENU_EDGE_WIDTH && deltaX > 0
    },
    [expanded, isEnabled]
  )

  const menuPanGesture = Gesture.Pan()
    .enabled(isEnabled)
    .runOnJS(true)
    .activeOffsetX([-14, 14])
    .failOffsetY([-20, 20])
    .onBegin(({ absoluteX }) => {
      menuGestureActiveRef.current = expanded || absoluteX <= MENU_EDGE_WIDTH
      if (menuGestureActiveRef.current) {
        drawerOffset.stopAnimation((value) => {
          menuSnapHapticSideRef.current =
            value >= drawerWidth * MENU_HAPTIC_SNAP_POINT ? "after" : "before"
        })
      }
    })
    .onUpdate(({ translationX }) => {
      if (!menuGestureActiveRef.current) return

      const startOffset = expanded ? drawerWidth : 0
      const nextOffset = Math.min(
        Math.max(startOffset + translationX, 0),
        drawerWidth
      )

      drawerOffset.setValue(nextOffset)
    })
    .onEnd(({ translationX, velocityX }) => {
      if (!menuGestureActiveRef.current) return
      menuGestureActiveRef.current = false

      const startOffset = expanded ? drawerWidth : 0
      const projectedOffset = startOffset + translationX + velocityX / 5
      const shouldExpand =
        velocityX > MENU_SNAP_VELOCITY ||
        (velocityX > -MENU_SNAP_VELOCITY && projectedOffset > drawerWidth / 2)

      animateTo(shouldExpand ? 1 : 0)
      onExpandedChange(shouldExpand)
    })
    .onFinalize(() => {
      if (!menuGestureActiveRef.current) return
      menuGestureActiveRef.current = false
    })

  const overlayOpacity = drawerOffset.interpolate({
    inputRange: [0, drawerWidth],
    outputRange: [0, 0.22],
    extrapolate: "clamp",
  })
  const contentEdgeOverlap = drawerOffset.interpolate({
    inputRange: [0, drawerWidth * 0.18, drawerWidth],
    outputRange: [0, -MENU_CONTENT_EDGE_OVERLAP, -MENU_CONTENT_EDGE_OVERLAP],
    extrapolate: "clamp",
  })
  const contentTranslateX = Animated.add(drawerOffset, contentEdgeOverlap)
  const shouldBlockContentPresses = expanded || isDrawerOffsetVisible
  const contentRadius = isDrawerOffsetVisible ? MENU_CONTENT_RADIUS : 0

  if (!isEnabled) {
    return <View className="flex-1 bg-[#f7f4ee]">{children}</View>
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <SideMenuContent
        drawerWidth={drawerWidth}
        onExpandedChange={onExpandedChange}
      />

      <GestureDetector gesture={menuPanGesture}>
        <Animated.View
          className="flex-1 bg-[#f7f4ee]"
          onMoveShouldSetResponderCapture={handleContentTouchMoveCapture}
          onStartShouldSetResponderCapture={handleContentTouchStartCapture}
          style={{
            borderTopLeftRadius: contentRadius,
            borderBottomLeftRadius: contentRadius,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            elevation: 18,
            overflow: "hidden",
            shadowColor: "#000000",
            shadowOffset: { width: -8, height: 0 },
            shadowOpacity: 0.28,
            shadowRadius: 24,
            transform: [{ translateX: contentTranslateX }],
          }}
        >
          {children}
          <Pressable
            accessibilityLabel="Close navigation menu"
            pointerEvents={shouldBlockContentPresses ? "auto" : "none"}
            style={styles.contentScrim}
            onPress={() => {
              if (expanded) onExpandedChange(false)
            }}
          >
            <Animated.View
              className="flex-1 bg-[#F5F5F7]"
              style={{ opacity: overlayOpacity }}
            />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  contentScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
})
