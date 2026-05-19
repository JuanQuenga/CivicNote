import { usePaginatedQuery, useQuery } from 'convex/react'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Search as SearchIcon, Users, X } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../../../src/components/auth/AuthGate'
import { CreateGroupSheet } from '../../../src/components/messaging/CreateGroupSheet'
import { MobileTabbedPager } from '../../../src/components/navigation/MobileTabbedPager'
import { Avatar } from '../../../src/components/ui/Avatar'
import { useCurrentUser } from '../../../src/hooks/useCurrentUser'
import { formatTimeAgo } from '../../../src/lib/format'
import type { Id } from '@/src/lib/convexApi'

type ConversationListItem = {
  _id: string
  type?: 'direct' | 'group' | 'meetup'
  groupName?: string
  groupAvatarUrl?: string
  otherParticipant: {
    _id: string
    name: string
    imageUrl?: string
    isOnline?: boolean
  }
  lastMessage: { content: string; format: string; senderId: string } | null
  lastMessageTime?: number
  unreadCount: number
}

type ConversationFilter = 'all' | 'friends' | 'unread' | 'groups'

const MESSAGE_TABS: Array<{ value: ConversationFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'friends', label: 'Friends' },
  { value: 'unread', label: 'Unread' },
  { value: 'groups', label: 'Groups' },
]

const MOBILE_MESSAGES_CACHE_TTL_MS = 2 * 60 * 1000

let mobileMessagesCache: {
  key: string
  conversations: Array<ConversationListItem>
  cachedAt: number
} | null = null

const getCachedMobileConversations = (key: string) => {
  if (!mobileMessagesCache) return []
  const isExpired =
    Date.now() - mobileMessagesCache.cachedAt > MOBILE_MESSAGES_CACHE_TTL_MS
  if (isExpired) return []
  return mobileMessagesCache.key === key
    ? mobileMessagesCache.conversations
    : []
}

const clearExpiredCache = () => {
  if (
    mobileMessagesCache &&
    Date.now() - mobileMessagesCache.cachedAt > MOBILE_MESSAGES_CACHE_TTL_MS
  ) {
    mobileMessagesCache = null
  }
}

const cacheMobileConversations = (
  key: string,
  conversations: Array<ConversationListItem>,
) => {
  mobileMessagesCache = {
    key,
    conversations,
    cachedAt: Date.now(),
  }
}

function getLastMessagePreview(
  message: { content: string; format: string; senderId: string } | null,
  currentUserId: string,
) {
  if (!message) return 'No messages yet'

  const prefix = message.senderId === currentUserId ? 'You: ' : ''

  switch (message.format) {
    case 'image':
      return `${prefix}Sent a photo`
    case 'video':
      return `${prefix}Sent a video`
    case 'gif':
      return `${prefix}Sent a GIF`
    case 'voice':
      return `${prefix}Voice message`
    default:
      if (message.format === 'location') return `${prefix}Shared a location`
      if (message.format === 'album_share') return `${prefix}Shared an album`
      if (message.format === 'friend_request')
        return `${prefix}Sent a friend request`
      if (message.format === 'meetup_distance')
        return `${prefix}Sent a meetup distance request`
      if (message.format === 'spot_share') return `${prefix}Shared a spot`
      if (message.format === 'member_share') return `${prefix}Shared a member`
      if (message.format === 'system') return message.content
      return `${prefix}${message.content}`
  }
}

