import { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CheckCircle, Clock, FileText, Scale, Send } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../src/components/auth/AuthGate'
import { useCurrentUser } from '../src/hooks/useCurrentUser'

type AppealType = 'ban' | 'suspension' | 'warning'

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending review'
    case 'under_review':
      return 'Under review'
    case 'accepted':
      return 'Accepted'
    case 'rejected':
      return 'Rejected'
    default:
      return status.replace('_', ' ')
  }
}

function getAppealTypeLabel(type: string): string {
  switch (type) {
    case 'ban':
      return 'Ban Appeal'
    case 'suspension':
      return 'Suspension Appeal'
    case 'warning':
      return 'Warning Appeal'
    default:
      return 'Appeal'
  }
}

export default function AppealScreen() {
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const [reason, setReason] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmitResult = useQuery(
    api.moderation.canSubmitAppeal,
    user?._id ? {} : 'skip',
  )
  const appeals = useQuery(
    api.moderation.getUserAppeals,
    user?._id ? {} : 'skip',
  )
  const submitAppeal = useMutation(api.moderation.submitAppeal)

  const appealType = useMemo<AppealType | null>(() => {
    if (!user) return null
    if (user.isBanned) return 'ban'
    if (
      user.isSuspended &&
      user.suspendedUntil &&
      user.suspendedUntil > Date.now()
    ) {
      return 'suspension'
    }
    if ((user.warningCount ?? 0) > 0) return 'warning'
    return null
  }, [user])

  const handleSubmit = async () => {
    if (!user?._id || !appealType || !reason.trim()) {
      Alert.alert('Reason required', 'Provide a reason for your appeal.')
      return
    }

    try {
      setIsSubmitting(true)
      await submitAppeal({
        appealType,
        reason: reason.trim(),
        additionalInfo: additionalInfo.trim() || undefined,
      })
      setReason('')
      setAdditionalInfo('')
      Alert.alert('Appeal submitted', 'Your appeal is pending review.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to submit appeal'
      Alert.alert('Appeal failed', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || (user?._id && canSubmitResult === undefined)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#F11A23" size="large" />
      </SafeAreaView>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate
        title="Appeal"
        description="Sign in to review or submit moderation appeals."
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <FlatList
        data={appeals ?? []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <View className="rounded-2xl border border-border bg-card p-5">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
                  <Scale color="#F11A23" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold uppercase text-muted-foreground">
                    Moderation
                  </Text>
                  <Text className="mt-1 text-2xl font-bold text-foreground">
                    Submit Appeal
                  </Text>
                </View>
              </View>

              {!appealType ? (
                <View className="mt-5 flex-row items-start gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                  <CheckCircle color="#22c55e" size={20} />
                  <Text className="flex-1 text-sm leading-6 text-muted-foreground">
                    Your account has no active restrictions to appeal.
                  </Text>
                </View>
              ) : canSubmitResult?.canSubmit ? (
                <View className="mt-5 gap-3">
                  <Text className="text-sm font-semibold text-foreground">
                    {getAppealTypeLabel(appealType)}
                  </Text>
                  <TextInput
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Reason for appeal"
                    placeholderTextColor="#999999"
                    multiline
                    className="min-h-28 rounded-2xl border border-border bg-input px-4 py-3 text-base text-foreground"
                  />
                  <TextInput
                    value={additionalInfo}
                    onChangeText={setAdditionalInfo}
                    placeholder="Additional context"
                    placeholderTextColor="#999999"
                    multiline
                    className="min-h-24 rounded-2xl border border-border bg-input px-4 py-3 text-base text-foreground"
                  />
                  <Pressable
                    className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4"
                    disabled={isSubmitting}
                    onPress={() => void handleSubmit()}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Send color="#FAFAFA" size={18} />
                        <Text className="text-base font-semibold text-primary-foreground">
                          Submit Appeal
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View className="mt-5 flex-row items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <Clock color="#f59e0b" size={20} />
                  <Text className="flex-1 text-sm leading-6 text-muted-foreground">
                    {canSubmitResult?.reason ??
                      'You already have an appeal under review.'}
                  </Text>
                </View>
              )}
            </View>

            <Text className="mb-3 mt-6 text-xs font-semibold uppercase text-muted-foreground">
              Appeal History
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="rounded-2xl border border-border bg-card p-5">
            <Text className="text-sm text-muted-foreground">
              No appeals submitted yet.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-center gap-3">
              <FileText color="#F11A23" size={18} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  {getAppealTypeLabel(item.appealType)}
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground">
                  Submitted {formatDate(item.submittedAt)} ·{' '}
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
            <Text className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.reason}
            </Text>
            {item.adminResponse ? (
              <View className="mt-3 rounded-xl border border-border bg-background p-3">
                <Text className="text-xs font-semibold uppercase text-muted-foreground">
                  Response
                </Text>
                <Text className="mt-1 text-sm leading-5 text-foreground">
                  {item.adminResponse}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  )
}
