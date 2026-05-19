import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Award,
  Check,
  Gift,
  Share2,
  Star,
  Trophy,
  Zap,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../src/components/auth/AuthGate'
import { useCurrentUser } from '../src/hooks/useCurrentUser'
import { formatTimeAgo } from '../src/lib/format'

const MILESTONES = [
  { threshold: 1, label: 'Piglet', reward: '1 week Ultra', icon: Star },
  { threshold: 3, label: 'Snout', reward: '1 month Ultra', icon: Zap },
  { threshold: 10, label: 'Trotter', reward: '2 months Ultra', icon: Award },
  { threshold: 25, label: 'Prize Pig', reward: '3 months Ultra', icon: Trophy },
  { threshold: 50, label: 'Top Hog', reward: '6 months Ultra', icon: Trophy },
] as const

export default function ReferralsScreen() {
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const [isGenerating, setIsGenerating] = useState(false)
  const hasTriedGenerate = useRef(false)

  const stats = useQuery(
    api.referrals.getReferralStats,
    user?._id ? {} : 'skip',
  )
  const history = useQuery(
    api.referrals.getReferralHistory,
    user?._id ? {} : 'skip',
  )
  const generateCode = useMutation(api.referrals.generateReferralCode)
  const logEvent = useMutation(api.referrals.logReferralEvent)

  useEffect(() => {
    if (
      user?._id &&
      stats !== undefined &&
      !stats.referralCode &&
      !hasTriedGenerate.current
    ) {
      hasTriedGenerate.current = true
      generateCode({}).catch(() => {
        hasTriedGenerate.current = false
      })
    }
  }, [generateCode, stats, user?._id])

  const referralLink = useMemo(
    () =>
      stats?.referralCode
        ? `https://civicresearchhub.org/join/${stats.referralCode}`
        : null,
    [stats?.referralCode],
  )

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
        title="Referrals"
        description="Sign in to share your referral code."
      />
    )
  }

  const isReferralLoading = stats === undefined || history === undefined

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      await generateCode({})
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not generate code'
      Alert.alert('Referral failed', message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = async () => {
    if (!stats?.referralCode || !referralLink) return

    try {
      await Share.share({
        title: 'Join Civic Research Hub',
        message: `Join me on Civic Research Hub: ${referralLink}`,
      })
      void logEvent({
        referralCode: stats.referralCode,
        eventType: 'link_generated',
        metadata: { shareMethod: 'native_share' },
      })
    } catch {
      // Native share can be cancelled.
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text className="text-xs font-semibold uppercase tracking-widest text-primary">
          Referral Program
        </Text>
        <Text className="mt-2 text-3xl font-bold text-foreground">
          Bring the boys.
        </Text>
        <Text className="mt-1 text-3xl font-bold text-primary">
          Get rewarded.
        </Text>
        <Text className="mt-3 text-sm leading-5 text-muted-foreground">
          Share your code, invite friends to Civic Research Hub, and earn free Ultra when
          they stick around for 7 days.
        </Text>

        {isReferralLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#F11A23" />
          </View>
        ) : (
          <>
            <View className="mt-6 flex-row overflow-hidden rounded-2xl border border-border bg-card">
              <Stat
                label="Invited"
                value={stats.totalReferrals}
                color="text-foreground"
              />
              <Stat
                label="Pending"
                value={stats.pendingReferrals}
                color="text-yellow-500"
              />
              <Stat
                label="Activated"
                value={stats.activatedReferrals}
                color="text-green-500"
              />
            </View>

            {stats.hasReferralUltra && stats.referralUltraDaysRemaining ? (
              <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <View className="flex-row items-center gap-3">
                  <Gift color="#F11A23" size={22} />
                  <Text className="text-base font-semibold text-primary">
                    Ultra active
                  </Text>
                </View>
                <Text className="text-sm text-muted-foreground">
                  {stats.referralUltraDaysRemaining}d left
                </Text>
              </View>
            ) : null}

            <View className="mt-5 rounded-2xl border border-border bg-card p-4">
              <Text className="text-xs font-semibold uppercase text-muted-foreground">
                Your Code
              </Text>
              {stats.referralCode ? (
                <>
                  <View className="mt-4 rounded-xl border border-border bg-muted/40 px-4 py-5">
                    <Text className="text-center font-mono text-3xl font-bold tracking-widest text-foreground">
                      {stats.referralCode}
                    </Text>
                  </View>
                  <Pressable
                    className="mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4"
                    onPress={() => void handleShare()}
                  >
                    <Share2 color="#FAFAFA" size={18} />
                    <Text className="text-sm font-semibold text-primary-foreground">
                      Share Invite
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  className="mt-4 rounded-xl bg-primary px-4 py-4"
                  disabled={isGenerating}
                  onPress={() => void handleGenerate()}
                >
                  <Text className="text-center text-sm font-semibold text-primary-foreground">
                    {isGenerating ? 'Generating...' : 'Generate Code'}
                  </Text>
                </Pressable>
              )}
            </View>

            <View className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
              <View className="border-b border-border px-4 py-3">
                <Text className="text-xs font-semibold uppercase text-muted-foreground">
                  Rewards
                </Text>
              </View>
              <View className="p-4">
                {MILESTONES.map((milestone) => {
                  const Icon = milestone.icon
                  const isEarned = stats.currentCredits >= milestone.threshold
                  return (
                    <View
                      key={milestone.threshold}
                      className="mb-4 flex-row items-center gap-3 last:mb-0"
                    >
                      <View
                        className={`h-9 w-9 items-center justify-center rounded-full border ${
                          isEarned
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        {isEarned ? (
                          <Check color="#22c55e" size={16} />
                        ) : (
                          <Icon color="#999999" size={16} />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">
                          {milestone.label}
                        </Text>
                        <Text className="mt-0.5 text-xs text-muted-foreground">
                          {milestone.threshold} referral
                          {milestone.threshold === 1 ? '' : 's'} ·{' '}
                          {milestone.reward}
                        </Text>
                      </View>
                      <Text
                        className={`text-xs font-semibold ${
                          isEarned ? 'text-green-500' : 'text-muted-foreground'
                        }`}
                      >
                        {isEarned
                          ? 'Earned'
                          : `${stats.currentCredits}/${milestone.threshold}`}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>

            <View className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
              <View className="border-b border-border px-4 py-3">
                <Text className="text-xs font-semibold uppercase text-muted-foreground">
                  Your Referrals
                </Text>
              </View>
              {history.length === 0 ? (
                <View className="p-4">
                  <Text className="text-sm text-muted-foreground">
                    No referrals yet. Share your code to get started.
                  </Text>
                </View>
              ) : (
                history.map((referral: any) => (
                  <View
                    key={referral._id}
                    className="flex-row items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <Gift color="#999999" size={16} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        {referral.referredUserName}
                      </Text>
                      <Text className="mt-0.5 text-xs text-muted-foreground">
                        {formatTimeAgo(referral.createdAt)}
                      </Text>
                    </View>
                    <Text
                      className={`text-xs font-semibold capitalize ${
                        referral.status === 'activated'
                          ? 'text-green-500'
                          : referral.status === 'pending'
                            ? 'text-yellow-500'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {referral.status === 'pending' &&
                      referral.daysUntilActivation
                        ? `${referral.daysUntilActivation}d`
                        : referral.status}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Stat({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <View className="flex-1 border-r border-border px-2 py-4 last:border-r-0">
      <Text className={`text-center text-2xl font-bold ${color}`}>{value}</Text>
      <Text className="mt-1 text-center text-xs uppercase text-muted-foreground">
        {label}
      </Text>
    </View>
  )
}
