import { useMutation, useQuery } from 'convex/react'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { UserX } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../src/components/auth/AuthGate'
import { Avatar } from '../src/components/ui/Avatar'
import { useCurrentUser } from '../src/hooks/useCurrentUser'
import { formatTimeAgo } from '../src/lib/format'
import type { Id } from '@/src/lib/convexApi'

type BlockedUser = {
  _id: Id<'blockedUsers'>
  blockedUser: {
    _id: Id<'users'>
    name: string
    imageUrl?: string
  }
  blockedAt: number
}

export default function BlockedUsersScreen() {
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const unblockUser = useMutation(api.members.unblockUser)
  const blockedUsers = useQuery(
    api.members.getBlockedUsers,
    user?._id ? {} : 'skip',
  ) as Array<BlockedUser> | undefined

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
        title="Blocked Users"
        description="Sign in to manage blocked users."
      />
    )
  }

  const handleUnblock = async (blockedUserId: Id<'users'>, name: string) => {
    try {
      await unblockUser({ blockedId: blockedUserId })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed to unblock ${name}`
      Alert.alert('Unblock failed', message)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-4" edges={['bottom']}>
      {blockedUsers === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#F11A23" />
        </View>
      ) : blockedUsers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
            <UserX color="#999999" size={30} />
          </View>
          <Text className="mt-4 text-lg font-semibold text-foreground">
            No blocked users
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-muted-foreground">
            When you block someone, they will appear here. You can unblock them
            at any time.
          </Text>
        </View>
      ) : (
        <View className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          {blockedUsers.map((blocked) => (
            <View
              key={blocked._id}
              className="flex-row items-center gap-3 border-b border-border/60 p-4 last:border-b-0"
            >
              <Avatar
                imageUrl={blocked.blockedUser.imageUrl}
                name={blocked.blockedUser.name}
                size="md"
              />
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  {blocked.blockedUser.name}
                </Text>
                <Text className="mt-0.5 text-sm text-muted-foreground">
                  Blocked {formatTimeAgo(blocked.blockedAt)}
                </Text>
              </View>
              <Pressable
                className="rounded-xl border border-border bg-background px-3 py-2"
                onPress={() =>
                  void handleUnblock(
                    blocked.blockedUser._id,
                    blocked.blockedUser.name,
                  )
                }
              >
                <Text className="text-sm font-semibold text-foreground">
                  Unblock
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  )
}
