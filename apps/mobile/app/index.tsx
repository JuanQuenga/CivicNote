import { useQuery } from 'convex/react'
import { Redirect } from 'expo-router'
import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '@/src/lib/convexApi'
import { useCurrentUser } from '../src/hooks/useCurrentUser'

export default function IndexRoute() {
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const profile = useQuery(
    api.members.getProfile,
    user?._id ? { userId: user._id } : 'skip',
  )

  if (isLoading || (user?._id && profile === undefined)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#F11A23" size="large" />
        <Text className="mt-3 text-sm text-muted-foreground">
          Loading Civic Research Hub...
        </Text>
      </SafeAreaView>
    )
  }

  if (isAuthenticated && user && profile && !profile.onboardingComplete) {
    return <Redirect href={'/onboarding' as never} />
  }

  return <Redirect href="/(tabs)/members" />
}
