import { useEffect, useRef } from 'react'
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import type { ReactNode } from 'react'

export function MobileMapOverlay({
  children,
  isOpen,
}: {
  children: ReactNode
  isOpen: boolean
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
    <Pressable
      pointerEvents={isOpen ? 'box-none' : 'none'}
      style={styles.overlay}
    >
      <Animated.View
        style={[
          styles.sheet,
          {
            bottom: 0,
            height,
            transform: [{ translateY }],
          },
        ]}
      >
        <Pressable style={styles.sheetSurface} onPress={() => {}}>
          <View style={styles.sheetContent}>{children}</View>
        </Pressable>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: 'flex-end',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  sheetSurface: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  sheetContent: {
    flex: 1,
  },
})
