import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  BedDouble,
  Car,
  Clock,
  DoorOpen,
  Droplets,
  Dumbbell,
  Home,
  MapPin,
  MessageSquareDashed,
  PartyPopper,
  Send,
  TreePine,
  Trees,
  User,
  Users,
  Video,
  X,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../../src/components/auth/AuthGate'
import { MessageComposer } from '../../src/components/messaging/MessageComposer'
import { ResolvedImage } from '../../src/components/ui/ResolvedImage'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { formatTimeAgo } from '../../src/lib/format'
import type { Id } from '@/src/lib/convexApi'
import type { TextInput } from 'react-native'

type FeedMessageType = 'message' | 'check_in' | 'looking_now' | 'just_joined'

interface FeedAuthor {
  _id: Id<'users'>
  displayName: string
  photoUrl?: string | null
  imageIsNsfw?: boolean
  isOnline?: boolean
  age?: number
  position?: string
  showDistance?: boolean
  isLookingNow?: boolean
  isTraveling?: boolean
  isInvisible?: boolean
  isDiscreet?: boolean
  isIdle?: boolean
}

interface FeedMessage {
  _id: Id<'feedMessages'>
  userId: Id<'users'>
  content: string
  type: FeedMessageType
  mediaUrl?: string | null
  isNsfw?: boolean
  spotId?: Id<'spots'>
  spotName?: string
  spotCategory?: string
  lookingNowMessage?: string
  lookingNowDuration?: number
  canHost?: boolean
  hostingType?: string
  iAmPosition?: string
  createdAt: number
  distance?: number
  author: FeedAuthor
}

interface UserGroup {
  userId: Id<'users'>
  messages: Array<FeedMessage>
}

const LOOKING_NOW_DURATIONS = [
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
  { value: 240, label: '4h' },
] as const

const HOSTING_TYPES = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'car', label: 'Car', icon: Car },
  { value: 'gym', label: 'Gym', icon: Dumbbell },
  { value: 'outdoors', label: 'Park', icon: Trees },
] as const

const POSITION_LABELS: Record<string, string> = {
  top: 'Top',
  bottom: 'Bottom',
  vers: 'Vers',
  vers_top: 'Vers Top',
  vers_bottom: 'Vers Bottom',
  side: 'Side',
}

const HOSTING_TYPE_META: Record<
  string,
  {
    label: string
    icon: React.ComponentType<{ color?: string; size?: number }>
  }
> = {
  '1on1': { label: '1 on 1', icon: User },
  group: { label: 'Group', icon: Users },
  gloryhole: { label: 'Gloryhole', icon: DoorOpen },
  carFun: { label: 'Car Fun', icon: Car },
  livePlay: { label: 'Live Play', icon: Video },
  bathhouse: { label: 'Bathhouse', icon: Droplets },
  hotel: { label: 'Hotel', icon: BedDouble },
  outdoor: { label: 'Outdoor', icon: TreePine },
  home: { label: 'Home', icon: Home },
  car: { label: 'Car', icon: Car },
  gym: { label: 'Gym', icon: Dumbbell },
  outdoors: { label: 'Park', icon: Trees },
}

const DEFAULT_VISIBLE_COUNT = 3
const FEED_LIMIT_INITIAL = 30
const FEED_LIMIT_STEP = 20

const MOBILE_FEED_CACHE_TTL_MS = 2 * 60 * 1000
const MOBILE_FEED_CACHE_MAX_ENTRIES = 12

const mobileFeedCache = new Map<
  string,
  { messages: Array<FeedMessage>; cachedAt: number }
>()

const pruneMobileFeedCache = () => {
  const now = Date.now()
  for (const [key, value] of mobileFeedCache.entries()) {
    if (now - value.cachedAt > MOBILE_FEED_CACHE_TTL_MS) {
      mobileFeedCache.delete(key)
    }
  }

  if (mobileFeedCache.size <= MOBILE_FEED_CACHE_MAX_ENTRIES) return

  const oldest = [...mobileFeedCache.entries()].sort(
    (a, b) => a[1].cachedAt - b[1].cachedAt,
  )
  const toRemove = mobileFeedCache.size - MOBILE_FEED_CACHE_MAX_ENTRIES
  for (let i = 0; i < toRemove; i += 1) {
    mobileFeedCache.delete(oldest[i][0])
  }
}

