import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as Haptics from 'expo-haptics'
import { usePathname, useRouter } from 'expo-router'
import {
  Alert,
  Animated,
  DeviceEventEmitter,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery } from 'convex/react'
import {
  Bell,
  CircleOff,
  Eye,
  EyeOff,
  Gift,
  HeartPulse,
  LogOut,
  Map,
  Phone,
  Plane,
  Plus,
  Rocket,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  UserX,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { Avatar } from '../ui/Avatar'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { useWorkOSAuth } from '../../lib/workosAuth'
import type { ReactNode } from 'react'
import type { GestureResponderEvent } from 'react-native'

type HeaderProps = {
  title: string
  onOpenMenu: () => void
}

type TopTabRoute = {
  key: string
  name: string
  label: string
}

type RegisteredTopTabs = {
  routes: Array<TopTabRoute>
  index: number
  navigateToIndex: (index: number) => void
}

type TopTabsContextValue = RegisteredTopTabs & {
  swipeX: Animated.Value
  setTopTabs: (tabs: RegisteredTopTabs) => void
  pageTabs: RegisteredTopTabs
  pageTabsIndexRef: React.MutableRefObject<number>
  setPageTabs: (tabs: RegisteredTopTabs) => void
}

type MenuItemProps = {
  icon: React.ComponentType<{ color: string; size: number }>
  label: string
  active?: boolean
  danger?: boolean
  onPress: () => void
}

type MenuRoute = {
  href: string
  label: string
  icon: React.ComponentType<{ color: string; size: number }>
  match: (pathname: string) => boolean
}

const MENU_SNAP_VELOCITY = 850
const TAB_SNAP_DISTANCE = 72
const TAB_SNAP_VELOCITY = 720
const MENU_EDGE_WIDTH = 44
const MENU_CONTENT_RADIUS = 64
const MENU_CONTENT_EDGE_OVERLAP = 8
const MENU_HAPTIC_SNAP_POINT = 0.5
const MENU_PRESS_CANCEL_DISTANCE = 8
export const MOBILE_OPEN_SIDE_MENU_EVENT = 'mobile-side-menu:open'
const VISIBLE_TOP_TAB_ROUTES = new Set([
  'map',
  'members',
  'barn',
  'messages',
  'photos',
])

const TopTabsContext = createContext<TopTabsContextValue | null>(null)

export function MobileTopTabsProvider({ children }: { children: ReactNode }) {
  const swipeX = useRef(new Animated.Value(0)).current
  const pageTabsIndexRef = useRef(0)
  const [registeredTabs, setRegisteredTabs] = useState<RegisteredTopTabs>({
    routes: [],
    index: 0,
    navigateToIndex: () => {},
  })
  const [registeredPageTabs, setRegisteredPageTabs] =
    useState<RegisteredTopTabs>({
      routes: [],
      index: 0,
      navigateToIndex: () => {},
    })
  const setRegisteredPageTabsNow = useMemo(
    () => (tabs: RegisteredTopTabs) => {
      pageTabsIndexRef.current = tabs.index
      setRegisteredPageTabs(tabs)
    },
    [],
  )

  return (
    <TopTabsContext.Provider
      value={{
        ...registeredTabs,
        swipeX,
        setTopTabs: setRegisteredTabs,
        pageTabs: registeredPageTabs,
        pageTabsIndexRef,
        setPageTabs: setRegisteredPageTabsNow,
      }}
    >
      {children}
    </TopTabsContext.Provider>
  )
}

function useMobileTopTabs() {
  const value = useContext(TopTabsContext)
  if (!value) {
    throw new Error('Mobile top tabs must be rendered inside their provider.')
  }

  return value
}

export function useMobilePageTabsRegistration() {
  const value = useMobileTopTabs()

  return {
    pageTabs: value.pageTabs,
    pageTabsIndexRef: value.pageTabsIndexRef,
    setPageTabs: value.setPageTabs,
  }
}

const SECONDARY_MENU_ROUTES: Array<MenuRoute> = [
  {
    href: '/settings',
    label: 'Settings',
    icon: SlidersHorizontal,
    match: (pathname) => pathname === '/settings',
  },
  {
    href: '/health',
    label: 'Health',
    icon: HeartPulse,
    match: (pathname) => pathname === '/health',
  },
  {
    href: '/subscription',
    label: 'Subscription',
    icon: Sparkles,
    match: (pathname) =>
      pathname === '/subscription' || pathname === '/subscription-success',
  },
  {
    href: '/calls',
    label: 'Calls',
    icon: Phone,
    match: (pathname) => pathname === '/calls',
  },
  {
    href: '/referrals',
    label: 'Referrals',
    icon: Gift,
    match: (pathname) => pathname === '/referrals',
  },
  {
    href: '/controls',
    label: 'Controls',
    icon: Shield,
    match: (pathname) => pathname === '/controls',
  },
  {
    href: '/moderation-notifications',
    label: 'Moderation',
    icon: Bell,
    match: (pathname) => pathname === '/moderation-notifications',
  },
  {
    href: '/appeal',
    label: 'Appeals',
    icon: Scale,
    match: (pathname) => pathname === '/appeal',
  },
  {
    href: '/blocked-users',
    label: 'Blocked Users',
    icon: UserX,
    match: (pathname) => pathname === '/blocked-users',
  },
]

function MenuItem({
  icon: Icon,
  label,
  active = false,
  danger = false,
  onPress,
}: MenuItemProps) {
  const iconColor = danger ? '#F87171' : '#FAFAFA'
  const labelColor = danger ? 'text-red-300' : 'text-foreground'

  return (
    <Pressable
      className={`flex-row items-center gap-4 rounded-2xl px-3 py-3.5 ${
        active ? 'bg-white/6' : ''
      }`}
      onPress={onPress}
    >
      <View className="w-8 items-center justify-center">
        <Icon color={iconColor} size={20} />
      </View>
      <Text className={`flex-1 text-[18px] font-semibold ${labelColor}`}>
        {label}
      </Text>
    </Pressable>
  )
}

const INACTIVE_ICON_COLOR = '#9CA3AF'
const PRIMARY_ACTIVE_COLOR = '#F11A23'

function TogglePill({
  checked,
  activeColor,
}: {
  checked: boolean
  activeColor: string
}) {
  return (
    <View
      style={{
        backgroundColor: checked ? activeColor : 'rgba(255,255,255,0.12)',
        borderRadius: 999,
        height: 24,
        padding: 2,
        width: 44,
      }}
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 999,
          height: 20,
          transform: [{ translateX: checked ? 20 : 0 }],
          width: 20,
        }}
      />
    </View>
  )
}

