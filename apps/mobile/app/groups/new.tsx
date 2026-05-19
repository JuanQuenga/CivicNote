import { useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import { useRouter } from 'expo-router'
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
import { Check, Users } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../../src/components/auth/AuthGate'
import { Avatar } from '../../src/components/ui/Avatar'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import type { Id } from '@/src/lib/convexApi'

type Partner = {
  _id: Id<'users'>
  name: string
  imageUrl?: string
  isOnline?: boolean
}

export default function NewGroupScreen() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const [groupName, setGroupName] = useState('')
  const [search, setSearch] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<Id<'users'>>>(
    new Set(),
  )
  const [isCreating, setIsCreating] = useState(false)

  const partners = useQuery(
    api.messages.getRecentInteractionPartners,
    user?._id ? { limit: 50 } : 'skip',
  ) as Array<Partner> | undefined
  const createGroupChat = useAction(api.groupChats.createGroupChat)

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#F11A23" size="large" />
      </SafeAreaView>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate title="New Group" description="Sign in to create groups." />
    )
  }

  const filteredPartners =
    partners?.filter((partner) =>
      partner.name.toLowerCase().includes(search.trim().toLowerCase()),
    ) ?? []

  const toggleUser = (userId: Id<'users'>) => {
    setSelectedUserIds((current) => {
      const next = new Set(current)
      if (next.has(userId)) {
        next.delete(userId)
      } else if (next.size < 24) {
        next.add(userId)
      } else {
        Alert.alert('Group limit', 'Groups can have up to 25 members.')
      }
      return next
    })
  }

  const handleCreate = async () => {
    const trimmedName = groupName.trim()
    if (!trimmedName) {
      Alert.alert('Name required', 'Enter a group name.')
      return
    }
    if (selectedUserIds.size < 2) {
      Alert.alert('Members required', 'Select at least two other members.')
      return
    }

    try {
      setIsCreating(true)
      const conversationId = await createGroupChat({
        name: trimmedName,
        participantIds: [...selectedUserIds],
      })
      router.replace(
        `/(tabs)/messages/conversations/${conversationId}` as never,
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not create group'
      Alert.alert('Group failed', message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="border-b border-border px-4 pb-4 pt-3">
        <Text className="text-2xl font-bold text-foreground">New Group</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Create a group conversation with recent chat partners.
        </Text>
        <TextInput
          value={groupName}
          onChangeText={(value) => setGroupName(value.slice(0, 50))}
          placeholder="Group name"
          placeholderTextColor="#999999"
          className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search recent members"
          placeholderTextColor="#999999"
          className="mt-3 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
        />
        <Text className="mt-3 text-xs font-semibold text-muted-foreground">
          {selectedUserIds.size + 1}/25 members
        </Text>
      </View>

      <FlatList
        data={filteredPartners}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={
          partners === undefined ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#F11A23" />
            </View>
          ) : (
            <View className="items-center py-12">
              <Users color="#999999" size={36} />
              <Text className="mt-3 text-center text-sm text-muted-foreground">
                Start messaging people to add them to groups.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const selected = selectedUserIds.has(item._id)
          return (
            <Pressable
              className={`mb-3 flex-row items-center gap-3 rounded-2xl border p-4 ${
                selected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card'
              }`}
              onPress={() => toggleUser(item._id)}
            >
              <Avatar
                imageUrl={item.imageUrl}
                name={item.name}
                size="md"
                showOnlineIndicator
                isOnline={item.isOnline}
              />
              <Text className="flex-1 text-base font-semibold text-foreground">
                {item.name}
              </Text>
              <View
                className={`h-6 w-6 items-center justify-center rounded-full border ${
                  selected ? 'border-primary bg-primary' : 'border-border'
                }`}
              >
                {selected ? <Check color="#FAFAFA" size={15} /> : null}
              </View>
            </Pressable>
          )
        }}
      />

      <View className="absolute inset-x-0 bottom-0 border-t border-border bg-card p-4">
        <Pressable
          disabled={isCreating}
          className="items-center rounded-2xl bg-primary px-4 py-4"
          onPress={() => void handleCreate()}
        >
          {isCreating ? (
            <ActivityIndicator color="#FAFAFA" />
          ) : (
            <Text className="text-base font-semibold text-primary-foreground">
              Create Group
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
