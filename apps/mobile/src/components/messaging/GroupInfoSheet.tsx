import { useMutation, useQuery } from 'convex/react'
import { Crown, LogOut, Users, X } from 'lucide-react-native'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '@/src/lib/convexApi'
import { Avatar } from '../ui/Avatar'
import type { Id } from '@/src/lib/convexApi'

interface GroupInfoSheetProps {
  visible: boolean
  onClose: () => void
  conversationId: Id<'conversations'>
  currentUserId: Id<'users'>
  onLeft: () => void
}

type GroupMember = {
  _id: Id<'conversationMembers'>
  userId: Id<'users'>
  role: 'admin' | 'member'
  name: string
  imageUrl?: string
  isOnline?: boolean
}

export function GroupInfoSheet({
  visible,
  onClose,
  conversationId,
  currentUserId,
  onLeft,
}: GroupInfoSheetProps) {
  const groupInfo = useQuery(
    api.groupChats.getGroupInfo,
    visible ? { conversationId } : 'skip',
  )
  const members = useQuery(
    api.groupChats.getGroupMembers,
    visible ? { conversationId } : 'skip',
  ) as Array<GroupMember> | undefined

  const leaveGroup = useMutation(api.groupChats.leaveGroup)

  const handleLeave = () => {
    Alert.alert('Leave group?', 'You will stop receiving messages.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveGroup({ conversationId })
            onLeft()
            onClose()
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Could not leave group'
            Alert.alert('Leave failed', message)
          }
        },
      },
    ])
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Pressable
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-full"
          >
            <X size={20} color="#FAFAFA" />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">
            Group info
          </Text>
          <View className="w-9" />
        </View>

        <FlatList
          data={members ?? []}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={
            <View className="items-center px-6 pb-6 pt-8">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/15">
                <Users size={32} color="#F11A23" />
              </View>
              <Text className="mt-4 text-xl font-bold text-foreground">
                {groupInfo?.name ?? 'Group'}
              </Text>
              {groupInfo?.description ? (
                <Text className="mt-2 text-center text-sm text-muted-foreground">
                  {groupInfo.description}
                </Text>
              ) : null}
              <Text className="mt-3 text-xs text-muted-foreground">
                {groupInfo?.memberCount ?? '—'} members
              </Text>

              <View className="mt-6 w-full">
                <Text className="text-xs font-semibold uppercase text-muted-foreground">
                  Members
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            members === undefined ? (
              <View className="mt-12 items-center">
                <ActivityIndicator color="#F11A23" />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View className="mx-4 mb-1 flex-row items-center gap-3 rounded-xl px-2 py-2.5">
              <Avatar
                imageUrl={item.imageUrl}
                name={item.name}
                size="md"
                showOnlineIndicator
                isOnline={item.isOnline}
              />
              <View className="flex-1">
                <Text
                  className="text-base font-medium text-foreground"
                  numberOfLines={1}
                >
                  {item.name}
                  {item.userId === currentUserId ? ' (You)' : ''}
                </Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">
                  {item.role === 'admin' ? 'Admin' : 'Member'}
                </Text>
              </View>
              {item.role === 'admin' ? (
                <Crown size={16} color="#f59e0b" />
              ) : null}
            </View>
          )}
          ListFooterComponent={
            <View className="mx-4 mt-6">
              <Pressable
                onPress={handleLeave}
                className="flex-row items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3.5"
              >
                <LogOut size={16} color="#DC2626" />
                <Text className="text-sm font-semibold text-destructive">
                  Leave group
                </Text>
              </Pressable>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  )
}
