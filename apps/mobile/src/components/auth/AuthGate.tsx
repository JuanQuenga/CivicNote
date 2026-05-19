import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useWorkOSAuth } from '../../lib/workosAuth'

interface AuthGateProps {
  title?: string
  description?: string
}

export function AuthGate({
  title = 'Welcome to Civic Research Hub',
  description = 'Sign in to explore your community and send messages.',
}: AuthGateProps) {
  const { error, isLoading, signIn, signUp } = useWorkOSAuth()

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-foreground">{title}</Text>
        <Text className="mt-3 text-base font-normal text-muted-foreground">
          {description}
        </Text>

        <View className="mt-8 gap-3">
          <Pressable
            className="items-center rounded-2xl bg-primary px-4 py-4"
            disabled={isLoading}
            onPress={() => {
              void signIn().catch(() => {})
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-primary-foreground">
                Sign in
              </Text>
            )}
          </Pressable>
          <Pressable
            className="items-center rounded-2xl border border-border bg-card px-4 py-4"
            disabled={isLoading}
            onPress={() => {
              void signUp().catch(() => {})
            }}
          >
            <Text className="text-base font-semibold text-foreground">
              Sign up
            </Text>
          </Pressable>
        </View>

        {error ? (
          <Text className="mt-4 text-sm font-normal text-destructive">
            {error}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  )
}
