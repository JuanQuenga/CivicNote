import { useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Clock,
  ExternalLink,
  Phone,
  PhoneOff,
  Sparkles,
  Video,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../src/components/auth/AuthGate'
import { Avatar } from '../src/components/ui/Avatar'
import { useCurrentUser } from '../src/hooks/useCurrentUser'
import type { ReactNode } from 'react'

const WEB_MESSAGES_URL = 'https://civicresearchhub.org/messages'

function formatMinutes(seconds: number | undefined): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(seconds ?? 0, 0) : 0
  return `${Math.floor(safeSeconds / 60)} min`
}

function formatResetDate(timestamp?: number | null): string | null {
  if (!timestamp) return null
  return new Date(timestamp).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function CallsScreen() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const callCredits = useQuery(api.callSessions.getCallCredits)
  const activeCall = useQuery(api.callSessions.getMyActiveCall)
  const answerCall = useMutation(api.callSessions.answerCall)
  const declineCall = useMutation(api.callSessions.declineCall)
  const endCall = useMutation(api.callSessions.endCall)
  const leaveCall = useMutation(api.callSessions.leaveCall)

  const openActiveCallOnWeb = useCallback(() => {
    if (!activeCall?.conversationId) return
    const encodedConversationId = encodeURIComponent(activeCall.conversationId)
    void Linking.openURL(
      `${WEB_MESSAGES_URL}?conversation=${encodedConversationId}`,
    )
  }, [activeCall?.conversationId])

  const handleAnswer = useCallback(async () => {
    if (!activeCall) return
    try {
      await answerCall({ callSessionId: activeCall._id })
      Alert.alert(
        'Call answered',
        'Continue on web to join the live audio/video room.',
        [
          { text: 'Stay Here', style: 'cancel' },
          { text: 'Open Web', onPress: openActiveCallOnWeb },
        ],
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to answer call'
      Alert.alert('Call failed', message)
    }
  }, [activeCall, answerCall, openActiveCallOnWeb])

  const handleEnd = useCallback(async () => {
    if (!activeCall || !user?._id) return
    try {
      if (activeCall.status === 'ringing') {
        if (activeCall.initiatorId === user._id) {
          await endCall({ callSessionId: activeCall._id })
        } else {
          await declineCall({ callSessionId: activeCall._id })
        }
        return
      }

      await leaveCall({ callSessionId: activeCall._id })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to end call'
      Alert.alert('Call failed', message)
    }
  }, [activeCall, declineCall, endCall, leaveCall, user?._id])

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
        title="Calls"
        description="Sign in to view call minutes and active calls."
      />
    )
  }

  const isInitiator = activeCall?.initiatorId === user._id
  const resetDate = formatResetDate(callCredits?.resetsAt)

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="rounded-2xl border border-border bg-card p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <Clock color="#F11A23" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold uppercase text-muted-foreground">
                Call minutes
              </Text>
              <Text className="mt-1 text-2xl font-bold text-foreground">
                {callCredits
                  ? formatMinutes(callCredits.remainingSec)
                  : 'Loading'}
              </Text>
            </View>
          </View>

          {callCredits ? (
            <View className="mt-5 flex-row gap-3">
              <CreditStat
                icon={<Phone color="#F11A23" size={18} />}
                label="Audio"
                value={formatMinutes(callCredits.audioRemainingSec)}
              />
              <CreditStat
                icon={<Video color="#F11A23" size={18} />}
                label="Video"
                value={formatMinutes(callCredits.videoRemainingSec)}
              />
            </View>
          ) : (
            <View className="mt-5 items-center py-4">
              <ActivityIndicator color="#F11A23" />
            </View>
          )}

          {callCredits ? (
            <Text className="mt-4 text-sm leading-6 text-muted-foreground">
              {callCredits.isUltra
                ? 'Ultra call minutes are active for this account.'
                : 'Upgrade to Ultra for the larger monthly call minute bucket.'}
              {resetDate ? ` Included minutes reset ${resetDate}.` : ''}
            </Text>
          ) : null}
        </View>

        {activeCall ? (
          <View className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-5">
            <View className="flex-row items-center gap-3">
              <Avatar
                imageUrl={activeCall.otherParticipantImageUrl ?? undefined}
                name={activeCall.otherParticipantName ?? 'Caller'}
                size="md"
              />
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  {activeCall.type === 'video' ? 'Video call' : 'Audio call'}
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground">
                  {activeCall.status === 'ringing'
                    ? isInitiator
                      ? `Ringing ${activeCall.otherParticipantName ?? 'participant'}`
                      : `${activeCall.otherParticipantName ?? 'Someone'} is calling`
                    : 'Call is active'}
                </Text>
              </View>
            </View>

            <View className="mt-4 gap-3">
              {!isInitiator && activeCall.status === 'ringing' ? (
                <Pressable
                  className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4"
                  onPress={() => void handleAnswer()}
                >
                  <Phone color="#FAFAFA" size={18} />
                  <Text className="text-base font-semibold text-primary-foreground">
                    Answer
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-4"
                onPress={openActiveCallOnWeb}
              >
                <ExternalLink color="#FAFAFA" size={18} />
                <Text className="text-base font-semibold text-foreground">
                  Open Live Room on Web
                </Text>
              </Pressable>
              <Pressable
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-4"
                onPress={() => void handleEnd()}
              >
                <PhoneOff color="#DC2626" size={18} />
                <Text className="text-base font-semibold text-destructive">
                  {activeCall.status === 'ringing' && !isInitiator
                    ? 'Decline'
                    : 'End Call'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="mt-5 rounded-2xl border border-border bg-card p-5">
            <Text className="text-base font-semibold text-foreground">
              No active call
            </Text>
            <Text className="mt-2 text-sm leading-6 text-muted-foreground">
              Start audio or video calls from a conversation. Mobile currently
              manages call state and minutes, then hands the live room to web.
            </Text>
          </View>
        )}

        <Pressable
          className="mt-5 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4"
          onPress={() => router.push('/subscription' as never)}
        >
          <Sparkles color="#FAFAFA" size={18} />
          <Text className="text-base font-semibold text-primary-foreground">
            Manage Subscription
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function CreditStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-background p-4">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </Text>
      </View>
      <Text className="mt-3 text-xl font-bold text-foreground">{value}</Text>
    </View>
  )
}
