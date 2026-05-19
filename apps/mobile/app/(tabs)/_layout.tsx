import { Tabs, usePathname, useRouter, useSegments } from 'expo-router'
import { Images, MapPin, MessageCircle, User, Users } from 'lucide-react-native'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { Home03Icon } from '@hugeicons/core-free-icons'
import { useEffect, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  MobileSideMenuShell,
  MobileTabsHeader,
  MobileTopTabsProvider,
} from '../../src/components/navigation/MobileTabsHeader'

export const unstable_settings = {
  initialRouteName: 'members',
}

function getFocusedNestedRouteName(route: unknown) {
  const state = (
    route as {
      state?: {
        index?: number
        routes?: Array<{ name: string }>
      }
    }
  ).state
  if (!state?.routes?.length) return undefined
  return state.routes[state.index ?? 0]?.name
}

export default function TabsLayout() {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const lastOpenConversationHrefRef = useRef<string | null>(null)
  const insets = useSafeAreaInsets()
  const tabBarHeight = 48 + insets.bottom
  const segments = useSegments() as Array<string>
  const messagesSegmentIndex = segments.indexOf('messages')
  const mapSegmentIndex = segments.indexOf('map')
  const isMessagesDetailRoute =
    messagesSegmentIndex >= 0 && segments.length > messagesSegmentIndex + 1
  const isMapDetailRoute =
    mapSegmentIndex >= 0 && segments.length > mapSegmentIndex + 1
  const isNestedDetailRoute = isMessagesDetailRoute || isMapDetailRoute

  useEffect(() => {
    if (isNestedDetailRoute) setMenuOpen(false)
  }, [isNestedDetailRoute])

  useEffect(() => {
    if (
      isMessagesDetailRoute &&
      pathname.includes('/messages/conversations/')
    ) {
      lastOpenConversationHrefRef.current = pathname
      return
    }

    if (messagesSegmentIndex >= 0 && !isMessagesDetailRoute) {
      lastOpenConversationHrefRef.current = null
    }
  }, [isMessagesDetailRoute, messagesSegmentIndex, pathname])

  return (
    <MobileTopTabsProvider>
      <MobileSideMenuShell
        expanded={menuOpen}
        onExpandedChange={setMenuOpen}
        isEnabled={!isNestedDetailRoute}
      >
        <Tabs
          detachInactiveScreens={false}
          initialRouteName="members"
          screenOptions={{
            freezeOnBlur: false,
            lazy: false,
            header: ({ options, route }) => (
              <MobileTabsHeader
                title={options.title ?? route.name}
                onOpenMenu={() => setMenuOpen(true)}
              />
            ),
            sceneStyle: {
              backgroundColor: '#000000',
            },
            tabBarStyle: {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: tabBarHeight,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.14)',
              backgroundColor: '#000000',
              paddingTop: 4,
              paddingBottom: insets.bottom,
              paddingHorizontal: 0,
              elevation: 0,
            },
            tabBarItemStyle: {
              height: 40,
              justifyContent: 'center',
            },
            tabBarIconStyle: {
              marginTop: 0,
            },
            tabBarActiveTintColor: '#E7E9EA',
            tabBarInactiveTintColor: '#8B98A5',
            tabBarShowLabel: false,
            tabBarHideOnKeyboard: true,
          }}
        >
          <Tabs.Screen
            name="map"
            options={({ route }) => {
              const focusedRouteName = getFocusedNestedRouteName(route)
              return {
                title: 'Spots',
                tabBarLabel: 'Spots',
                headerShown:
                  !isMapDetailRoute &&
                  (!focusedRouteName || focusedRouteName === 'index'),
                tabBarIcon: ({ color }) => (
                  <MapPin color={color} size={24} strokeWidth={2.2} />
                ),
              }
            }}
          />
          <Tabs.Screen
            name="members"
            options={{
              title: 'Members',
              tabBarLabel: 'Members',
              tabBarIcon: ({ color }) => (
                <Users color={color} size={24} strokeWidth={2.2} />
              ),
            }}
          />
          <Tabs.Screen
            name="barn"
            options={{
              title: 'The Barn',
              tabBarLabel: 'Barn',
              tabBarIcon: ({ color }) => (
                <HugeiconsIcon
                  icon={Home03Icon}
                  color={color}
                  size={24}
                  strokeWidth={2.2}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="messages"
            options={({ route }) => ({
              title: 'Messages',
              tabBarLabel: 'Messages',
              headerShown: !isMessagesDetailRoute,
              tabBarIcon: ({ color }) => (
                <MessageCircle color={color} size={24} strokeWidth={2.2} />
              ),
            })}
            listeners={{
              tabPress: (event) => {
                const lastConversationHref = lastOpenConversationHrefRef.current
                if (!lastConversationHref || messagesSegmentIndex >= 0) return

                event.preventDefault()
                router.push(lastConversationHref as never)
              },
            }}
          />
          <Tabs.Screen
            name="photos"
            options={{
              title: 'Photos',
              tabBarLabel: 'Photos',
              tabBarIcon: ({ color }) => (
                <Images color={color} size={24} strokeWidth={2.2} />
              ),
            }}
          />
          <Tabs.Screen
            name="feed"
            options={{
              title: 'Feed',
              href: null,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarLabel: 'Profile',
              href: null,
              tabBarIcon: ({ color }) => (
                <User color={color} size={24} strokeWidth={2.2} />
              ),
            }}
          />
        </Tabs>
      </MobileSideMenuShell>
    </MobileTopTabsProvider>
  )
}
