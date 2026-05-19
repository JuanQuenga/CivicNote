import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Gift, Sparkles, Users } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { storeReferralCode } from '../../src/lib/referralStorage'
import { useWorkOSAuth } from '../../src/lib/workosAuth'

export default function JoinReferralScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ referralCode?: string }>()
  const { isAuthenticated, isLoading: userLoading } = useCurrentUser()
  const { signIn, signUp } = useWorkOSAuth()
  const [isAuthStarting, setIsAuthStarting] = useState(false)

  const referralCode = useMemo(() => {
    const raw = Array.isArray(params.referralCode)
      ? params.referralCode[0]
      : params.referralCode
    return raw?.trim().toUpperCase() ?? ''
  }, [params.referralCode])

  const referrer = useQuery(
    api.referrals.getReferrerByCode,
    referralCode ? { referralCode } : 'skip',
  )

  useEffect(() => {
    if (!referralCode) return
    void storeReferralCode(referralCode)
  }, [referralCode])

  useEffect(() => {
    if (!userLoading && isAuthenticated) {
      router.replace('/(tabs)/members' as never)
    }
  }, [isAuthenticated, router, userLoading])

  const startAuth = async (mode: 'sign-in' | 'sign-up') => {
    if (!referralCode) return
    setIsAuthStarting(true)
    try {
      await storeReferralCode(referralCode)
      if (mode === 'sign-in') {
        await signIn()
      } else {
        await signUp()
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Authentication failed'
      Alert.alert('Could not continue', message)
    } finally {
      setIsAuthStarting(false)
    }
  }

  if (!referralCode || referrer === undefined || userLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#F11A23" size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="flex-1 justify-center px-6">
        <View className="items-center">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary">
            <Gift color="#FAFAFA" size={40} />
          </View>
          <Text className="mt-6 text-center text-3xl font-bold text-foreground">
            You've been invited to Civic Research Hub
          </Text>
          <Text className="mt-3 text-center text-base leading-6 text-muted-foreground">
            Join the community and get 7 days of Ultra free.
          </Text>
        </View>

        <View className="mt-8 rounded-2xl border border-border bg-card p-5">
          <Text className="text-center text-base font-semibold text-foreground">
            What Ultra unlocks
          </Text>
          <View className="mt-5 gap-4">
            <BenefitRow
              icon={Users}
              label="Advanced filters and unlimited profile views"
            />
            <BenefitRow
              icon={Sparkles}
              label="Appear offline, smart replies, and more"
            />
          </View>
          <View
            className={`mt-5 rounded-2xl border px-4 py-3 ${
              referrer.isValid
                ? 'border-green-500/30 bg-green-500/10'
                : 'border-destructive/30 bg-destructive/10'
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                referrer.isValid ? 'text-green-500' : 'text-destructive'
              }`}
            >
              {referrer.isValid
                ? `Referral code ${referralCode} saved`
                : 'This referral code is no longer valid'}
            </Text>
          </View>
        </View>

        <Pressable
          className={`mt-8 rounded-2xl px-4 py-4 ${
            referrer.isValid && !isAuthStarting ? 'bg-primary' : 'bg-muted'
          }`}
          disabled={!referrer.isValid || isAuthStarting}
          onPress={() => void startAuth('sign-up')}
        >
          <Text className="text-center text-base font-semibold text-primary-foreground">
            {isAuthStarting ? 'Opening Auth...' : 'Join Civic Research Hub Free'}
          </Text>
        </Pressable>
        <Pressable
          className="mt-3 rounded-2xl border border-border px-4 py-4"
          disabled={isAuthStarting}
          onPress={() => void startAuth('sign-in')}
        >
          <Text className="text-center text-base font-semibold text-foreground">
            I already have an account
          </Text>
        </Pressable>

        <Text className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          By joining, you agree to the Civic Research Hub Terms of Service and Privacy
          Policy.
        </Text>
      </View>
    </SafeAreaView>
  )
}

function BenefitRow({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ color: string; size: number }>
  label: string
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
        <Icon color="#F11A23" size={18} />
      </View>
      <Text className="flex-1 text-sm leading-5 text-muted-foreground">
        {label}
      </Text>
    </View>
  )
}
