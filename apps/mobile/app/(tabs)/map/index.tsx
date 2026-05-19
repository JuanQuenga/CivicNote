import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CalendarClock, Flame, MapPin, Search, X } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../../../src/components/auth/AuthGate'
import { MobileTabbedPager } from '../../../src/components/navigation/MobileTabbedPager'
import { useCurrentUser } from '../../../src/hooks/useCurrentUser'
import { useLocation } from '../../../src/hooks/useLocation'
import {
  CATEGORY_COLOR_TOKENS,
  getActivityLevel,
  getSpotCategoryMeta,
} from '../../../src/lib/spot-categories'
import type { SpotCategory } from '../../../src/lib/spot-categories'
import type { Id } from '@/src/lib/convexApi'

type SpotsTab = 'all' | 'spots' | 'meetups'

type SpotListItem = {
  _id: Id<'spots'>
  name: string
  description?: string
  category: SpotCategory
  latitude: number
  longitude: number
  address: string
  city?: string
  photos?: Array<{ url: string; key: string }>
  distanceMiles?: number
  activeCheckInCount?: number
}

type MeetupListItem = {
  _id: Id<'meetups'>
  title: string
  meetupType: string
  locationName?: string
  startsAt: number
  maxAttendees: number
  attendeeCount: number
  status: string
  hostName: string
  distanceMiles?: number
  isMember: boolean
}

type MixedListItem =
  | { type: 'spot'; id: string; distanceMiles?: number; data: SpotListItem }
  | { type: 'meetup'; id: string; distanceMiles?: number; data: MeetupListItem }

const TABS: Array<{ value: SpotsTab; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'spots', label: 'Spots' },
  { value: 'meetups', label: 'Meetups' },
]

const MEETUP_TYPE_LABELS: Record<string, string> = {
  coffee: 'Coffee',
  drinks: 'Drinks',
  dinner: 'Dinner',
  outdoor: 'Outdoor',
  club: 'Club',
  other: 'Meetup',
}

function formatDistance(miles?: number) {
  if (miles === undefined) return null
  if (miles < 0.2) return 'Nearby'
  if (miles < 1) return `${Math.round(miles * 5280)} ft`
  return `${miles.toFixed(1)} mi`
}

function formatMeetupTime(startsAt: number) {
  const date = new Date(startsAt)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function MapScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ spotId?: string }>()
  const { isAuthenticated, isLoading: isAuthLoading, user } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<SpotsTab>('all')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const requestedSpotId = params.spotId as Id<'spots'> | undefined

  const { location } = useLocation()

  const normalizedSearch = search.trim().toLowerCase()
  const spotsResult = useQuery(
    api.spots.listSpots,
    isAuthenticated
      ? {
          searchQuery: normalizedSearch || undefined,
          latitude: location?.latitude,
          longitude: location?.longitude,
          limit: 50,
        }
      : 'skip',
  ) as { spots: Array<SpotListItem>; hasMore: boolean } | undefined
  const meetups = useQuery(
    api.meetups.listUpcomingMeetups,
    isAuthenticated
      ? {
          latitude: location?.latitude,
          longitude: location?.longitude,
        }
      : 'skip',
  ) as Array<MeetupListItem> | undefined

  useEffect(() => {
    if (!requestedSpotId) return
    DeviceEventEmitter.emit('mobile-map:open', { spotId: requestedSpotId })
  }, [requestedSpotId])

  const filteredMeetups = useMemo(() => {
    if (!meetups) return []
    if (!normalizedSearch) return meetups

    return meetups.filter((meetup) =>
      [
        meetup.title,
        meetup.meetupType,
        MEETUP_TYPE_LABELS[meetup.meetupType],
        meetup.locationName,
        meetup.hostName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [meetups, normalizedSearch])

  const getListItemsForTab = useMemo(() => {
    const spots = spotsResult?.spots ?? []
    return (tab: SpotsTab) => {
      const items: Array<MixedListItem> =
        tab === 'meetups'
          ? filteredMeetups.map((meetup) => ({
              type: 'meetup',
              id: meetup._id,
              distanceMiles: meetup.distanceMiles,
              data: meetup,
            }))
          : tab === 'spots'
            ? spots.map((spot) => ({
                type: 'spot',
                id: spot._id,
                distanceMiles: spot.distanceMiles,
                data: spot,
              }))
            : [
                ...spots.map((spot) => ({
                  type: 'spot' as const,
                  id: spot._id,
                  distanceMiles: spot.distanceMiles,
                  data: spot,
                })),
                ...filteredMeetups.map((meetup) => ({
                  type: 'meetup' as const,
                  id: meetup._id,
                  distanceMiles: meetup.distanceMiles,
                  data: meetup,
                })),
              ]

      return items.sort((a, b) => {
        if (a.distanceMiles === undefined && b.distanceMiles === undefined) {
          return 0
        }
        if (a.distanceMiles === undefined) return 1
        if (b.distanceMiles === undefined) return -1
        return a.distanceMiles - b.distanceMiles
      })
    }
  }, [filteredMeetups, spotsResult?.spots])

  useEffect(() => {
    const searchSubscription = DeviceEventEmitter.addListener(
      'mobile-search:/map',
      () => {
        setShowSearch((current) => !current)
      },
    )
    return () => {
      searchSubscription.remove()
    }
  }, [])

  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color="#F11A23" />
      </SafeAreaView>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate
        title="Spots"
        description="Sign in to discover spots and meetups near you."
      />
    )
  }

  const isListLoading = spotsResult === undefined || meetups === undefined

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.listScreen} edges={['bottom']}>
        <MobileTabbedPager
          tabs={TABS}
          value={activeTab}
          onChange={setActiveTab}
          topContent={
            showSearch ? (
              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <Search color="#8A8A8A" size={18} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search spots and meetups"
                    placeholderTextColor="#717171"
                    style={styles.searchInput}
                    returnKeyType="search"
                  />
                  <Pressable
                    onPress={() => {
                      setSearch('')
                      setShowSearch(false)
                    }}
                  >
                    <X color="#717171" size={18} />
                  </Pressable>
                </View>
              </View>
            ) : null
          }
          renderScene={(tab) => (
            <FlatList
              data={getListItemsForTab(tab)}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  {isListLoading ? (
                    <ActivityIndicator color="#F11A23" />
                  ) : (
                    <>
                      <MapPin color="#F11A23" size={28} />
                      <Text style={styles.emptyTitle}>
                        {normalizedSearch
                          ? 'No results found'
                          : 'Nothing nearby yet'}
                      </Text>
                      <Text style={styles.emptyText}>
                        {normalizedSearch
                          ? 'Try a different search term.'
                          : 'Be the first to add a spot or browse upcoming meetups.'}
                      </Text>
                    </>
                  )}
                </View>
              }
              renderItem={({ item }) =>
                item.type === 'spot' ? (
                  <SpotCard
                    spot={item.data}
                    onPress={() =>
                      router.push(`/(tabs)/map/spots/${item.data._id}` as any)
                    }
                  />
                ) : (
                  <MeetupCard
                    meetup={item.data}
                    onPress={() =>
                      router.push(`/(tabs)/map/meetups/${item.data._id}` as any)
                    }
                  />
                )
              }
            />
          )}
        />
      </SafeAreaView>
    </View>
  )
}

