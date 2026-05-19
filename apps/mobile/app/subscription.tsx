import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Check,
  CreditCard,
  ExternalLink,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../src/components/auth/AuthGate'
import { useCurrentUser } from '../src/hooks/useCurrentUser'
import type { ReactNode } from 'react'

const PLAN_URL = 'https://civicresearchhub.org/plans'
const BILLING_URL = 'https://civicresearchhub.org/settings'

const PLAN_FEATURES = [
  'Ad-free experience',
  'Advanced filters and saved searches',
  'Read receipts, appear offline, and custom status',
  'Create spots, meetups, group chats, and shared albums',
  'Auto-translate messages and use smart replies',
  'Boost credits, themes, and higher upload limits',
]

function formatDate(timestamp?: number | null): string | null {
  if (!timestamp) return null
  return new Date(timestamp).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function SubscriptionScreen() {
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const stats = useQuery(
    api.referrals.getReferralStats,
    user?._id ? {} : 'skip',
  )

  const effectiveTier = useMemo(() => {
    if (!user) return 'free'
    if ((user.referralUltraExpiresAt ?? 0) > Date.now()) return 'ultra'
    if (
      user.subscriptionStatus === 'active' &&
      (user.subscriptionTier === 'ultra' || user.subscriptionTier === 'pro')
    ) {
      return user.subscriptionTier
    }
    return 'free'
  }, [user])

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
        description="Sign in to manage your Civic Research Hub plan."
      />
    )
  }

  const referralExpiry = formatDate(stats?.referralUltraExpiresAt)
  const planLabel =
    effectiveTier === 'ultra'
      ? 'Ultra'
      : effectiveTier === 'pro'
        ? 'Pro'
        : 'Free'

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="rounded-2xl border border-border bg-card p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <Sparkles color="#F11A23" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold uppercase text-muted-foreground">
                Current plan
              </Text>
              <Text className="mt-1 text-2xl font-bold text-foreground">
                {planLabel}
              </Text>
            </View>
          </View>

          <Text className="mt-4 text-sm leading-6 text-muted-foreground">
            {effectiveTier === 'free'
              ? 'Core discovery, messaging, photos, spots, and The Barn are free.'
              : 'Your paid or referral benefits are active on mobile and web.'}
          </Text>

          {stats?.hasReferralUltra && referralExpiry ? (
            <View className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
              <Text className="text-sm font-semibold text-primary">
                Referral Ultra active
              </Text>
              <Text className="mt-1 text-xs text-muted-foreground">
                {stats.referralUltraDaysRemaining ?? 0} days remaining · Expires{' '}
                {referralExpiry}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mt-5 gap-3">
          <PlanCard
            title="Pro"
            price="$6/mo"
            icon={<Star color="#FAFAFA" size={18} />}
            description="Every feature except the large call minute bucket."
            bullets={[
              'All advanced app features',
              '2 boost credits/month',
              '5 call minutes/month',
              '25 GB storage',
            ]}
          />
          <PlanCard
            title="Ultra"
            price="$9/mo"
            icon={<Zap color="#FAFAFA" size={18} />}
            description="Everything in Pro, plus the full call allowance."
            bullets={[
              '300 call minutes/month',
              '4 boost credits/month',
              '30 GB storage',
              'Ultra profile badge',
            ]}
          />
        </View>

        <View className="mt-5 rounded-2xl border border-border bg-card p-4">
          <Text className="text-base font-semibold text-foreground">
            Paid features
          </Text>
          <View className="mt-3 gap-3">
            {PLAN_FEATURES.map((feature) => (
              <View key={feature} className="flex-row items-start gap-2">
                <Check color="#22c55e" size={16} />
                <Text className="flex-1 text-sm leading-5 text-muted-foreground">
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-5 gap-3">
          <Pressable
            onPress={() => void Linking.openURL(PLAN_URL)}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4"
          >
            <ExternalLink color="#FAFAFA" size={18} />
            <Text className="text-base font-semibold text-primary-foreground">
              Compare Plans on Web
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void Linking.openURL(BILLING_URL)}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-4"
          >
            <CreditCard color="#FAFAFA" size={18} />
            <Text className="text-base font-semibold text-foreground">
              Manage Billing
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function PlanCard({
  title,
  price,
  description,
  bullets,
  icon,
}: {
  title: string
  price: string
  description: string
  bullets: Array<string>
  icon: ReactNode
}) {
  return (
    <View className="rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary">
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{title}</Text>
          <Text className="text-sm text-muted-foreground">{description}</Text>
        </View>
        <Text className="text-base font-bold text-primary">{price}</Text>
      </View>
      <View className="mt-4 gap-2">
        {bullets.map((bullet) => (
          <View key={bullet} className="flex-row items-center gap-2">
            <Check color="#22c55e" size={15} />
            <Text className="text-sm text-muted-foreground">{bullet}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
