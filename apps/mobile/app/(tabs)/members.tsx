import {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useMutation, useQuery } from 'convex/react'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SlidersHorizontal, X } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../../src/components/auth/AuthGate'
import { MobileTabbedPager } from '../../src/components/navigation/MobileTabbedPager'
import { ResolvedImage } from '../../src/components/ui/ResolvedImage'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { useLocation } from '../../src/hooks/useLocation'
import type { Id } from '@/src/lib/convexApi'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const NUM_COLUMNS = 3
const GAP = 6
const ITEM_WIDTH = (SCREEN_WIDTH - 16 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS
const ITEM_HEIGHT = ITEM_WIDTH * (4 / 3)
const TAB_BAR_SCROLL_CLEARANCE = 96

type MemberProfile = {
  _id: Id<'users'>
  name: string
  imageUrl?: string
  isOnline?: boolean
  distanceMiles?: number
  profile?: {
    displayName?: string
    age?: number
    profilePhotoUrl?: string
    profilePhotoUrls?: Array<string>
  } | null
}

type SortBy = 'distance' | 'recently_active' | 'newest'
type MembersTab = 'members' | 'friends' | 'viewers'

const MEMBER_TABS: Array<{ value: MembersTab; label: string }> = [
  { value: 'members', label: 'Nearby' },
  { value: 'friends', label: 'Friends' },
  { value: 'viewers', label: 'Viewers' },
]

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100]
const LOOKING_FOR_OPTIONS = [
  { id: 'chat', label: 'Chat' },
  { id: 'dating', label: 'Dating' },
  { id: 'fun', label: 'Fun' },
  { id: 'network', label: 'Network' },
  { id: 'open', label: 'Open' },
]
const POSITION_OPTIONS = [
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'vers', label: 'Vers' },
  { id: 'vers_top', label: 'Vers Top' },
  { id: 'vers_bottom', label: 'Vers Bottom' },
  { id: 'side', label: 'Side' },
]
const BODY_TYPE_OPTIONS = [
  { id: 'slim', label: 'Slim' },
  { id: 'average', label: 'Average' },
  { id: 'muscular', label: 'Muscular' },
  { id: 'stocky', label: 'Stocky' },
  { id: 'large', label: 'Large' },
]
const TRIBE_OPTIONS = [
  { id: 'bear', label: 'Bear' },
  { id: 'otter', label: 'Otter' },
  { id: 'twink', label: 'Twink' },
  { id: 'jock', label: 'Jock' },
  { id: 'daddy', label: 'Daddy' },
  { id: 'cub', label: 'Cub' },
  { id: 'wolf', label: 'Wolf' },
  { id: 'pup', label: 'Pup' },
  { id: 'leather', label: 'Leather' },
  { id: 'geek', label: 'Geek' },
  { id: 'rugged', label: 'Rugged' },
  { id: 'muscle', label: 'Muscle' },
]
const SORT_OPTIONS: Array<{ id: SortBy; label: string }> = [
  { id: 'distance', label: 'Distance' },
  { id: 'recently_active', label: 'Recently Active' },
  { id: 'newest', label: 'Newest' },
]

