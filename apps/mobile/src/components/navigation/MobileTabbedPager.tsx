import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { MobilePageTabs } from './MobilePageTabs'
import { useMobilePageTabsRegistration } from './MobileTabsHeader'
import type { ReactNode } from 'react'

type MobileTabbedPagerTab<TValue extends string> = {
  value: TValue
  label: string
}

type MobileTabbedPagerProps<TValue extends string> = {
  tabs: Array<MobileTabbedPagerTab<TValue>>
  value: TValue
  onChange: (value: TValue) => void
  renderScene: (value: TValue) => ReactNode
  topContent?: ReactNode
}

export function MobileTabbedPager<TValue extends string>({
  tabs,
  value,
  onChange,
  renderScene,
  topContent,
}: MobileTabbedPagerProps<TValue>) {
  const { width } = useWindowDimensions()
  const pagerTranslateX = useRef(new Animated.Value(0)).current
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.value === value),
  )
  const activeIndexRef = useRef(activeIndex)
  const isAnimatingRef = useRef(false)
  const { pageTabsIndexRef, setPageTabs } = useMobilePageTabsRegistration()
  const animateToIndexRef = useRef<(index: number) => void>(() => {})
  const tabsSignature = tabs.map((tab) => `${tab.value}:${tab.label}`).join('|')

  const publishPageTabs = useCallback(
    (index: number) => {
      setPageTabs({
        routes: tabs.map((tab) => ({
          key: tab.value,
          name: tab.value,
          label: tab.label,
        })),
        index,
        navigateToIndex: animateToIndexRef.current,
      })
    },
    [setPageTabs, tabs, tabsSignature],
  )

  const animateToIndex = useCallback(
    (nextIndex: number) => {
      const clampedIndex = Math.min(Math.max(nextIndex, 0), tabs.length - 1)
      const nextTab = tabs[clampedIndex]
      if (!nextTab) return

      activeIndexRef.current = clampedIndex
      pageTabsIndexRef.current = clampedIndex
      publishPageTabs(clampedIndex)
      isAnimatingRef.current = true
      Animated.spring(pagerTranslateX, {
        toValue: -clampedIndex * width,
        tension: 120,
        friction: 19,
        useNativeDriver: true,
      }).start(() => {
        isAnimatingRef.current = false
      })

      if (nextTab.value !== value) {
        onChange(nextTab.value)
      }
    },
    [onChange, pagerTranslateX, publishPageTabs, tabs, value, width],
  )

  animateToIndexRef.current = animateToIndex

  useEffect(() => {
    activeIndexRef.current = activeIndex
    if (isAnimatingRef.current) return

    Animated.spring(pagerTranslateX, {
      toValue: -activeIndex * width,
      tension: 130,
      friction: 18,
      useNativeDriver: true,
    }).start()
  }, [activeIndex, pagerTranslateX, width])

  useFocusEffect(
    useCallback(() => {
      publishPageTabs(activeIndex)

      return () => {
        setPageTabs({
          routes: [],
          index: 0,
          navigateToIndex: () => {},
        })
      }
    }, [activeIndex, publishPageTabs, setPageTabs]),
  )

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX(activeIndex === 0 ? [-18, 999] : [-18, 18])
        .failOffsetY([-18, 18])
        .onBegin(() => {
          pagerTranslateX.stopAnimation()
        })
        .onUpdate(({ translationX }) => {
          const currentIndex = activeIndexRef.current
          const hasPrevious = currentIndex > 0
          const hasNext = currentIndex < tabs.length - 1
          const canMove =
            (translationX > 0 && hasPrevious) || (translationX < 0 && hasNext)
          if (!canMove && currentIndex === 0 && translationX > 0) return
          const resistance = canMove ? 1 : 0.24

          pagerTranslateX.setValue(
            -currentIndex * width + translationX * resistance,
          )
        })
        .onEnd(({ translationX, velocityX }) => {
          const currentIndex = activeIndexRef.current
          let nextIndex = currentIndex

          if (translationX < -72 || velocityX < -720) {
            nextIndex = Math.min(currentIndex + 1, tabs.length - 1)
          } else if (translationX > 72 || velocityX > 720) {
            nextIndex = Math.max(currentIndex - 1, 0)
          }

          animateToIndex(nextIndex)
        }),
    [activeIndex, animateToIndex, pagerTranslateX, tabs.length, width],
  )

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <MobilePageTabs
          tabs={tabs}
          value={value}
          onChange={(nextValue) => {
            const nextIndex = tabs.findIndex((tab) => tab.value === nextValue)
            animateToIndex(nextIndex)
          }}
          pagerTranslateX={pagerTranslateX}
        />
        {topContent}
        <View style={styles.viewport}>
          <Animated.View
            style={[
              styles.sceneRow,
              {
                width: width * tabs.length,
                transform: [{ translateX: pagerTranslateX }],
              },
            ]}
          >
            {tabs.map((tab) => (
              <View key={tab.value} style={[styles.scene, { width }]}>
                {renderScene(tab.value)}
              </View>
            ))}
          </Animated.View>
        </View>
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
  viewport: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  sceneRow: {
    flex: 1,
    flexDirection: 'row',
  },
  scene: {
    flex: 1,
    minHeight: 0,
  },
})