const readCachedMessages = (key: string): Array<FeedMessage> => {
  pruneMobileFeedCache()
  return mobileFeedCache.get(key)?.messages ?? []
}

const writeCachedMessages = (key: string, messages: Array<FeedMessage>) => {
  mobileFeedCache.set(key, { messages, cachedAt: Date.now() })
  pruneMobileFeedCache()
}

function groupMessagesByAuthor(messages: Array<FeedMessage>): Array<UserGroup> {
  const buckets = new Map<string, Array<FeedMessage>>()
  for (const message of messages) {
    const key = message.userId as unknown as string
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(message)
    } else {
      buckets.set(key, [message])
    }
  }

  return Array.from(buckets.entries())
    .map(([userId, items]) => {
      const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt)
      return {
        userId: userId as unknown as Id<'users'>,
        messages: sorted,
      }
    })
    .sort((a, b) => {
      const aLatest = a.messages[0]?.createdAt ?? 0
      const bLatest = b.messages[0]?.createdAt ?? 0
      return bLatest - aLatest
    })
}

function formatDistanceMiles(distance?: number): string | undefined {
  if (typeof distance !== 'number') return undefined
  if (distance < 0.5) return 'Nearby'
  return `${Math.round(distance)} mi`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function BarnFeedScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const [refreshing, setRefreshing] = useState(false)
  const [showLookingNowModal, setShowLookingNowModal] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [lookingNowDuration, setLookingNowDuration] = useState(60)
  const [lookingNowCanHost, setLookingNowCanHost] = useState<
    boolean | undefined
  >(undefined)
  const [lookingNowType, setLookingNowType] = useState<string | undefined>()
  const [isEndingLookingNow, setIsEndingLookingNow] = useState(false)
  const [limit, setLimit] = useState(FEED_LIMIT_INITIAL)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [composerHeight, setComposerHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const composerInputRef = useRef<TextInput | null>(null)

  const profile = useQuery(
    api.members.getProfile,
    user?._id ? { userId: user._id } : 'skip',
  )
  const activeLookingNowPost = useQuery(
    api.lookingNow.getMyActivePost,
    user?._id ? {} : 'skip',
  )

  const recordFeedVisit = useMutation(api.feedMessages.recordFeedVisit)
  useEffect(() => {
    if (user?._id) {
      recordFeedVisit({}).catch(() => {})
    }
  }, [user?._id, recordFeedVisit])

  const feedData = useQuery(
    api.feedMessages.getLatestFeedMessages,
    user?._id
      ? {
          viewerLatitude: profile?.latitude,
          viewerLongitude: profile?.longitude,
          limit,
        }
      : 'skip',
  )

  const items = (feedData?.items ?? []) as Array<FeedMessage>
  const hasMore = feedData?.hasMore ?? false
  const isLoadingFeed = feedData === undefined

  const cacheKey = useMemo(
    () =>
      JSON.stringify({
        userId: user?._id ?? null,
        latitude: profile?.latitude ?? null,
        longitude: profile?.longitude ?? null,
        limit,
      }),
    [limit, profile?.latitude, profile?.longitude, user?._id],
  )

  const cached = useMemo(() => readCachedMessages(cacheKey), [cacheKey])
  const messages = isLoadingFeed && cached.length > 0 ? cached : items

  useEffect(() => {
    if (isLoadingFeed) return
    writeCachedMessages(cacheKey, items)
  }, [cacheKey, isLoadingFeed, items])

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setIsKeyboardVisible(true)
      setKeyboardHeight(event.endCoordinates.height)
    })
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false)
      setKeyboardHeight(0)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  const groups = useMemo(() => groupMessagesByAuthor(messages), [messages])

  const createPost = useAction(api.feedMessages.createFeedMessage)
  const createLookingNowPost = useAction(api.lookingNow.createPost)
  const updateLookingNowPost = useAction(api.lookingNow.updatePost)
  const deleteLookingNowPost = useMutation(api.lookingNow.deletePost)
  const startConversation = useMutation(api.messages.startConversation)
  const deleteFeedMessage = useMutation(api.feedMessages.deleteFeedMessage)

  useEffect(() => {
    if (!activeLookingNowPost) return
    setLookingNowDuration(activeLookingNowPost.duration ?? 60)
    setLookingNowCanHost(activeLookingNowPost.canHost)
    setLookingNowType(activeLookingNowPost.hostingType)
  }, [activeLookingNowPost])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setLimit(FEED_LIMIT_INITIAL)
    setTimeout(() => setRefreshing(false), 800)
  }, [])

  const toggleGroupExpanded = useCallback((userId: Id<'users'>) => {
    setExpandedGroups((current) => {
      const next = new Set(current)
      const key = userId as unknown as string
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const handleViewProfile = useCallback(
    (userId: Id<'users'>) => {
      router.push(`/user/${userId}`)
    },
    [router],
  )

  const handleStartConversation = useCallback(
    async (otherUserId: Id<'users'>) => {
      if (!user?._id) return
      try {
        const result = await startConversation({
          otherUserId,
        })
        router.push(`/(tabs)/messages/conversations/${result.conversationId}`)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Could not start conversation'
        Alert.alert('Message failed', message)
      }
    },
    [router, startConversation, user?._id],
  )

  const handleDeleteMessage = useCallback(
    async (messageId: Id<'feedMessages'>) => {
      if (!user?._id) return
      try {
        await deleteFeedMessage({ messageId })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete post'
        Alert.alert('Delete failed', message)
      }
    },
    [deleteFeedMessage, user?._id],
  )

  const handleCreatePost = async () => {
    if (!user?._id || !newPostContent.trim() || newPostContent.length > 280) {
      return
    }

    setIsPosting(true)
    try {
      await createPost({
        content: newPostContent.trim(),
        authorLatitude: profile?.latitude,
        authorLongitude: profile?.longitude,
      })
      setNewPostContent('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create post'
      Alert.alert('Error', message)
    } finally {
      setIsPosting(false)
    }
  }

  const handleSubmitLookingNow = async () => {
    if (!user?._id || lookingNowCanHost === undefined) {
      Alert.alert('Availability required', 'Choose Hosting or Mobile.')
      return
    }

    setIsPosting(true)
    try {
      const locationName = profile?.locationName ?? 'Nearby'
      if (activeLookingNowPost) {
        await updateLookingNowPost({
          postId: activeLookingNowPost._id,
          message: '',
          duration: lookingNowDuration,
          locationName,
          canHost: lookingNowCanHost,
          hostingType: lookingNowType,
        })
      } else {
        await createLookingNowPost({
          message: '',
          duration: lookingNowDuration,
          latitude: profile?.latitude,
          longitude: profile?.longitude,
          locationName,
          canHost: lookingNowCanHost,
          hostingType: lookingNowType,
        })
      }

      setShowLookingNowModal(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not update Looking Now'
      Alert.alert('Looking Now failed', message)
    } finally {
      setIsPosting(false)
    }
  }

  const handleEndLookingNow = async () => {
    if (!user?._id || !activeLookingNowPost || isEndingLookingNow) return

    try {
      setIsEndingLookingNow(true)
      await deleteLookingNowPost({
        postId: activeLookingNowPost._id,
      })
      setShowLookingNowModal(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not end Looking Now'
      Alert.alert('Looking Now failed', message)
    } finally {
      setIsEndingLookingNow(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F11A23" />
      </SafeAreaView>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate
        title="The Barn"
        description="Sign in to see the community feed."
      />
    )
  }

  const renderGroup = ({ item: group }: { item: UserGroup }) => (
    <UserGroupCard
      group={group}
      currentUserId={user._id}
      isExpanded={expandedGroups.has(group.userId as unknown as string)}
      onToggleExpanded={() => toggleGroupExpanded(group.userId)}
      onViewProfile={() => handleViewProfile(group.userId)}
      onMessage={() => void handleStartConversation(group.userId)}
      onDeleteMessage={(messageId) => void handleDeleteMessage(messageId)}
    />
  )

  const ListEmpty = () => {
    if (isLoadingFeed) {
      return (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#F11A23" />
          <Text className="mt-3 text-sm text-muted-foreground">
            Loading The Barn...
          </Text>
        </View>
      )
    }

    return (
      <View className="flex-1 items-center justify-center py-16">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <MessageSquareDashed color="#F11A23" size={28} />
        </View>
        <Text className="mt-4 text-base font-semibold text-foreground">
          No updates yet
        </Text>
        <Text className="mt-1 text-center text-sm text-muted-foreground">
          Be the first to post!
        </Text>
        <Pressable
          onPress={() => composerInputRef.current?.focus()}
          className="mt-4 rounded-xl bg-primary px-4 py-2"
        >
          <Text className="text-sm font-semibold text-primary-foreground">
            Create a post
          </Text>
        </Pressable>
      </View>
    )
  }

  const ListFooter = () => {
    if (groups.length === 0) return null
    if (hasMore) {
      return (
        <Pressable
          onPress={() => setLimit((current) => current + FEED_LIMIT_STEP)}
          className="mx-4 my-4 items-center rounded-xl border border-border bg-card py-3"
        >
          <Text className="text-sm font-semibold text-foreground">
            Load more
          </Text>
        </Pressable>
      )
    }
    return (
      <View className="mx-4 my-4 items-center rounded-xl border border-dashed border-muted-foreground/20 bg-muted/20 py-4">
        <Text className="text-sm text-muted-foreground">
          You're all caught up
        </Text>
      </View>
    )
  }

  const bottomTabHeight = isKeyboardVisible ? 0 : 48 + insets.bottom
  const composerBottomOffset =
    Platform.OS === 'ios' && isKeyboardVisible ? keyboardHeight : 0
  const contentBottomPadding = Math.max(
    composerHeight + bottomTabHeight + 16,
    128,
  )
  const listContentContainerStyle = useMemo(
    () => ({ paddingBottom: contentBottomPadding }),
    [contentBottomPadding],
  )
  const handleComposerLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const nextHeight = Math.ceil(event.nativeEvent.layout.height)
      setComposerHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      )
    },
    [],
  )

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(group) => group.userId as unknown as string}
        className="flex-1"
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={listContentContainerStyle}
        ItemSeparatorComponent={() => (
          <View className="mx-4 h-px bg-border/40" />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F11A23"
          />
        }
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <View
        className="absolute inset-x-0 bottom-0"
        pointerEvents="box-none"
        style={{ bottom: composerBottomOffset }}
      >
        <View className="bg-black px-4" onLayout={handleComposerLayout}>
          <MessageComposer
            value={newPostContent}
            onChangeText={setNewPostContent}
            onSend={() => void handleCreatePost()}
            placeholder="What's on your mind?"
            canSubmit={
              Boolean(newPostContent.trim()) &&
              newPostContent.length <= 280 &&
              !isPosting
            }
            disabled={isPosting}
            inputRef={composerInputRef}
            characterLimit={280}
            characterLimitDisplay="floatingRing"
            horizontalPadding={0}
            topPadding={8}
            bottomPadding={10}
            renderLeading={(floatingCharacterLimit) => (
              <Pressable
                onPress={() => setShowLookingNowModal(true)}
                disabled={isPosting}
                style={{
                  position: 'relative',
                  width: 48,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 24,
                  backgroundColor: activeLookingNowPost
                    ? 'rgba(241, 26, 35, 0.18)'
                    : '#16181C',
                  borderWidth: activeLookingNowPost ? 1 : 0,
                  borderColor: 'rgba(241, 26, 35, 0.45)',
                  opacity: isPosting ? 0.6 : 1,
                }}
              >
                <MapPin
                  color={activeLookingNowPost ? '#F11A23' : '#FAFAFA'}
                  size={22}
                />
                {floatingCharacterLimit}
              </Pressable>
            )}
          />
        </View>
        {isKeyboardVisible ? null : (
          <View style={{ height: bottomTabHeight }} />
        )}
      </View>

      {showLookingNowModal && (
        <KeyboardAvoidingView
          className="absolute inset-0 bg-black/60"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable
            className="flex-1"
            onPress={() => setShowLookingNowModal(false)}
          />
          <View
            className="rounded-t-3xl bg-background p-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">
                Looking Now
              </Text>
              <Pressable
                className="h-9 w-9 items-center justify-center rounded-full bg-card"
                onPress={() => setShowLookingNowModal(false)}
              >
                <X color="#FAFAFA" size={18} />
              </Pressable>
            </View>

            <View>
              <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Duration
              </Text>
              <View className="flex-row gap-2">
                {LOOKING_NOW_DURATIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    className={`aspect-square flex-1 items-center justify-center rounded-xl border ${
                      lookingNowDuration === option.value
                        ? 'border-primary bg-primary'
                        : 'border-border bg-card'
                    }`}
                    onPress={() => setLookingNowDuration(option.value)}
                  >
                    <Clock
                      color={
                        lookingNowDuration === option.value
                          ? '#FAFAFA'
                          : '#999999'
                      }
                      size={18}
                    />
                    <Text
                      className={`mt-1 text-sm font-semibold ${
                        lookingNowDuration === option.value
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mt-5">
              <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Type
              </Text>
              <View className="flex-row gap-2">
                {HOSTING_TYPES.map((option) => {
                  const Icon = option.icon
                  const isSelected = lookingNowType === option.value
                  return (
                    <Pressable
                      key={option.value}
                      className={`aspect-square flex-1 items-center justify-center rounded-xl border ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-border bg-card'
                      }`}
                      onPress={() =>
                        setLookingNowType(isSelected ? undefined : option.value)
                      }
                    >
                      <Icon
                        color={isSelected ? '#FAFAFA' : '#999999'}
                        size={18}
                      />
                      <Text
                        className={`mt-1 text-xs font-semibold ${
                          isSelected
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <View className="mt-5">
              <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Availability
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  className={`flex-1 items-center rounded-xl border px-4 py-4 ${
                    lookingNowCanHost === true
                      ? 'border-primary bg-primary'
                      : 'border-border bg-card'
                  }`}
                  onPress={() =>
                    setLookingNowCanHost(
                      lookingNowCanHost === true ? undefined : true,
                    )
                  }
                >
                  <Home
                    color={lookingNowCanHost === true ? '#FAFAFA' : '#999999'}
                    size={22}
                  />
                  <Text
                    className={`mt-2 text-sm font-semibold ${
                      lookingNowCanHost === true
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Hosting
                  </Text>
                </Pressable>
                <Pressable
                  className={`flex-1 items-center rounded-xl border px-4 py-4 ${
                    lookingNowCanHost === false
                      ? 'border-primary bg-primary'
                      : 'border-border bg-card'
                  }`}
                  onPress={() =>
                    setLookingNowCanHost(
                      lookingNowCanHost === false ? undefined : false,
                    )
                  }
                >
                  <Car
                    color={lookingNowCanHost === false ? '#FAFAFA' : '#999999'}
                    size={22}
                  />
                  <Text
                    className={`mt-2 text-sm font-semibold ${
                      lookingNowCanHost === false
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Mobile
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="mt-5 flex-row gap-3">
              {activeLookingNowPost ? (
                <Pressable
                  className="flex-1 items-center rounded-xl border border-border bg-card px-4 py-4"
                  disabled={isEndingLookingNow || isPosting}
                  onPress={() => void handleEndLookingNow()}
                >
                  <Text className="text-sm font-semibold text-foreground">
                    {isEndingLookingNow ? 'Ending...' : 'End'}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                className={`flex-1 items-center rounded-xl px-4 py-4 ${
                  lookingNowCanHost !== undefined && !isPosting
                    ? 'bg-primary'
                    : 'bg-primary/50'
                }`}
                disabled={lookingNowCanHost === undefined || isPosting}
                onPress={() => void handleSubmitLookingNow()}
              >
                <Text className="text-sm font-semibold text-primary-foreground">
                  {isPosting
                    ? 'Posting...'
                    : activeLookingNowPost
                      ? 'Update'
                      : 'Post Looking Now'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

interface UserGroupCardProps {
  group: UserGroup
  currentUserId: Id<'users'>
  isExpanded: boolean
  onToggleExpanded: () => void
  onViewProfile: () => void
  onMessage: () => void
  onDeleteMessage: (messageId: Id<'feedMessages'>) => void
}

function UserGroupCard({
  group,
  currentUserId,
  isExpanded,
  onToggleExpanded,
  onViewProfile,
  onMessage,
  onDeleteMessage,
}: UserGroupCardProps) {
  const author = group.messages[0].author
  const isOwn = group.messages[0].userId === currentUserId
  const mostRecent = group.messages[0]

  const distanceLabel =
    author.showDistance !== false
      ? formatDistanceMiles(mostRecent.distance)
      : undefined

  const hiddenCount = group.messages.length - DEFAULT_VISIBLE_COUNT
  const visibleMessages =
    isExpanded || group.messages.length <= DEFAULT_VISIBLE_COUNT
      ? group.messages
      : group.messages.slice(0, DEFAULT_VISIBLE_COUNT)

  return (
    <View className="flex-row items-start gap-3 px-4 py-3">
      <Pressable onPress={onViewProfile} className="shrink-0">
        <View className="relative">
          {author.photoUrl ? (
            <ResolvedImage
              uri={author.photoUrl}
              contentFit="cover"
              style={{ width: 44, height: 56, borderRadius: 8 }}
            />
          ) : (
            <View className="h-14 w-11 items-center justify-center rounded-lg bg-primary/20">
              <Text className="text-sm font-semibold text-primary">
                {getInitials(author.displayName)}
              </Text>
            </View>
          )}
          {author.isOnline && (
            <View className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
          )}
        </View>
      </Pressable>

      <View className="flex-1">
        <Pressable onPress={onViewProfile}>
          <View className="flex-row items-center gap-1.5">
            <Text
              className="text-sm font-semibold text-foreground"
              numberOfLines={1}
            >
              {author.displayName}
            </Text>
            {author.age ? (
              <Text className="text-xs text-muted-foreground">
                {author.age}
              </Text>
            ) : null}
          </View>
          <Text className="text-xs text-muted-foreground">
            {distanceLabel ? `${distanceLabel} · ` : ''}
            {formatTimeAgo(mostRecent.createdAt)}
          </Text>
        </Pressable>

        <View className="mt-2 gap-1.5">
          {!isExpanded && hiddenCount > 0 && (
            <Pressable onPress={onToggleExpanded}>
              <Text className="text-xs text-muted-foreground">
                Show older ({hiddenCount})
              </Text>
            </Pressable>
          )}
          {visibleMessages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={isOwn}
              onDelete={isOwn ? () => onDeleteMessage(message._id) : undefined}
            />
          ))}
        </View>
      </View>

      {!isOwn && (
        <Pressable
          onPress={onMessage}
          className="mt-0.5 flex-row items-center gap-1 self-start rounded-full bg-primary/10 px-3 py-1.5"
        >
          <Send color="#F11A23" size={12} />
          <Text className="text-xs font-medium text-primary">Message</Text>
        </Pressable>
      )}
    </View>
  )
}

interface MessageBubbleProps {
  message: FeedMessage
  isOwn: boolean
  onDelete?: () => void
}

function MessageBubble({ message, isOwn, onDelete }: MessageBubbleProps) {
  if (message.type === 'check_in') {
    const isStale = Date.now() - message.createdAt > 3 * 60 * 60 * 1000
    return (
      <View className="flex-row items-center gap-1.5">
        <View
          className={`flex-row items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white/10 px-3 py-1.5 ${
            isStale ? 'opacity-50' : ''
          }`}
        >
          <MapPin color="#999999" size={14} />
          <Text className="text-sm text-foreground">Checked in at </Text>
          <Text className="text-sm font-medium text-primary">
            {message.spotName ?? 'a spot'}
          </Text>
        </View>
        {onDelete ? (
          <Pressable onPress={onDelete} className="p-1 opacity-50">
            <X color="#999999" size={14} />
          </Pressable>
        ) : null}
      </View>
    )
  }

  if (message.type === 'looking_now') {
    const isExpired = !message.author.isLookingNow
    const availLabel =
      message.canHost === true
        ? "I'm Hosting Now"
        : message.canHost === false
          ? "I'm Mobile Now"
          : undefined
    const typeInfo = message.hostingType
      ? HOSTING_TYPE_META[message.hostingType]
      : undefined
    const TypeIcon = typeInfo?.icon
    const positionLabel = message.iAmPosition
      ? (POSITION_LABELS[message.iAmPosition] ?? message.iAmPosition)
      : undefined

    return (
      <View className="flex-row items-center gap-1.5">
        <View
          className={`flex-row flex-wrap items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white/10 px-3 py-2 ${
            isExpired ? 'opacity-50' : ''
          }`}
        >
          {availLabel ? (
            <View className="flex-row items-center gap-1">
              {message.canHost ? (
                <Home color="#F11A23" size={14} />
              ) : (
                <Car color="#F11A23" size={14} />
              )}
              <Text className="text-sm font-medium text-primary">
                {availLabel}
              </Text>
            </View>
          ) : (
            <Text className="text-sm font-medium text-primary">
              I'm Looking Now
            </Text>
          )}
          {typeInfo && TypeIcon ? (
            <>
              <Text className="text-muted-foreground/50">·</Text>
              <View className="flex-row items-center gap-1">
                <TypeIcon color="#999999" size={14} />
                <Text className="text-sm text-foreground">
                  {typeInfo.label}
                </Text>
              </View>
            </>
          ) : null}
          {positionLabel ? (
            <>
              <Text className="text-muted-foreground/50">·</Text>
              <Text className="text-sm text-foreground">{positionLabel}</Text>
            </>
          ) : null}
          {message.spotName ? (
            <>
              <Text className="text-muted-foreground/50">·</Text>
              <Text className="text-sm text-foreground">
                {message.spotName}
              </Text>
            </>
          ) : null}
        </View>
        {onDelete ? (
          <Pressable onPress={onDelete} className="p-1 opacity-50">
            <X color="#999999" size={14} />
          </Pressable>
        ) : null}
      </View>
    )
  }

  if (message.type === 'just_joined') {
    return (
      <View className="flex-row items-center gap-1.5">
        <View className="flex-row items-center gap-1.5 rounded-2xl rounded-tl-sm bg-primary/10 px-3 py-1.5">
          <PartyPopper color="#F11A23" size={14} />
          <Text className="text-sm font-medium text-primary">
            Just joined Civic Research Hub!
          </Text>
        </View>
      </View>
    )
  }

  // Default: regular text/photo message
  const hasMedia = !!message.mediaUrl
  return (
    <View className="flex-row items-start gap-1.5">
      <View
        className={`max-w-[85%] overflow-hidden rounded-2xl rounded-tl-sm ${
          hasMedia ? 'bg-white/10' : isOwn ? 'bg-primary' : 'bg-white/10'
        }`}
      >
        {hasMedia ? (
          <ResolvedImage
            uri={message.mediaUrl}
            contentFit="cover"
            style={{ width: 240, height: 240 }}
          />
        ) : null}
        {message.content ? (
          <View className="px-3 py-1.5">
            <Text
              className={`text-sm ${
                hasMedia
                  ? 'text-foreground'
                  : isOwn
                    ? 'text-primary-foreground'
                    : 'text-foreground'
              }`}
            >
              {message.content}
            </Text>
          </View>
        ) : null}
      </View>
      {onDelete ? (
        <Pressable onPress={onDelete} className="p-1 opacity-50">
          <X color="#999999" size={14} />
        </Pressable>
      ) : null}
    </View>
  )
}
