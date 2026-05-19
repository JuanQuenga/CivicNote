import { useEffect, useRef } from "react"
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native"
import type { ReactNode } from "react"

export function MobileMapOverlay({
  children,
  isOpen,
  onClose,
}: {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
}) {
  const { height } = useWindowDimensions()
  const translateY = useRef(new Animated.Value(height)).current

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isOpen ? 0 : height,
      tension: 95,
      friction: 18,
      useNativeDriver: true,
    }).start()
  }, [height, isOpen, translateY])

  return (
    <View pointerEvents={isOpen ? "auto" : "none"} style={styles.overlay}>
      <Pressable className="flex-1 bg-black/35" onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          {
            height: Math.min(height * 0.88, 760),
            transform: [{ translateY }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: "flex-end",
  },
  sheet: {
    left: 0,
    right: 0,
    bottom: 0,
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "#F7F4EE",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
})