export default function MessagesScreen() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<ConversationFilter>('all')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  const { loadMore, results, status } = usePaginatedQuery(
    api.messages.listConversations,
    user?._id ? {} : 'skip',
    { initialNumItems: 20 },
  )
  const friends = useQuery(api.members.getFriends, user?._id ? {} : 'skip')

  const conversationsCacheKey = user?._id ?? 'guest'
  const cachedConversations = useMemo(
    () => getCachedMobileConversations(conversationsCacheKey),
    [conversationsCacheKey],
  )
  const hasCachedConversations =
    status === 'LoadingFirstPage' && cachedConversations.length > 0
  const conversations = hasCachedConversations
    ? cachedConversations
    : (results as Array<ConversationListItem>)
  const friendIds = useMemo(
    () =>
      new Set(
        ((friends ?? []) as Array<{ friend: { _id: string } }>).map(
          (friendship) => friendship.friend._id,
        ),
      ),
    [friends],
  )
  const getFilteredConversations = useMemo(() => {
    const tabConversations = (() => {
      return (tab: ConversationFilter) => {
        switch (tab) {
          case 'friends':
            return conversations.filter(
              (conversation) =>
                conversation.type !== 'group' &&
                conversation.type !== 'meetup' &&
                friendIds.has(conversation.otherParticipant._id),
            )
          case 'unread':
            return conversations.filter(
              (conversation) => conversation.unreadCount > 0,
            )
          case 'groups':
            return conversations.filter(
              (conversation) =>
                conversation.type === 'group' || conversation.type === 'meetup',
            )
          default:
            return conversations
        }
      }
    })()

    const query = search.trim().toLowerCase()
    return (tab: ConversationFilter) => {
      const filteredByTab = tabConversations(tab)
      if (query.length < 2) return filteredByTab

      return filteredByTab.filter((conversation) => {
        const isGroup =
          conversation.type === 'group' || conversation.type === 'meetup'
        const displayName = isGroup
          ? (conversation.groupName ?? 'Group')
          : conversation.otherParticipant.name
        const preview = getLastMessagePreview(
          conversation.lastMessage,
          user?._id ?? '',
        )

        return `${displayName} ${preview}`.toLowerCase().includes(query)
      })
    }
  }, [conversations, friendIds, search, user?._id])

  useEffect(() => {
    clearExpiredCache()
    if (status === 'LoadingFirstPage' || !results) return
    cacheMobileConversations(
      conversationsCacheKey,
      results as Array<ConversationListItem>,
    )
  }, [conversationsCacheKey, results, status])

  useEffect(() => {
    const searchSubscription = DeviceEventEmitter.addListener(
      'mobile-search:/messages',
      () => {
        setShowSearch((current) => !current)
      },
    )
    const createSubscription = DeviceEventEmitter.addListener(
      'mobile-create:/messages',
      () => {
        setShowCreateGroup(true)
      },
    )

    return () => {
      searchSubscription.remove()
      createSubscription.remove()
    }
  }, [])

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#F11A23" />
      </SafeAreaView>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate
        title="Messages"
        description="Sign in to view your conversations."
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['bottom']}>
      <MobileTabbedPager
        tabs={MESSAGE_TABS}
        value={activeTab}
        onChange={setActiveTab}
        topContent={
          showSearch ? (
            <View className="px-4 pb-3 pt-1">
              <View className="flex-row items-center gap-2 rounded-full bg-[#202327] px-4 py-2.5">
                <SearchIcon size={20} color="#71767B" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search conversations"
                  placeholderTextColor="#71767B"
                  className="flex-1 text-[19px] text-foreground"
                  returnKeyType="search"
                  autoFocus
                />
                <Pressable
                  onPress={() => {
                    setSearch('')
                    setShowSearch(false)
                  }}
                >
                  <X size={18} color="#71767B" />
                </Pressable>
              </View>
            </View>
          ) : null
        }
        renderScene={(tab) => (
          <FlatList
            data={getFilteredConversations(tab)}
            style={{ backgroundColor: '#000000' }}
            contentContainerStyle={{ paddingBottom: 32 }}
            keyExtractor={(item) => item._id}
            ItemSeparatorComponent={() => (
              <View className="ml-[92px] h-px bg-white/10" />
            )}
            ListHeaderComponent={
              status === 'LoadingFirstPage' && !hasCachedConversations ? (
                <View className="mt-8 items-center">
                  <ActivityIndicator color="#F11A23" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              status === 'LoadingFirstPage' &&
              !hasCachedConversations ? null : (
                <View className="mt-12 items-center px-8">
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-[#202327]">
                    <SearchIcon size={24} color="#71767B" />
                  </View>
                  <Text className="mt-4 text-center text-base font-medium text-foreground">
                    No conversations yet
                  </Text>
                  <Text className="mt-1 text-center text-sm text-muted-foreground">
                    Start chatting with members from their profile.
                  </Text>
                </View>
              )
            }
            renderItem={({ item }) => {
              const isGroup = item.type === 'group' || item.type === 'meetup'
              const displayName = isGroup
                ? (item.groupName ?? 'Group')
                : item.otherParticipant.name
              const imageUrl = isGroup
                ? item.groupAvatarUrl
                : item.otherParticipant.imageUrl
              const hasUnread = item.unreadCount > 0

              return (
                <Pressable
                  className="flex-row items-center gap-4 px-6 py-3"
                  onPress={() => {
                    router.push(`/(tabs)/messages/conversations/${item._id}`)
                  }}
                  android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
                >
                  {isGroup && !imageUrl ? (
                    <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                      <Users color="#F11A23" size={25} />
                    </View>
                  ) : (
                    <Avatar
                      imageUrl={imageUrl}
                      name={displayName}
                      size="list"
                      showOnlineIndicator={!isGroup}
                      isOnline={item.otherParticipant.isOnline}
                    />
                  )}
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between gap-2">
                      <Text
                        className={
                          hasUnread
                            ? 'flex-shrink text-[17px] font-bold text-foreground'
                            : 'flex-shrink text-[17px] font-semibold text-foreground'
                        }
                        numberOfLines={1}
                      >
                        {displayName}
                      </Text>
                      <Text
                        className={
                          hasUnread
                            ? 'text-[13px] font-semibold text-primary'
                            : 'text-[13px] font-normal text-[#71767B]'
                        }
                      >
                        {item.lastMessageTime
                          ? formatTimeAgo(item.lastMessageTime)
                          : ''}
                      </Text>
                    </View>
                    <View className="mt-0.5 flex-row items-center justify-between gap-2">
                      <Text
                        className={
                          hasUnread
                            ? 'flex-1 text-[16px] font-medium text-foreground'
                            : 'flex-1 text-[16px] font-normal text-[#71767B]'
                        }
                        numberOfLines={1}
                      >
                        {getLastMessagePreview(item.lastMessage, user._id)}
                      </Text>
                      {hasUnread ? (
                        <UnreadBadge count={item.unreadCount} />
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              )
            }}
            ListFooterComponent={
              status === 'CanLoadMore' ? (
                <Pressable
                  className="mt-4 items-center self-center rounded-full bg-card px-4 py-2"
                  onPress={() => {
                    loadMore(20)
                  }}
                >
                  <Text className="text-sm font-semibold text-foreground">
                    Load more
                  </Text>
                </Pressable>
              ) : null
            }
          />
        )}
      />

      <CreateGroupSheet
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(conversationId: Id<'conversations'>) =>
          router.push(`/(tabs)/messages/conversations/${conversationId}`)
        }
      />
    </SafeAreaView>
  )
}

function UnreadBadge({ count }: { count: number }) {
  return (
    <View
      className="ml-2 items-center justify-center rounded-full bg-primary px-1.5"
      style={{ minWidth: 20, height: 20 }}
    >
      <Text className="text-[11px] font-bold text-primary-foreground">
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  )
}