function SpotCard({
  onPress,
  spot,
}: {
  onPress: () => void
  spot: SpotListItem
}) {
  const meta = getSpotCategoryMeta(spot.category)
  const tokens = CATEGORY_COLOR_TOKENS[meta.color]
  const CategoryIcon = meta.icon
  const activity = getActivityLevel(spot.activeCheckInCount ?? 0)
  const subtitle = spot.city ?? spot.address
  const distance = formatDistance(spot.distanceMiles)

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.cardIcon, { backgroundColor: tokens.bg }]}>
        <CategoryIcon color={tokens.fg} size={20} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {spot.name}
        </Text>
        <View style={styles.cardSubtitleRow}>
          {subtitle ? (
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {distance ? (
            <Text style={styles.cardDistance}>
              {subtitle ? ' · ' : ''}
              {distance}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.cardMetaColumn}>
        {activity ? (
          <View
            style={[
              styles.activityBadge,
              {
                backgroundColor: activity.bg,
                borderColor: activity.border,
              },
            ]}
          >
            <Flame color={activity.fg} size={11} />
            <Text style={[styles.activityBadgeText, { color: activity.fg }]}>
              {spot.activeCheckInCount} {activity.label}
            </Text>
          </View>
        ) : null}
        <Text style={[styles.categoryLabel, { color: tokens.fg }]}>
          {meta.label}
        </Text>
      </View>
    </Pressable>
  )
}

const MEETUP_STATUS_STYLES: Record<
  string,
  { bg: string; fg: string; label: string }
> = {
  active: {
    bg: 'rgba(16, 185, 129, 0.15)',
    fg: '#34d399',
    label: 'Active',
  },
  upcoming: {
    bg: 'rgba(14, 165, 233, 0.15)',
    fg: '#7dd3fc',
    label: 'Upcoming',
  },
  cancelled: {
    bg: 'rgba(244, 63, 94, 0.15)',
    fg: '#fb7185',
    label: 'Cancelled',
  },
  ended: {
    bg: 'rgba(113, 113, 122, 0.15)',
    fg: '#a1a1aa',
    label: 'Ended',
  },
}

function MeetupCard({
  meetup,
  onPress,
}: {
  meetup: MeetupListItem
  onPress: () => void
}) {
  const status = MEETUP_STATUS_STYLES[meetup.status] ?? {
    bg: 'rgba(241, 26, 35, 0.15)',
    fg: '#F11A23',
    label: meetup.status,
  }
  const distance = formatDistance(meetup.distanceMiles)
  const subtitle = meetup.locationName ?? distance ?? ''

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View
        style={[
          styles.cardIcon,
          { backgroundColor: 'rgba(241, 26, 35, 0.12)' },
        ]}
      >
        <CalendarClock color="#F11A23" size={20} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {meetup.title}
        </Text>
        <View style={styles.cardSubtitleRow}>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
          {distance && subtitle !== distance ? (
            <Text style={styles.cardDistance}> · {distance}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.cardMetaColumn}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: status.bg, borderColor: status.fg + '4D' },
          ]}
        >
          <Text style={[styles.statusBadgeText, { color: status.fg }]}>
            {status.label}
          </Text>
        </View>
        <Text style={styles.categoryLabel}>
          {formatMeetupTime(meetup.startsAt)}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  listScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    padding: 24,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  searchBox: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#111111',
    paddingHorizontal: 13,
  },
  searchInput: {
    flex: 1,
    color: '#EDEDED',
    fontSize: 15,
    fontWeight: '500',
  },
  listContent: {
    gap: 8,
    padding: 12,
    paddingBottom: 96,
  },
  card: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#111111',
    padding: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(241, 26, 35, 0.14)',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: '#EDEDED',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitleRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubtitle: {
    flexShrink: 1,
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '500',
  },
  cardDistance: {
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '500',
  },
  cardMetaColumn: {
    alignItems: 'flex-end',
    gap: 4,
    maxWidth: 120,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  activityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  categoryLabel: {
    color: '#717171',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyCard: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#111111',
    padding: 24,
  },
  emptyTitle: {
    marginTop: 12,
    color: '#EDEDED',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#8A8A8A',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
})
