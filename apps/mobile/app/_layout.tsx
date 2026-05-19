import { GestureHandlerRootView } from 'react-native-gesture-handler'
import '../global.css'
import Constants from 'expo-constants'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ConvexProviderWithAuth } from 'convex/react'
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit'
import { Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { convex } from '../src/lib/convexClient'
import { WORKOS_CLIENT_ID } from '../src/lib/env'
import {
  WorkOSAuthProvider,
  useWorkOSAuthForConvex,
} from '../src/lib/workosAuth'
import { MobileAppMapSheet } from '../src/components/map/MobileAppMapSheet'
import type { ReactNode } from 'react'

function registerLiveKitGlobals() {
  if (Constants.appOwnership === 'expo') return

  const { registerGlobals } = require('@livekit/react-native') as {
    registerGlobals: () => void
  }
  registerGlobals()
}

registerLiveKitGlobals()

function MissingConfiguration() {
  const missing: Array<string> = []
  if (!convex) missing.push('EXPO_PUBLIC_CONVEX_URL')
  if (!WORKOS_CLIENT_ID) missing.push('EXPO_PUBLIC_WORKOS_CLIENT_ID')

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-center text-2xl font-semibold text-foreground">
        Missing mobile environment variables
      </Text>
      <Text className="mt-3 text-center text-sm font-normal text-muted-foreground">
        {missing.join(', ')}
      </Text>
      <Text className="mt-3 text-center text-sm font-normal text-muted-foreground">
        Set them in .env.local before starting Expo.
      </Text>
    </SafeAreaView>
  )
}

function AppProviders({ children }: { children: ReactNode }) {
  if (!convex) return null

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useWorkOSAuthForConvex}>
      {children}
    </ConvexProviderWithAuth>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  })

  if (!fontsLoaded && !fontError) {
    return null
  }

  if (!convex || !WORKOS_CLIENT_ID) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <MissingConfiguration />
      </SafeAreaProvider>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WorkOSAuthProvider>
          <AppProviders>
            <View className="flex-1 bg-background">
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: '#000000' },
                  headerTintColor: '#FAFAFA',
                  headerTitleStyle: {
                    fontWeight: '600',
                    fontFamily: 'Outfit_600SemiBold',
                  },
                  headerShadowVisible: false,
                  contentStyle: { backgroundColor: '#000000' },
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen
                  name="onboarding"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="conversations/[conversationId]"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="groups/new"
                  options={{
                    title: 'New Group',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="join/[referralCode]"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="user/[userId]"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="spots/new"
                  options={{
                    title: 'Add Spot',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="spots/[spotId]"
                  options={{
                    title: 'Spot',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="meetups"
                  options={{
                    title: 'Meetups',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="meetups/[meetupId]"
                  options={{
                    title: 'Meetup',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="settings"
                  options={{
                    title: 'Settings',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="referrals"
                  options={{
                    title: 'Referrals',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="subscription"
                  options={{
                    title: 'Subscription',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="subscription-success"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="calls"
                  options={{
                    title: 'Calls',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="appeal"
                  options={{
                    title: 'Appeal',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="moderation-notifications"
                  options={{
                    title: 'Moderation',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="controls"
                  options={{
                    title: 'Controls',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="health"
                  options={{
                    title: 'Health',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="news"
                  options={{
                    title: 'News',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="blocked-users"
                  options={{
                    title: 'Blocked Users',
                    headerBackTitle: 'Back',
                  }}
                />
                <Stack.Screen
                  name="+not-found"
                  options={{ title: 'Not found' }}
                />
              </Stack>
              <MobileAppMapSheet />
            </View>
          </AppProviders>
        </WorkOSAuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