function ToggleRow({
  icon: Icon,
  label,
  activeIconColor,
  checked,
  activeColor,
  disabled,
  onPress,
}: {
  icon: React.ComponentType<{ color: string; size: number }>
  label: string
  activeIconColor: string
  checked: boolean
  activeColor: string
  disabled: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      className="flex-row items-center gap-4 rounded-2xl px-3 py-3.5"
      disabled={disabled}
      style={{ opacity: disabled ? 0.6 : 1 }}
      onPress={onPress}
    >
      <View className="w-8 items-center justify-center">
        <Icon
          color={checked ? activeIconColor : INACTIVE_ICON_COLOR}
          size={20}
        />
      </View>
      <Text className="flex-1 text-[18px] font-semibold text-foreground">
        {label}
      </Text>
      <TogglePill checked={checked} activeColor={activeColor} />
    </Pressable>
  )
}

function InfoRow({
  icon: Icon,
  iconColor = '#FAFAFA',
  label,
  labelClassName = 'text-foreground',
  rightLabel,
  onPress,
}: {
  icon: React.ComponentType<{ color: string; size: number }>
  iconColor?: string
  label: string
  labelClassName?: string
  rightLabel?: string
  onPress: () => void
}) {
  return (
    <Pressable
      className="flex-row items-center gap-4 rounded-2xl px-3 py-3.5"
      onPress={onPress}
    >
      <View className="w-8 items-center justify-center">
        <Icon color={iconColor} size={20} />
      </View>
      <Text className={`flex-1 text-[18px] font-semibold ${labelClassName}`}>
        {label}
      </Text>
      {rightLabel ? (
        <Text className="text-[14px] text-muted-foreground">{rightLabel}</Text>
      ) : null}
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
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const { signOut } = useWorkOSAuth()
  const { user, workosUser } = useCurrentUser()
  const profile = useQuery(api.members.getMyProfile, user ? {} : 'skip')
  const profilePhotoUrl = useQuery(
    api.members.getMyPrimaryProfilePhotoUrl,
    user ? {} : 'skip',
  )
  const setStatusMode = useMutation(api.members.setStatusMode)
  const toggleInvisible = useMutation(api.members.toggleInvisible)
  const toggleDiscreet = useMutation(api.members.toggleDiscreet)
  const updatePreferences = useMutation(api.members.updateUserPreferences)
  const callCredits = useQuery(api.callSessions.getCallCredits)
  const activeBoost = useQuery(api.profileBoosts.getActiveBoost)
  const boostCredits = useQuery(api.profileBoosts.getBoostCreditsState)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUpdatingBlur, setIsUpdatingBlur] = useState(false)

  const navigateTo = (href: string) => {
    onExpandedChange(false)
    setTimeout(() => {
      router.push(href as never)
    }, 180)
  }

  const handleSignOut = () => {
    onExpandedChange(false)
    setTimeout(() => {
      void signOut()
    }, 180)
  }

  const isLookingNow = !!user?.isLookingNow
  const isTraveling = !!user?.isTraveling
  const isInvisible = !!user?.isInvisible
  const isDiscreet = !!user?.isDiscreet
  const blurNsfwMedia = !!user?.blurNsfwMedia

  const handleStatusToggle = useCallback(
    async (
      mode: 'looking_now' | 'traveling' | 'appear_offline' | 'discreet',
      isCurrentlyOn: boolean,
    ) => {
      if (isUpdatingStatus) return
      setIsUpdatingStatus(true)
      try {
        if (mode === 'appear_offline') {
          await toggleInvisible({})
          return
        }

        if (mode === 'discreet') {
          await toggleDiscreet({})
          return
        }

        await setStatusMode({ mode: isCurrentlyOn ? 'online' : mode })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not update status'
        Alert.alert('Status failed', message)
      } finally {
        setIsUpdatingStatus(false)
      }
    },
    [isUpdatingStatus, setStatusMode, toggleDiscreet, toggleInvisible],
  )

  const handleBlurToggle = useCallback(async () => {
    if (isUpdatingBlur) return
    setIsUpdatingBlur(true)
    try {
      await updatePreferences({ blurNsfwMedia: !blurNsfwMedia })
    } catch {
      // Ignore — the backend will reject invalid updates.
    } finally {
      setIsUpdatingBlur(false)
    }
  }, [blurNsfwMedia, isUpdatingBlur, updatePreferences])

  if (!user) return null

  const hasUltraAccess =
    ((user.subscriptionTier === 'ultra' || user.subscriptionTier === 'pro') &&
      user.subscriptionStatus === 'active') ||
    (user.referralUltraExpiresAt ?? 0) > Date.now()
  const isProTier = user.subscriptionTier === 'pro'

  const boostStatusLabel = activeBoost
    ? 'Active'
    : boostCredits
      ? `${boostCredits.totalRemaining} left`
      : undefined

  const callMinutesLabel = callCredits
    ? `${
        Math.floor((callCredits.audioRemainingSec ?? 0) / 60) +
        Math.floor((callCredits.videoRemainingSec ?? 0) / 60)
      } min`
    : undefined
  const displayName =
    profile?.displayName ||
    user.name ||
    `${workosUser?.firstName ?? ''} ${workosUser?.lastName ?? ''}`.trim() ||
    'User'
  const portraitImageUrl =
    profilePhotoUrl ?? user.imageUrl ?? workosUser?.profilePictureUrl

  return (
    <View
      className="absolute bottom-0 left-0 top-0 bg-black"
      style={{
        width: drawerWidth,
        paddingTop: insets.top + 16,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
      >
        <Pressable
          accessibilityRole="button"
          className="pb-5"
          onPress={() => navigateTo('/(tabs)/profile')}
        >
          <View className="flex-row items-center gap-4">
            <Avatar
              imageUrl={portraitImageUrl}
              name={displayName}
              size="portrait"
            />
            <View className="flex-1">
              <Text
                className="text-[18px] font-bold text-foreground"
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {displayName}
              </Text>
              <Text className="mt-1 text-[14px] text-muted-foreground">
                Tap to edit profile
              </Text>
              <Text className="mt-3 text-[15px] font-semibold text-foreground">
                {hasUltraAccess ? 'Ultra access' : 'Free account'}
              </Text>
            </View>
          </View>
        </Pressable>

        <View className="border-t border-white/10 pt-5">
          <ToggleRow
            icon={Eye}
            label="Looking Now"
            activeIconColor="#EF4444"
            checked={isLookingNow}
            activeColor="#EF4444"
            disabled={isUpdatingStatus}
            onPress={() => void handleStatusToggle('looking_now', isLookingNow)}
          />
          <ToggleRow
            icon={Plane}
            label="Traveling"
            activeIconColor="#F59E0B"
            checked={isTraveling}
            activeColor="#F59E0B"
            disabled={isUpdatingStatus}
            onPress={() => void handleStatusToggle('traveling', isTraveling)}
          />
          <ToggleRow
            icon={CircleOff}
            label="Appear Offline"
            activeIconColor="#FAFAFA"
            checked={isInvisible}
            activeColor={PRIMARY_ACTIVE_COLOR}
            disabled={isUpdatingStatus}
            onPress={() =>
              void handleStatusToggle('appear_offline', isInvisible)
            }
          />
          <ToggleRow
            icon={EyeOff}
            label="Discreet Mode"
            activeIconColor="#FAFAFA"
            checked={isDiscreet}
            activeColor={PRIMARY_ACTIVE_COLOR}
            disabled={isUpdatingStatus}
            onPress={() => void handleStatusToggle('discreet', isDiscreet)}
          />
          <ToggleRow
            icon={ShieldAlert}
            label="NSFW Blur"
            activeIconColor="#FAFAFA"
            checked={blurNsfwMedia}
            activeColor={PRIMARY_ACTIVE_COLOR}
            disabled={isUpdatingBlur}
            onPress={() => void handleBlurToggle()}
          />

          <View className="my-3 h-px bg-white/10" />

          <InfoRow
            icon={Sparkles}
            iconColor={hasUltraAccess ? '#60A5FA' : '#FAFAFA'}
            label={
              hasUltraAccess
                ? isProTier
                  ? 'Pro'
                  : 'Ultra'
                : 'Upgrade to Ultra'
            }
            labelClassName={
              hasUltraAccess ? 'text-[#60A5FA]' : 'text-foreground'
            }
            rightLabel={hasUltraAccess ? 'manage billing' : undefined}
            onPress={() => navigateTo('/subscription')}
          />
          <InfoRow
            icon={Rocket}
            iconColor="#FBBF24"
            label="Profile Boost"
            rightLabel={boostStatusLabel}
            onPress={() => navigateTo('/subscription')}
          />
          <InfoRow
            icon={Phone}
            label="Call Minutes"
            rightLabel={callMinutesLabel}
            onPress={() => navigateTo('/calls')}
          />
        </View>

        <View className="mt-5 border-t border-white/10 pt-5">
          {SECONDARY_MENU_ROUTES.map((item) => (
            <MenuItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              active={item.match(pathname)}
              onPress={() => navigateTo(item.href)}
            />
          ))}
        </View>

        <View className="mt-5 border-t border-white/10 pt-5">
          <MenuItem
            icon={LogOut}
            label="Sign Out"
            danger
            onPress={handleSignOut}
          />
        </View>
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
  const { isAuthenticated, user } = useCurrentUser()
  const topTabs = useMobileTopTabs()
  const drawerWidth = Math.min(width * 0.76, 300)
  const drawerOffset = useRef(
    new Animated.Value(expanded ? drawerWidth : 0),
  ).current
  const canUseMenu = isEnabled && isAuthenticated && !!user
  const canOpenMenuFromPageTab =
    topTabs.pageTabs.routes.length === 0 ||
    topTabs.pageTabsIndexRef.current === 0
  const [isDrawerOffsetVisible, setIsDrawerOffsetVisible] = useState(
    expanded && canUseMenu,
  )
  const menuGestureActiveRef = useRef(false)
  const menuSnapHapticSideRef = useRef<'before' | 'after' | null>(null)
  const contentTouchStartRef = useRef<{ x: number; y: number } | null>(null)
  const topTabGestureStartXRef = useRef(0)
  const topTabGestureIsEdgeMenuRef = useRef(false)

  const triggerMenuSnapHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  }, [])

  const maybeTriggerMenuSnapHaptic = useCallback(
    (offset: number) => {
      if (drawerWidth <= 0) return

      const nextSide =
        offset >= drawerWidth * MENU_HAPTIC_SNAP_POINT ? 'after' : 'before'
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
    [drawerWidth, triggerMenuSnapHaptic],
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
    [drawerOffset, drawerWidth],
  )

  useEffect(() => {
    if (canUseMenu) {
      animateTo(expanded ? 1 : 0)
      return
    }

    drawerOffset.setValue(0)
  }, [animateTo, canUseMenu, drawerOffset, expanded])

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      MOBILE_OPEN_SIDE_MENU_EVENT,
      () => {
        if (canUseMenu) {
          onExpandedChange(true)
        }
      },
    )

    return () => {
      subscription.remove()
    }
  }, [canUseMenu, onExpandedChange])

  useEffect(() => {
    const listenerId = drawerOffset.addListener(({ value }) => {
      setIsDrawerOffsetVisible(value > 1)
      maybeTriggerMenuSnapHaptic(value)
    })

    return () => {
      drawerOffset.removeListener(listenerId)
    }
  }, [drawerOffset, maybeTriggerMenuSnapHaptic])

  const animateTopTabSwipeTo = (toValue: number, onFinished?: () => void) => {
    Animated.timing(topTabs.swipeX, {
      toValue,
      duration: toValue === 0 ? 180 : 150,
      useNativeDriver: true,
    }).start(() => onFinished?.())
  }

  const handleContentTouchStartCapture = useCallback(
    (event: GestureResponderEvent) => {
      contentTouchStartRef.current = {
        x: event.nativeEvent.pageX,
        y: event.nativeEvent.pageY,
      }
      return false
    },
    [],
  )

  const handleContentTouchMoveCapture = useCallback(
    (event: GestureResponderEvent) => {
      if (!canUseMenu) return false

      const touchStart = contentTouchStartRef.current
      if (!touchStart) return false

      const deltaX = event.nativeEvent.pageX - touchStart.x
      const deltaY = event.nativeEvent.pageY - touchStart.y
      const isHorizontalMenuDrag =
        Math.abs(deltaX) > MENU_PRESS_CANCEL_DISTANCE &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.2

      if (!isHorizontalMenuDrag) return false
      if (expanded) return true

      return canOpenMenuFromPageTab && deltaX > 0
    },
    [canOpenMenuFromPageTab, canUseMenu, expanded],
  )

  const menuPanGesture = Gesture.Pan()
    .enabled(canUseMenu)
    .runOnJS(true)
    .activeOffsetX([-14, 14])
    .failOffsetY([-20, 20])
    .onBegin(() => {
      menuGestureActiveRef.current = expanded || canOpenMenuFromPageTab
      if (menuGestureActiveRef.current) {
        drawerOffset.stopAnimation((value) => {
          menuSnapHapticSideRef.current =
            value >= drawerWidth * MENU_HAPTIC_SNAP_POINT ? 'after' : 'before'
        })
      }
    })
    .onUpdate(({ translationX }) => {
      if (!menuGestureActiveRef.current) return

      const startOffset = expanded ? drawerWidth : 0
      const nextOffset = Math.min(
        Math.max(startOffset + translationX, 0),
        drawerWidth,
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

  const topTabPanGesture = Gesture.Pan()
    .enabled(
      canUseMenu &&
        !expanded &&
        topTabs.pageTabs.routes.length === 0 &&
        topTabs.routes.length > 1 &&
        topTabs.routes[topTabs.index]?.name !== 'map',
    )
    .runOnJS(true)
    .activeOffsetX([-18, 18])
    .failOffsetY([-18, 18])
    .onBegin(({ absoluteX }) => {
      topTabGestureStartXRef.current = absoluteX
      topTabGestureIsEdgeMenuRef.current = absoluteX <= MENU_EDGE_WIDTH
      topTabs.swipeX.stopAnimation()
    })
    .onUpdate(({ translationX }) => {
      if (translationX > 0 && topTabGestureIsEdgeMenuRef.current) {
        topTabs.swipeX.setValue(0)
        return
      }

      const hasPrevious = topTabs.index > 0
      const hasNext = topTabs.index < topTabs.routes.length - 1
      const canMove =
        (translationX > 0 && hasPrevious) || (translationX < 0 && hasNext)
      const resistance = canMove ? 1 : 0.24
      topTabs.swipeX.setValue(translationX * resistance)
    })
    .onEnd(({ translationX, velocityX }) => {
      if (translationX > 0 && topTabGestureIsEdgeMenuRef.current) {
        topTabGestureIsEdgeMenuRef.current = false
        topTabs.swipeX.setValue(0)
        return
      }

      topTabGestureIsEdgeMenuRef.current = false
      const currentIndex = topTabs.index
      let nextIndex = currentIndex

      if (translationX < -TAB_SNAP_DISTANCE || velocityX < -TAB_SNAP_VELOCITY) {
        nextIndex = Math.min(currentIndex + 1, topTabs.routes.length - 1)
      } else if (
        translationX > TAB_SNAP_DISTANCE ||
        velocityX > TAB_SNAP_VELOCITY
      ) {
        nextIndex = Math.max(currentIndex - 1, 0)
      }

      if (nextIndex === currentIndex) {
        animateTopTabSwipeTo(0)
        return
      }

      animateTopTabSwipeTo(nextIndex > currentIndex ? -width : width, () => {
        topTabs.navigateToIndex(nextIndex)
        topTabs.swipeX.setValue(0)
      })
    })

  const composedGesture = Gesture.Simultaneous(menuPanGesture, topTabPanGesture)
  const overlayOpacity = drawerOffset.interpolate({
    inputRange: [0, drawerWidth],
    outputRange: [0, 0.22],
    extrapolate: 'clamp',
  })
  const contentEdgeOverlap = drawerOffset.interpolate({
    inputRange: [0, drawerWidth * 0.18, drawerWidth],
    outputRange: [0, -MENU_CONTENT_EDGE_OVERLAP, -MENU_CONTENT_EDGE_OVERLAP],
    extrapolate: 'clamp',
  })
  const contentTranslateX = Animated.add(drawerOffset, contentEdgeOverlap)
  const shouldBlockContentPresses = expanded || isDrawerOffsetVisible
  const contentRadius = isDrawerOffsetVisible ? MENU_CONTENT_RADIUS : 0

  if (!canUseMenu) {
    return <View className="flex-1 bg-background">{children}</View>
  }

  return (
    <View className="flex-1 bg-black">
      <SideMenuContent
        drawerWidth={drawerWidth}
        onExpandedChange={onExpandedChange}
      />

      <GestureDetector gesture={composedGesture}>
        <Animated.View
          className="flex-1 bg-background"
          onMoveShouldSetResponderCapture={handleContentTouchMoveCapture}
          onStartShouldSetResponderCapture={handleContentTouchStartCapture}
          style={{
            borderTopLeftRadius: contentRadius,
            borderBottomLeftRadius: contentRadius,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            elevation: 18,
            overflow: 'hidden',
            shadowColor: '#000000',
            shadowOffset: { width: -8, height: 0 },
            shadowOpacity: 0.28,
            shadowRadius: 24,
            transform: [{ translateX: contentTranslateX }],
          }}
        >
          {children}
          <Pressable
            accessibilityLabel="Close account menu"
            pointerEvents={shouldBlockContentPresses ? 'auto' : 'none'}
            style={styles.contentScrim}
            onPress={() => {
              if (expanded) {
                onExpandedChange(false)
              }
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

export function MobileTabsHeader({ title, onOpenMenu }: HeaderProps) {
  const { isAuthenticated, user, workosUser } = useCurrentUser()
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const router = useRouter()
  const profilePhotoUrl = useQuery(
    api.members.getMyPrimaryProfilePhotoUrl,
    isAuthenticated && user ? {} : 'skip',
  )
  const avatarImageUrl =
    profilePhotoUrl ?? user?.imageUrl ?? workosUser?.profilePictureUrl
  const showBarnLogo = title === 'The Barn'
  const showSearchAction =
    pathname === '/members' || pathname === '/messages' || pathname === '/map'
  const showCreateAction = pathname === '/messages' || pathname === '/map'
  const showMapAction = true
  const actionCount = (showSearchAction ? 1 : 0) + (showCreateAction ? 1 : 0)
  const totalActionCount = actionCount + (showMapAction ? 1 : 0)
  const actionSlotWidth = totalActionCount > 0 ? totalActionCount * 40 : 40

  const handleCreateAction = () => {
    if (pathname === '/map') {
      router.push('/(tabs)/map/spots/new' as never)
      return
    }

    DeviceEventEmitter.emit(`mobile-create:${pathname}`)
  }

  const handleMapAction = () => {
    DeviceEventEmitter.emit('mobile-map:toggle')
  }

  const handleOpenMenu = () => {
    onOpenMenu()
    DeviceEventEmitter.emit(MOBILE_OPEN_SIDE_MENU_EVENT)
  }

  return (
    <>
      <View
        className="bg-background px-4"
        style={{ paddingTop: insets.top + 4 }}
      >
        <View className="relative h-12 flex-row items-center justify-center">
          <View
            className="items-center justify-center"
            pointerEvents="none"
            style={{ paddingHorizontal: Math.max(52, actionSlotWidth + 8) }}
          >
            {showBarnLogo ? (
              <Image
                accessibilityLabel="Civic Research Hub"
                source={require('../../../assets/icon.png')}
                className="h-8 w-8 rounded-lg"
              />
            ) : (
              <Text
                className="text-[19px] font-bold text-foreground"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {title}
              </Text>
            )}
          </View>
          <View
            className="absolute right-0 top-1 flex-row items-center justify-end"
            style={{ width: actionSlotWidth }}
          >
            {showSearchAction ? (
              <Pressable
                accessibilityLabel={`Search ${title}`}
                className="h-10 w-10 items-center justify-center rounded-full"
                onPress={() => {
                  DeviceEventEmitter.emit(`mobile-search:${pathname}`)
                }}
              >
                <Search color="#FAFAFA" size={21} />
              </Pressable>
            ) : null}
            {showCreateAction ? (
              <Pressable
                accessibilityLabel={
                  pathname === '/map' ? 'Add spot' : 'Start a new conversation'
                }
                className="h-10 w-10 items-center justify-center rounded-full"
                onPress={handleCreateAction}
              >
                <Plus color="#FAFAFA" size={22} />
              </Pressable>
            ) : null}
            {showMapAction ? (
              <Pressable
                accessibilityLabel="Open map"
                className="h-10 w-10 items-center justify-center rounded-full"
                onPress={handleMapAction}
              >
                <Map color="#FAFAFA" size={21} />
              </Pressable>
            ) : null}
          </View>
          {isAuthenticated && user ? (
            <Pressable
              accessibilityLabel="Open account menu"
              hitSlop={8}
              onPressIn={handleOpenMenu}
              style={styles.headerAvatarButton}
            >
              <Avatar imageUrl={avatarImageUrl} name={user.name} size="md" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </>
  )
}

export function MobileTopTabsHeader({
  descriptors,
  navigation,
  onOpenMenu,
  state,
}: {
  descriptors: Record<string, any>
  navigation: any
  onOpenMenu: () => void
  state: {
    index: number
    routes: Array<{ key: string; name: string; params?: object }>
  }
}) {
  const { isAuthenticated, user, workosUser } = useCurrentUser()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { setTopTabs, swipeX } = useMobileTopTabs()
  const indicatorBaseX = useRef(new Animated.Value(0)).current
  const profilePhotoUrl = useQuery(
    api.members.getMyPrimaryProfilePhotoUrl,
    isAuthenticated && user ? {} : 'skip',
  )
  const avatarImageUrl =
    profilePhotoUrl ?? user?.imageUrl ?? workosUser?.profilePictureUrl

  const visibleRoutes = state.routes
    .map((route) => {
      const options = descriptors[route.key]?.options ?? {}
      const rawLabel = options.tabBarLabel ?? options.title ?? route.name
      const label = typeof rawLabel === 'string' ? rawLabel : options.title

      return {
        key: route.key,
        name: route.name,
        label: label ?? route.name,
      }
    })
    .filter((route) => VISIBLE_TOP_TAB_ROUTES.has(route.name))

  const focusedRoute = state.routes[state.index]
  const activeIndex = Math.max(
    0,
    visibleRoutes.findIndex((route) => route.key === focusedRoute?.key),
  )
  const tabWidth = width / Math.max(visibleRoutes.length, 1)
  const tabTravel = swipeX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [tabWidth, 0, -tabWidth],
    extrapolate: 'clamp',
  })
  const indicatorTranslateX = Animated.add(indicatorBaseX, tabTravel)

  const navigateToIndex = (nextIndex: number) => {
    const route = visibleRoutes[nextIndex]
    if (!route) return

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    })

    if (!event.defaultPrevented) {
      navigation.navigate(route.name)
    }
  }

  useEffect(() => {
    setTopTabs({
      routes: visibleRoutes,
      index: activeIndex,
      navigateToIndex,
    })
  }, [
    activeIndex,
    state.index,
    visibleRoutes.map((route) => route.key).join('|'),
  ])

  useEffect(() => {
    Animated.spring(indicatorBaseX, {
      toValue: activeIndex * tabWidth,
      tension: 130,
      friction: 18,
      useNativeDriver: true,
    }).start()
  }, [activeIndex, indicatorBaseX, tabWidth])

  const handleOpenMenu = () => {
    onOpenMenu()
    DeviceEventEmitter.emit(MOBILE_OPEN_SIDE_MENU_EVENT)
  }

  return (
    <View
      className="border-b border-white/10 bg-background"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center justify-between px-4 pb-4">
        <View className="w-12" />
        <Image
          accessibilityLabel="Civic Research Hub"
          source={require('../../../assets/icon.png')}
          className="h-8 w-8 rounded-lg"
        />
        <View className="w-12" />
        {isAuthenticated && user ? (
          <Pressable
            accessibilityLabel="Open account menu"
            hitSlop={8}
            onPressIn={handleOpenMenu}
            style={styles.topTabsAvatarButton}
          >
            <Avatar imageUrl={avatarImageUrl} name={user.name} size="md" />
          </Pressable>
        ) : null}
      </View>

      <View className="relative flex-row">
        {visibleRoutes.map((route, index) => {
          const isFocused = index === activeIndex

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={isFocused ? { selected: true } : {}}
              className="h-11 items-center justify-end pb-0.5"
              style={{ width: tabWidth }}
              onPress={() => navigateToIndex(index)}
            >
              <Text
                className={`text-[15px] font-bold ${
                  isFocused ? 'text-foreground' : 'text-muted-foreground'
                }`}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {route.label}
              </Text>
            </Pressable>
          )
        })}
        <Animated.View
          className="absolute bottom-0 h-1 rounded-full bg-[#F11A23]"
          style={{
            left: tabWidth * 0.18,
            width: tabWidth * 0.64,
            transform: [{ translateX: indicatorTranslateX }],
          }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerAvatarButton: {
    position: 'absolute',
    left: 0,
    top: 2,
    zIndex: 50,
    elevation: 50,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  topTabsAvatarButton: {
    position: 'absolute',
    left: 16,
    top: 0,
    zIndex: 50,
    elevation: 50,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  contentScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
})
