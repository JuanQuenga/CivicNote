import { useMutation, useQuery } from 'convex/react'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  AlertTriangle,
  CheckCircle,
  Scale,
  ShieldAlert,
  UserX,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../src/components/auth/AuthGate'
import { useCurrentUser } from '../src/hooks/useCurrentUser'
import type { Id } from '@/src/lib/convexApi'

type ModerationNotification = {
  _id: Id<'moderationNotifications'>
  type: 'warning' | 'suspension' | 'ban' | 'appeal_accepted' | 'appeal_rejected'
  reason?: string
  suspendedUntil?: number
  warningNumber?: number
  createdAt: number
  readAt?: number
  appealId?: Id<'appeals'>
}

export default function ModerationNotificationsScreen() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const notifications = useQuery(
    api.moderation.getModerationNotifications,
    user?._id ? { limit: 50 } : 'skip',
  ) as Array<ModerationNotification> | undefined
  const unread = useQuery(
    api.moderation.getUnreadModerationNotifications,
    user?._id ? {} : 'skip',
  ) as Array<ModerationNotification> | undefined
  const markRead = useMutation(api.moderation.markModerationNotificationRead)
  const markAllRead = useMutation(
    api.moderation.markAllModerationNotificationsRead,
  )

  const handleMarkRead = async (
    notificationId: Id<'moderationNotifications'>,
  ) => {
    if (!user?._id) return
    try {
      await markRead({ notificationId })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not mark as read'
      Alert.alert('Update failed', message)
    }
  }

  const handleMarkAllRead = async () => {
    if (!user?._id) return
    try {
      await markAllRead({})
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not mark all as read'
      Alert.alert('Update failed', message)
    }
  }

  if (isLoading || (user?._id && notifications === undefined)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#F11A23" size="large" />
      </SafeAreaView>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate
        title="Moderation"
        description="Sign in to review moderation updates."
      />
    )
  }

  const unreadCount = unread?.length ?? 0

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <FlatList
        data={notifications ?? []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View className="mb-5 rounded-2xl border border-border bg-card p-5">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
                <ShieldAlert color="#F11A23" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold uppercase text-muted-foreground">
                  Account Updates
                </Text>
                <Text className="mt-1 text-2xl font-bold text-foreground">
                  Moderation
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground">
                  {unreadCount} unread notification
                  {unreadCount === 1 ? '' : 's'}
                </Text>
              </View>
            </View>
            <View className="mt-5 flex-row gap-2">
              <Pressable
                className="flex-1 rounded-2xl bg-primary px-4 py-3"
                onPress={() => router.push('/appeal' as never)}
              >
                <Text className="text-center text-sm font-semibold text-primary-foreground">
                  Appeals
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-2xl border border-border px-4 py-3"
                onPress={() => void handleMarkAllRead()}
              >
                <Text className="text-center text-sm font-semibold text-foreground">
                  Mark all read
                </Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="rounded-2xl border border-border bg-card p-5">
            <Text className="text-center text-sm text-muted-foreground">
              No moderation notifications.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onMarkRead={() => void handleMarkRead(item._id)}
            onOpenAppeal={() => router.push('/appeal' as never)}
          />
        )}
      />
    </SafeAreaView>
  )
}

function NotificationCard({
  notification,
  onMarkRead,
  onOpenAppeal,
}: {
  notification: ModerationNotification
  onMarkRead: () => void
  onOpenAppeal: () => void
}) {
  const Icon = getNotificationIcon(notification.type)
  const title = getNotificationTitle(notification)
  const unread = !notification.readAt

  return (
    <View
      className={`mb-4 rounded-2xl border p-4 ${
        unread ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <Icon color="#F11A23" size={20} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-base font-semibold text-foreground">
              {title}
            </Text>
            {unread ? (
              <View className="rounded-full bg-primary px-2 py-1">
                <Text className="text-xs font-semibold text-primary-foreground">
                  New
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-1 text-xs text-muted-foreground">
            {new Date(notification.createdAt).toLocaleDateString()}
          </Text>
          {notification.reason ? (
            <Text className="mt-3 text-sm leading-6 text-foreground">
              {notification.reason}
            </Text>
          ) : null}
          {notification.suspendedUntil ? (
            <Text className="mt-2 text-sm text-muted-foreground">
              Suspension ends{' '}
              {new Date(notification.suspendedUntil).toLocaleDateString()}.
            </Text>
          ) : null}
        </View>
      </View>

      <View className="mt-4 flex-row gap-2">
        {unread ? (
          <Pressable
            className="flex-1 rounded-xl border border-border bg-background px-3 py-3"
            onPress={onMarkRead}
          >
            <Text className="text-center text-sm font-semibold text-foreground">
              Mark read
            </Text>
          </Pressable>
        ) : null}
        {notification.type === 'ban' ||
        notification.type === 'suspension' ||
        notification.type.startsWith('appeal_') ? (
          <Pressable
            className="flex-1 rounded-xl bg-primary px-3 py-3"
            onPress={onOpenAppeal}
          >
            <Text className="text-center text-sm font-semibold text-primary-foreground">
              View appeals
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

function getNotificationIcon(type: ModerationNotification['type']) {
  if (type === 'warning') return AlertTriangle
  if (type === 'ban') return UserX
  if (type === 'suspension') return ShieldAlert
  if (type === 'appeal_accepted') return CheckCircle
  return Scale
}

function getNotificationTitle(notification: ModerationNotification) {
  if (notification.type === 'warning') {
    return notification.warningNumber
      ? `Warning ${notification.warningNumber}`
      : 'Account warning'
  }
  if (notification.type === 'suspension') return 'Account suspended'
  if (notification.type === 'ban') return 'Account banned'
  if (notification.type === 'appeal_accepted') return 'Appeal accepted'
  return 'Appeal rejected'
}