export default function MembersScreen() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const { location } = useLocation()
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [activeTab, setActiveTab] = useState<MembersTab>('members')
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [maxDistanceMiles, setMaxDistanceMiles] = useState(50)
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [withPhotos, setWithPhotos] = useState(true)
  const [lookingFor, setLookingFor] = useState<Array<string>>([])
  const [position, setPosition] = useState<Array<string>>([])
  const [bodyType, setBodyType] = useState<Array<string>>([])
  const [tribes, setTribes] = useState<Array<string>>([])
  const [sortBy, setSortBy] = useState<SortBy>('distance')
  const deferredSearch = useDeferredValue(search)

  const recommendedProfiles = useQuery(
    api.members.getRecommendedProfiles,
    user?._id && !location ? { limit: 50 } : 'skip',
  )
  const nearbyProfiles = useQuery(
    api.members.getNearbyUsers,
    user?._id && location && deferredSearch.trim().length < 2
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          maxDistanceMiles,
          limit: 80,
          onlineOnly,
          withPhotos,
          lookingFor,
          position,
          bodyType,
          tribes,
          includeSelf: false,
          sortBy,
        }
      : 'skip',
  )
  const searchResults = useQuery(
    api.members.searchUsers,
    user?._id && deferredSearch.trim().length >= 2
      ? { query: deferredSearch, limit: 50 }
      : 'skip',
  )
  const friends = useQuery(api.members.getFriends, user?._id ? {} : 'skip')
  const viewersData = useQuery(
    api.admirers.getMyProfileViewers,
    user?._id ? { limit: 80 } : 'skip',
  )

  const startConversation = useMutation(api.messages.startConversation)
  const searchInputRef = useRef<TextInput>(null)

  // Double tap tracking
  const lastTapRef = useRef<{ userId: Id<'users'>; time: number } | null>(null)
  const DOUBLE_TAP_DELAY = 300 // ms

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    // Convex will automatically refetch, just wait a bit
    setTimeout(() => setRefreshing(false), 1000)
  }, [])

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'mobile-search:/members',
      () => {
        setActiveTab('members')
        setShowSearch((current) => {
          const next = !current
          if (next) {
            requestAnimationFrame(() => searchInputRef.current?.focus())
          }
          return next
        })
      },
    )

    return () => subscription.remove()
  }, [])

  const handleViewProfile = (userId: Id<'users'>) => {
    // Navigate to user profile
    router.push(`/user/${userId}`)
  }

  const handleStartConversation = async (otherUserId: Id<'users'>) => {
    if (!user?._id) return

    try {
      const result = await startConversation({
        otherUserId,
      })
      router.push(`/(tabs)/messages/conversations/${result.conversationId}`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not start conversation'
      Alert.alert('Message failed', message)
    }
  }

  const handleMemberTap = (userId: Id<'users'>) => {
    const now = Date.now()
    const lastTap = lastTapRef.current

    // Check for double tap on same user
    if (
      lastTap &&
      lastTap.userId === userId &&
      now - lastTap.time < DOUBLE_TAP_DELAY
    ) {
      // Double tap - go to messages
      lastTapRef.current = null
      handleStartConversation(userId)
    } else {
      // Single tap - go to profile (with delay to detect double tap)
      lastTapRef.current = { userId, time: now }
      setTimeout(() => {
        // Only navigate if this tap wasn't part of a double tap
        if (
          lastTapRef.current?.userId === userId &&
          lastTapRef.current?.time === now
        ) {
          lastTapRef.current = null
          handleViewProfile(userId)
        }
      }, DOUBLE_TAP_DELAY)
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
        title="Members"
        description="Sign in to browse nearby members."
      />
    )
  }

  const isSearching = deferredSearch.trim().length >= 2
  const filteredDiscovery = nearbyProfiles?.users
  const getMembersForTab = (tab: MembersTab): Array<MemberProfile> =>
    tab === 'friends'
      ? (
          (friends ?? []) as Array<{
            friend: {
              _id: Id<'users'>
              name: string
              imageUrl?: string
              isOnline?: boolean
              age?: number
            }
          }>
        ).map(({ friend }) => ({
          _id: friend._id,
          name: friend.name,
          imageUrl: friend.imageUrl,
          isOnline: friend.isOnline,
          profile: {
            displayName: friend.name,
            age: friend.age,
            profilePhotoUrl: friend.imageUrl,
          },
        }))
      : tab === 'viewers'
        ? (
            (viewersData?.viewers ?? []) as Array<{
              viewer: MemberProfile
            }>
          ).map(({ viewer }) => ({
            ...viewer,
            profile: viewer.profile ?? null,
          }))
        : isSearching
          ? ((searchResults ?? []) as MemberProfile[]).map((member) => ({
              ...member,
              profile: null,
            }))
          : filteredDiscovery
            ? (filteredDiscovery as MemberProfile[]).map((member) => ({
                ...member,
                profile: member.profile ?? null,
              }))
            : ((recommendedProfiles ?? []) as MemberProfile[]).map((member) => ({
                ...member,
                profile: member.profile ?? null,
              }))

  const getProfilePhoto = (member: MemberProfile) => {
    return (
      member.profile?.profilePhotoUrls?.[0] ||
      member.profile?.profilePhotoUrl ||
      member.imageUrl
    )
  }

  const getDisplayName = (member: MemberProfile) => {
    return member.profile?.displayName || member.name
  }

  const renderMemberCard = ({ item }: { item: MemberProfile }) => {
    const photoUrl = getProfilePhoto(item)
    const displayName = getDisplayName(item)
    const age = item.profile?.age
    const distance =
      typeof item.distanceMiles === 'number'
        ? item.distanceMiles < 0.5
          ? 'Nearby'
          : `${Math.round(item.distanceMiles)} mi`
        : null

    return (
      <Pressable
        onPress={() => handleMemberTap(item._id)}
        style={{ width: ITEM_WIDTH, height: ITEM_HEIGHT, marginBottom: GAP }}
        className="overflow-hidden rounded-lg bg-card"
      >
        {photoUrl ? (
          <ResolvedImage
            uri={photoUrl}
            contentFit="cover"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-primary/20">
            <Text className="text-2xl font-bold text-primary/60">
              {displayName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Online indicator */}
        {item.isOnline && (
          <View className="absolute right-2 top-2 h-3 w-3 rounded-full border-2 border-black/30 bg-green-500" />
        )}

        {/* Name overlay at bottom */}
        <View className="absolute inset-x-0 bottom-0 overflow-hidden px-2 pb-2 pt-6">
          <LinearGradient
            pointerEvents="none"
            colors={[
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0.24)',
              'rgba(0,0,0,0.62)',
              'rgba(0,0,0,0.86)',
            ]}
            locations={[0, 0.34, 0.72, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <Text
            className="text-sm font-bold text-white"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayName}
            {age ? `, ${age}` : ''}
          </Text>
          {distance ? (
            <Text className="text-xs font-semibold text-white/80">
              {distance}
            </Text>
          ) : null}
        </View>
      </Pressable>
    )
  }

  const activeFilterCount = [
    onlineOnly,
    !withPhotos,
    maxDistanceMiles !== 50,
    lookingFor.length > 0,
    position.length > 0,
    bodyType.length > 0,
    tribes.length > 0,
    sortBy !== 'distance',
  ].filter(Boolean).length

  const toggleFilterValue = (
    value: string,
    values: Array<string>,
    setter: (next: Array<string>) => void,
  ) => {
    setter(
      values.includes(value)
        ? values.filter((current) => current !== value)
        : [...values, value],
    )
  }

  const clearFilters = () => {
    setMaxDistanceMiles(50)
    setOnlineOnly(false)
    setWithPhotos(true)
    setLookingFor([])
    setPosition([])
    setBodyType([])
    setTribes([])
    setSortBy('distance')
  }

  const ListHeader = (tab: MembersTab) => {
    const showFilterCount = tab === 'members' && activeFilterCount > 0

    if (!(tab === 'members' && showSearch) && !showFilterCount) {
      return null
    }

    return (
      <View className="mb-3">
        {tab === 'members' && showSearch ? (
          <View className="mb-3 flex-row gap-2">
            <View className="flex-1 rounded-xl border border-border bg-card px-4 py-3">
              <TextInput
                ref={searchInputRef}
                value={search}
                onChangeText={setSearch}
                placeholder="Search members..."
                placeholderTextColor="#999999"
                className="text-base font-normal text-foreground"
                returnKeyType="search"
              />
            </View>
            <Pressable
              className={`h-12 w-12 items-center justify-center rounded-xl border ${
                activeFilterCount > 0
                  ? 'border-primary bg-primary/15'
                  : 'border-border bg-card'
              }`}
              onPress={() => setShowFilters(true)}
            >
              <SlidersHorizontal color="#FAFAFA" size={20} />
            </Pressable>
          </View>
        ) : null}
        {showFilterCount ? (
          <Text className="self-end text-xs font-semibold text-primary">
            {activeFilterCount} filters
          </Text>
        ) : null}
      </View>
    )
  }

  const ListEmpty = (tab: MembersTab) => {
    if (
      (isSearching && searchResults === undefined) ||
      (tab === 'friends' && friends === undefined) ||
      (tab === 'viewers' && viewersData === undefined) ||
      (!isSearching &&
        tab === 'members' &&
        (location
          ? nearbyProfiles === undefined
          : recommendedProfiles === undefined))
    ) {
      return (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#F11A23" />
          <Text className="mt-3 text-sm font-normal text-muted-foreground">
            Loading members...
          </Text>
        </View>
      )
    }

    return (
      <View className="flex-1 items-center justify-center py-12">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/20">
          <Text className="text-2xl font-bold text-primary/60">🐷</Text>
        </View>
        <Text className="mt-4 text-base font-semibold text-foreground">
          {tab === 'friends'
            ? 'No friends yet'
            : tab === 'viewers'
              ? 'No profile viewers yet'
              : isSearching
                ? 'No members found'
                : 'No members nearby'}
        </Text>
        <Text className="mt-1 text-center text-sm font-normal text-muted-foreground">
          {tab === 'friends'
            ? 'People you friend will show up here.'
            : tab === 'viewers'
              ? 'Recent profile views will appear here.'
              : isSearching
                ? 'Try a different search term'
                : 'Be the first to join your area!'}
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <MobileTabbedPager
        tabs={MEMBER_TABS}
        value={activeTab}
        onChange={(tab) => {
          setActiveTab(tab)
          if (tab !== 'members') setSearch('')
        }}
        renderScene={(tab) => (
          <FlatList
            data={getMembersForTab(tab)}
            renderItem={renderMemberCard}
            keyExtractor={(item) => item._id}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={{ gap: GAP }}
            contentContainerStyle={{
              padding: 8,
              paddingBottom: TAB_BAR_SCROLL_CLEARANCE,
            }}
            ListHeaderComponent={() => ListHeader(tab)}
            ListEmptyComponent={() => ListEmpty(tab)}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#F11A23"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      />
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        maxDistanceMiles={maxDistanceMiles}
        setMaxDistanceMiles={setMaxDistanceMiles}
        onlineOnly={onlineOnly}
        setOnlineOnly={setOnlineOnly}
        withPhotos={withPhotos}
        setWithPhotos={setWithPhotos}
        lookingFor={lookingFor}
        setLookingFor={setLookingFor}
        position={position}
        setPosition={setPosition}
        bodyType={bodyType}
        setBodyType={setBodyType}
        tribes={tribes}
        setTribes={setTribes}
        sortBy={sortBy}
        setSortBy={setSortBy}
        clearFilters={clearFilters}
        toggleFilterValue={toggleFilterValue}
      />
    </View>
  )
}

function FilterModal({
  visible,
  onClose,
  maxDistanceMiles,
  setMaxDistanceMiles,
  onlineOnly,
  setOnlineOnly,
  withPhotos,
  setWithPhotos,
  lookingFor,
  setLookingFor,
  position,
  setPosition,
  bodyType,
  setBodyType,
  tribes,
  setTribes,
  sortBy,
  setSortBy,
  clearFilters,
  toggleFilterValue,
}: {
  visible: boolean
  onClose: () => void
  maxDistanceMiles: number
  setMaxDistanceMiles: (value: number) => void
  onlineOnly: boolean
  setOnlineOnly: (value: boolean) => void
  withPhotos: boolean
  setWithPhotos: (value: boolean) => void
  lookingFor: Array<string>
  setLookingFor: (value: Array<string>) => void
  position: Array<string>
  setPosition: (value: Array<string>) => void
  bodyType: Array<string>
  setBodyType: (value: Array<string>) => void
  tribes: Array<string>
  setTribes: (value: Array<string>) => void
  sortBy: SortBy
  setSortBy: (value: SortBy) => void
  clearFilters: () => void
  toggleFilterValue: (
    value: string,
    values: Array<string>,
    setter: (next: Array<string>) => void,
  ) => void
}) {
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Text className="text-xl font-bold text-foreground">Filters</Text>
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-card"
            onPress={onClose}
          >
            <X color="#FAFAFA" size={20} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <FilterSection title="Quick Filters">
            <View className="flex-row flex-wrap gap-2">
              <FilterChip
                label="Online"
                selected={onlineOnly}
                onPress={() => setOnlineOnly(!onlineOnly)}
              />
              <FilterChip
                label="Photos"
                selected={withPhotos}
                onPress={() => setWithPhotos(!withPhotos)}
              />
            </View>
          </FilterSection>

          <FilterSection title="Distance">
            <View className="flex-row flex-wrap gap-2">
              {DISTANCE_OPTIONS.map((distance) => (
                <FilterChip
                  key={distance}
                  label={`${distance} mi`}
                  selected={maxDistanceMiles === distance}
                  onPress={() => setMaxDistanceMiles(distance)}
                />
              ))}
            </View>
          </FilterSection>

          <FilterSection title="Sort">
            <View className="flex-row flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <FilterChip
                  key={option.id}
                  label={option.label}
                  selected={sortBy === option.id}
                  onPress={() => setSortBy(option.id)}
                />
              ))}
            </View>
          </FilterSection>

          <MultiFilterSection
            title="Looking For"
            options={LOOKING_FOR_OPTIONS}
            values={lookingFor}
            setValues={setLookingFor}
            toggleFilterValue={toggleFilterValue}
          />
          <MultiFilterSection
            title="Position"
            options={POSITION_OPTIONS}
            values={position}
            setValues={setPosition}
            toggleFilterValue={toggleFilterValue}
          />
          <MultiFilterSection
            title="Body Type"
            options={BODY_TYPE_OPTIONS}
            values={bodyType}
            setValues={setBodyType}
            toggleFilterValue={toggleFilterValue}
          />
          <MultiFilterSection
            title="Tribes"
            options={TRIBE_OPTIONS}
            values={tribes}
            setValues={setTribes}
            toggleFilterValue={toggleFilterValue}
          />

          <View className="mt-4 flex-row gap-3">
            <Pressable
              className="flex-1 items-center rounded-2xl border border-border bg-card px-4 py-4"
              onPress={clearFilters}
            >
              <Text className="text-base font-semibold text-foreground">
                Clear
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-2xl bg-primary px-4 py-4"
              onPress={onClose}
            >
              <Text className="text-base font-semibold text-primary-foreground">
                Apply
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

function MultiFilterSection({
  title,
  options,
  values,
  setValues,
  toggleFilterValue,
}: {
  title: string
  options: Array<{ id: string; label: string }>
  values: Array<string>
  setValues: (value: Array<string>) => void
  toggleFilterValue: (
    value: string,
    values: Array<string>,
    setter: (next: Array<string>) => void,
  ) => void
}) {
  return (
    <FilterSection title={title}>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option.id}
            label={option.label}
            selected={values.includes(option.id)}
            onPress={() => toggleFilterValue(option.id, values, setValues)}
          />
        ))}
      </View>
    </FilterSection>
  )
}

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <View className="mb-5">
      <Text className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
        {title}
      </Text>
      {children}
    </View>
  )
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      className={`rounded-full border px-3 py-2 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-card'
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-sm font-semibold ${
          selected ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  )
}
