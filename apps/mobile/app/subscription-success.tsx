import { useEffect, useMemo, useState } from 'react'
import { useAction } from 'convex/react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BadgeCheck, Sparkles, Zap } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../src/components/auth/AuthGate'
import { useCurrentUser } from '../src/hooks/useCurrentUser'

type PaidPlan = 'pro' | 'ultra'

export default function SubscriptionSuccessScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ plan?: string }>()
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const syncBilling = useAction(api.members.syncBillingFromAutumn)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncAttempted, setSyncAttempted] = useState(false)

  const purchasedPlan = useMemo<PaidPlan>(() => {
    return params.plan === 'pro' ? 'pro' : 'ultra'
  }, [params.plan])
  const hasPaidAccess =
    user?.subscriptionStatus === 'active' &&
    (user.subscriptionTier === 'pro' || user.subscriptionTier === 'ultra')

  useEffect(() => {
    if (!isAuthenticated || hasPaidAccess || syncAttempted) return

    let canceled = false
    setIsSyncing(true)
    setSyncAttempted(true)

    const run = async () => {
      const startedAt = Date.now()
      while (!canceled && Date.now() - startedAt <= 30_000) {
        try {
          const result = await syncBilling({})
          if (result.hasUltra || result.grantedBoostCredits > 0) return
        } catch {
          // Keep polling for eventual consistency after the billing redirect.
        }

        await new Promise((resolve) => {
          setTimeout(resolve, 1500)
        })
      }
    }

    void run().finally(() => {
      if (!canceled) setIsSyncing(false)
    })

    return () => {
      canceled = true
    }
  }, [hasPaidAccess, isAuthenticated, syncAttempted, syncBilling])

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#F11A23" size="large" />
      </SafeAreaView>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate
        title="Subscription"
        description="Sign in to sync your subscription."
      />
    )
  }

  const planLabel = purchasedPlan === 'pro' ? 'Pro' : 'Ultra'
  const Icon = purchasedPlan === 'pro' ? BadgeCheck : Zap

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary">
          <Icon color="#FAFAFA" size={40} />
        </View>
        <Text className="mt-6 text-center text-3xl font-bold text-foreground">
          {hasPaidAccess ? `You're ${planLabel}` : `Finalizing ${planLabel}`}
        </Text>
        <Text className="mt-3 text-center text-base leading-6 text-muted-foreground">
          {hasPaidAccess
            ? `Your ${planLabel} features are active on mobile and web.`
            : 'Payment was submitted. We are syncing your account now.'}
        </Text>

        <View className="mt-8 w-full rounded-2xl border border-border bg-card p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Sparkles color="#F11A23" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                Premium access
              </Text>
              <Text className="mt-1 text-sm leading-5 text-muted-foreground">
                Advanced filters, read receipts, smart replies, call minutes,
                storage, boosts, and more.
              </Text>
            </View>
          </View>
          {isSyncing ? (
            <View className="mt-5 flex-row items-center justify-center gap-2">
              <ActivityIndicator color="#F11A23" />
              <Text className="text-sm text-muted-foreground">
                Checking subscription status...
              </Text>
            </View>
          ) : null}
        </View>

        <Pressable
          className="mt-8 w-full rounded-2xl bg-primary px-4 py-4"
          onPress={() => router.replace('/(tabs)/members' as never)}
        >
          <Text className="text-center text-base font-semibold text-primary-foreground">
            Browse members
          </Text>
        </Pressable>
        <Pressable
          className="mt-3 w-full rounded-2xl border border-border px-4 py-4"
          onPress={() => router.replace('/subscription' as never)}
        >
          <Text className="text-center text-base font-semibold text-foreground">
            View subscription
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
