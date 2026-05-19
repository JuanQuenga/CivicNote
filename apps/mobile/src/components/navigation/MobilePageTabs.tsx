import { useCallback, useEffect, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useMobilePageTabsRegistration } from './MobileTabsHeader'

type MobilePageTab<TValue extends string> = {
  value: TValue
  label: string
}

type MobilePageTabsProps<TValue extends string> = {
  tabs: Array<MobilePageTab<TValue>>
  value: TValue
  onChange: (value: TValue) => void
  pagerTranslateX?: Animated.Value
}

export function MobilePageTabs<TValue extends string>({
  tabs,
  value,
  onChange,
  pagerTranslateX,
}: MobilePageTabsProps<TValue>) {
  const { width } = useWindowDimensions()
  const position = useRef(new Animated.Value(0)).current
  const onChangeRef = useRef(onChange)
  const { setPageTabs } = useMobilePageTabsRegistration()
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.value === value),
  )
  const tabWidth = width / Math.max(tabs.length, 1)
  const indicatorTranslateX =
    pagerTranslateX && tabs.length > 1
      ? pagerTranslateX.interpolate({
          inputRange: tabs.map((_, index) => -index * width).reverse(),
          outputRange: tabs.map((_, index) => index * tabWidth).reverse(),
          extrapolate: 'clamp',
        })
      : position

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    Animated.spring(position, {
      toValue: activeIndex * tabWidth,
      tension: 130,
      friction: 17,
      useNativeDriver: true,
    }).start()
  }, [activeIndex, position, tabWidth])

  useFocusEffect(
    useCallback(() => {
      setPageTabs({
        routes: tabs.map((tab) => ({
          key: tab.value,
          name: tab.value,
          label: tab.label,
        })),
        index: activeIndex,
        navigateToIndex: (index) => {
          const tab = tabs[index]
          if (tab) onChangeRef.current(tab.value)
        },
      })

      return () => {
        setPageTabs({
          routes: [],
          index: 0,
          navigateToIndex: () => {},
        })
      }
    }, [
      activeIndex,
      setPageTabs,
      tabs.map((tab) => `${tab.value}:${tab.label}`).join('|'),
    ]),
  )

  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => {
        const isActive = index === activeIndex

        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={isActive ? { selected: true } : {}}
            style={[styles.tab, { width: tabWidth }]}
            onPress={() => onChange(tab.value)}
          >
            <Text
              style={[styles.label, isActive ? styles.activeLabel : null]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
      <Animated.View
        style={[
          styles.indicator,
          {
            left: tabWidth * 0.26,
            width: tabWidth * 0.48,
            transform: [{ translateX: indicatorTranslateX }],
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#000000',
  },
  tab: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 7,
  },
  label: {
    color: '#71767B',
    fontSize: 15,
    fontWeight: '700',
  },
  activeLabel: {
    color: '#E7E9EA',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#F11A23',
  },
})
