import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from 'convex/react'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { CalendarClock, MapPin, Search, X } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { MOBILE_OPEN_SIDE_MENU_EVENT } from '../navigation/MobileTabsHeader'
import {
  CATEGORY_COLOR_TOKENS,
  getSpotCategoryMeta,
} from '../../lib/spot-categories'
import { Avatar } from '../ui/Avatar'
import { MobileMapBottomPanel } from './MobileMapBottomPanel'
import { MemberMarker } from './MemberMarker'
import type { MobileMapPanelItem } from './MobileMapBottomPanel'
import type { ElementRef } from 'react'
import type { SpotCategory } from '../../lib/spot-categories'
import type { Id } from '@/src/lib/convexApi'
import type * as ReactNativeMaps from 'react-native-maps'

type ReactNativeMapsModule = typeof ReactNativeMaps
type MapViewRef = ElementRef<ReactNativeMapsModule['default']>

let nativeMaps: ReactNativeMapsModule | null = null

try {
  nativeMaps = require('react-native-maps') as ReactNativeMapsModule
} catch {
  nativeMaps = null
}

const NativeMapView = nativeMaps?.default
const NativeMarker = nativeMaps?.Marker
const FOCUSED_LATITUDE_DELTA = 0.025
const FOCUSED_LONGITUDE_DELTA = 0.025
const USER_LOCATION_LATITUDE_DELTA = 0.035
const USER_LOCATION_LONGITUDE_DELTA = 0.035

export type MobileMapSpot = {
  _id: Id<'spots'>
  name: string
  category: SpotCategory
  latitude: number
  longitude: number
  distanceMiles?: number
  activeCheckInCount?: number
}

export type MobileMapMember = {
  _id: Id<'users'>
  name: string
  imageUrl?: string
  isOnline?: boolean
  lastActive?: number
  distanceMiles?: number
  latitude?: number
  longitude?: number
  profile?: {
    displayName?: string
    age?: number
  } | null
}

export type MobileMapMeetup = {
  _id: Id<'meetups'>
  title: string
  meetupType: string
  locationName?: string
  startsAt: number
  status: string
  attendeeCount: number
  maxAttendees: number
  distanceMiles?: number
  latitude?: number
  longitude?: number
}

type MobileMapSpotPanelItem = MobileMapPanelItem &
  MobileMapSpot & {
    kind: 'spot'
    subtitle: string
  }

type MobileMapMemberPanelItem = MobileMapPanelItem &
  MobileMapMember & {
    kind: 'member'
    subtitle: string | null
  }

type MobileMapMeetupPanelItem = MobileMapPanelItem &
  MobileMapMeetup & {
    kind: 'meetup'
    subtitle: string | null
  }

type MobileMapPanelListItem =
  | MobileMapSpotPanelItem
  | MobileMapMemberPanelItem
  | MobileMapMeetupPanelItem

type MapRegion = {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

export type MobileMapCameraTarget = {
  latitude: number
  longitude: number
  latitudeDelta?: number
  longitudeDelta?: number
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#08090A' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#D0D0D0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#202020' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#070809' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#0B0B0B' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0A0B0D' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1B1B1B' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#050506' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#292929' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#060708' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#111111' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#050505' }],
  },
] as const

const MEETUP_TYPE_LABELS: Record<string, string> = {
  openPlay: 'Open Play',
  pumpAndDump: 'Pump & Dump',
  blowAndGo: 'Blow & Go',
  goonSession: 'Goon Session',
  circleJerk: 'Circle Jerk',
  orgy: 'Orgy',
  chill: 'Chill',
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

export function MobileMap({
  bottomOffset,
  initialRegion,
  isLocationLoading,
  locationError,
  meetups,
  members,
  onClose,
  permissionStatus,
  refreshLocation,
  requestPermission,
  selectedMember,
  selectedMemberId,
  selectedMeetup,
  selectedMeetupId,
  selectedSpot,
  selectedSpotId,
  setSelectedMemberId,
  setSelectedMeetupId,
  setSelectedSpotId,
  spots,
  target,
}: {
  bottomOffset: number
  initialRegion: MapRegion | undefined
  isLocationLoading: boolean
  locationError: string | null
  meetups: Array<MobileMapMeetup>
  members: Array<MobileMapMember>
  onClose: () => void
  permissionStatus: string | null
  refreshLocation: () => Promise<
    { latitude: number; longitude: number } | false
  >
  requestPermission: () => Promise<
    { latitude: number; longitude: number } | false
  >
  selectedMember: MobileMapMember | null
  selectedMemberId: Id<'users'> | null
  selectedMeetup: MobileMapMeetup | null
  selectedMeetupId: Id<'meetups'> | null
  selectedSpot: MobileMapSpot | null
  selectedSpotId: Id<'spots'> | null
  setSelectedMemberId: (memberId: Id<'users'> | null) => void
  setSelectedMeetupId: (meetupId: Id<'meetups'> | null) => void
  setSelectedSpotId: (spotId: Id<'spots'> | null) => void
  spots: Array<MobileMapSpot>
  target: MobileMapCameraTarget | null
}) {
  const router = useRouter()
  const { isAuthenticated, user, workosUser } = useCurrentUser()
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapViewRef | null>(null)
  const profilePhotoUrl = useQuery(
    api.members.getMyPrimaryProfilePhotoUrl,
    isAuthenticated && user ? {} : 'skip',
  )
  const avatarImageUrl =
    profilePhotoUrl ?? user?.imageUrl ?? workosUser?.profilePictureUrl
  const spotPanelItems = useMemo(
    () =>
      spots.slice(0, 12).map((spot) => ({
        ...spot,
        kind: 'spot' as const,
        id: spot._id,
        title: spot.name,
        subtitle:
          formatDistance(spot.distanceMiles) ??
          getSpotCategoryMeta(spot.category).label,
      })),
    [spots],
  )
  const memberPanelItems = useMemo(
    () =>
      members
        .filter(
          (
            member,
          ): member is MobileMapMember & {
            latitude: number
            longitude: number
          } =>
            typeof member.latitude === 'number' &&
            typeof member.longitude === 'number',
        )
        .slice(0, 12)
        .map((member) => ({
          ...member,
          kind: 'member' as const,
          id: member._id,
          title: member.profile?.displayName ?? member.name,
          subtitle: member.isOnline
            ? 'Online'
            : (formatDistance(member.distanceMiles) ?? 'Offline'),
        })),
    [members],
  )
  const meetupPanelItems = useMemo(
    () =>
      meetups
        .filter(
          (
            meetup,
          ): meetup is MobileMapMeetup & {
            latitude: number
            longitude: number
          } =>
            typeof meetup.latitude === 'number' &&
            typeof meetup.longitude === 'number',
        )
        .slice(0, 12)
        .map((meetup) => ({
          ...meetup,
          kind: 'meetup' as const,
          id: meetup._id,
          title: meetup.title,
          subtitle: `${MEETUP_TYPE_LABELS[meetup.meetupType] ?? 'Meetup'} · ${formatMeetupTime(meetup.startsAt)}`,
        })),
    [meetups],
  )
  const panelItems = useMemo<Array<MobileMapPanelListItem>>(
    () => [...memberPanelItems, ...meetupPanelItems, ...spotPanelItems],
    [meetupPanelItems, memberPanelItems, spotPanelItems],
  )
  const selectedSpotPanelItem = useMemo(
    () =>
      selectedSpot
        ? {
            ...selectedSpot,
            kind: 'spot' as const,
            id: selectedSpot._id,
            title: selectedSpot.name,
            subtitle:
              formatDistance(selectedSpot.distanceMiles) ??
              getSpotCategoryMeta(selectedSpot.category).label,
          }
        : null,
    [selectedSpot],
  )
  const selectedMemberPanelItem = useMemo(
    () =>
      selectedMember
        ? {
            ...selectedMember,
            kind: 'member' as const,
            id: selectedMember._id,
            title: selectedMember.profile?.displayName ?? selectedMember.name,
            subtitle: selectedMember.isOnline
              ? 'Online'
              : (formatDistance(selectedMember.distanceMiles) ?? 'Offline'),
          }
        : null,
    [selectedMember],
  )
  const selectedMeetupPanelItem = useMemo(
    () =>
      selectedMeetup
        ? {
            ...selectedMeetup,
            kind: 'meetup' as const,
            id: selectedMeetup._id,
            title: selectedMeetup.title,
            subtitle: `${MEETUP_TYPE_LABELS[selectedMeetup.meetupType] ?? 'Meetup'} · ${formatMeetupTime(selectedMeetup.startsAt)}`,
          }
        : null,
    [selectedMeetup],
  )
  const animateToTarget = (
    nextTarget: MobileMapCameraTarget,
    duration = 650,
  ) => {
    mapRef.current?.animateToRegion(
      {
        latitude: nextTarget.latitude,
        longitude: nextTarget.longitude,
        latitudeDelta: nextTarget.latitudeDelta ?? FOCUSED_LATITUDE_DELTA,
        longitudeDelta: nextTarget.longitudeDelta ?? FOCUSED_LONGITUDE_DELTA,
      },
      duration,
    )
  }

  const handleRefreshLocation = async () => {
    const refreshedLocation = await refreshLocation()
    if (!refreshedLocation) return
    animateToTarget(
      {
        latitude: refreshedLocation.latitude,
        longitude: refreshedLocation.longitude,
        latitudeDelta: USER_LOCATION_LATITUDE_DELTA,
        longitudeDelta: USER_LOCATION_LONGITUDE_DELTA,
      },
      700,
    )
  }

  useEffect(() => {
    if (!selectedSpot || !mapRef.current) return
    mapRef.current.animateToRegion(
      {
        latitude: selectedSpot.latitude,
        longitude: selectedSpot.longitude,
        latitudeDelta: FOCUSED_LATITUDE_DELTA,
        longitudeDelta: FOCUSED_LONGITUDE_DELTA,
      },
      650,
    )
  }, [selectedSpot])

  useEffect(() => {
    if (!target || !mapRef.current) return
    animateToTarget(target)
  }, [target])

  if (permissionStatus !== 'granted' && !isLocationLoading) {
    return (
      <View style={styles.fallback}>
        <MapPin color="#F11A23" size={32} />
        <Text style={styles.emptyTitle}>Location Access</Text>
        <Text style={styles.emptyText}>
          Enable location to open the nearby spots map.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => void requestPermission()}
        >
          <Text style={styles.primaryButtonText}>Enable Location</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onClose}>
          <Text style={styles.secondaryButtonText}>Close</Text>
        </Pressable>
      </View>
    )
  }

  if (isLocationLoading || !initialRegion) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator size="large" color="#F11A23" />
        <Text style={styles.emptyText}>Getting your location...</Text>
      </View>
    )
  }

  if (locationError || !NativeMapView || !NativeMarker) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.emptyTitle}>
          {locationError ? 'Location Error' : 'Map Unavailable'}
        </Text>
        <Text style={styles.emptyText}>
          {locationError ??
            'Rebuild the native app to include react-native-maps.'}
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => void refreshLocation()}
        >
          <Text style={styles.primaryButtonText}>Refresh</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onClose}>
          <Text style={styles.secondaryButtonText}>Close</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <NativeMapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        customMapStyle={DARK_MAP_STYLE as any}
        provider={nativeMaps?.PROVIDER_GOOGLE}
        mapType="standard"
        showsBuildings={false}
        showsPointsOfInterest={false}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle="dark"
        onPress={() => {
          setSelectedSpotId(null)
          setSelectedMemberId(null)
          setSelectedMeetupId(null)
        }}
      >
        {spots.map((spot) => (
          <NativeMarker
            key={spot._id}
            coordinate={{
              latitude: spot.latitude,
              longitude: spot.longitude,
            }}
            onPress={(event) => {
              event.stopPropagation()
              setSelectedSpotId(spot._id)
              setSelectedMemberId(null)
              setSelectedMeetupId(null)
            }}
          >
            <SpotMapMarker
              activeCheckInCount={spot.activeCheckInCount}
              category={spot.category}
              isSelected={selectedSpotId === spot._id}
            />
          </NativeMarker>
        ))}
        {meetups
          .filter(
            (
              meetup,
            ): meetup is MobileMapMeetup & {
              latitude: number
              longitude: number
            } =>
              typeof meetup.latitude === 'number' &&
              typeof meetup.longitude === 'number',
          )
          .map((meetup) => (
            <NativeMarker
              key={meetup._id}
              coordinate={{
                latitude: meetup.latitude,
                longitude: meetup.longitude,
              }}
              onPress={(event) => {
                event.stopPropagation()
                setSelectedMeetupId(meetup._id)
                setSelectedMemberId(null)
                setSelectedSpotId(null)
              }}
            >
              <MeetupMapMarker isSelected={selectedMeetupId === meetup._id} />
            </NativeMarker>
          ))}
        {members
          .filter(
            (
              member,
            ): member is MobileMapMember & {
              latitude: number
              longitude: number
            } =>
              typeof member.latitude === 'number' &&
              typeof member.longitude === 'number',
          )
          .map((member) => (
            <MemberMarker
              key={member._id}
              member={{
                _id: member._id,
                name: member.profile?.displayName ?? member.name,
                imageUrl: member.imageUrl,
                isOnline: member.isOnline,
                lastActive: member.lastActive,
                latitude: member.latitude,
                longitude: member.longitude,
              }}
              isSelected={selectedMemberId === member._id}
              onPress={() => {
                setSelectedMemberId(member._id)
                setSelectedSpotId(null)
                setSelectedMeetupId(null)
              }}
            />
          ))}
      </NativeMapView>

      <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={[styles.topHeader, { top: insets.top + 4 }]}>
          <View style={styles.headerSlot}>
            {isAuthenticated && user ? (
              <Pressable
                accessibilityLabel="Open account menu"
                hitSlop={8}
                style={styles.avatarButton}
                onPress={() => {
                  DeviceEventEmitter.emit(MOBILE_OPEN_SIDE_MENU_EVENT)
                }}
              >
                <Avatar imageUrl={avatarImageUrl} name={user.name} size="md" />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Search map"
              style={styles.headerButton}
              onPress={() => {
                DeviceEventEmitter.emit('mobile-search:/map')
              }}
            >
              <Search color="#FAFAFA" size={21} />
            </Pressable>
            <Pressable
              accessibilityLabel="Close map"
              style={styles.headerButton}
              onPress={onClose}
            >
              <X color="#FAFAFA" size={21} />
            </Pressable>
          </View>
        </View>

        <MobileMapBottomPanel
          bottomOffset={bottomOffset}
          icon={<MapPin color="#F11A23" size={17} />}
          items={panelItems}
          onClose={onClose}
          onRefreshLocation={() => void handleRefreshLocation()}
          onSelectItem={(item) => {
            if (item.kind === 'member') {
              setSelectedMemberId(item._id)
              setSelectedMeetupId(null)
              setSelectedSpotId(null)
              return
            }
            if (item.kind === 'meetup') {
              setSelectedMeetupId(item._id)
              setSelectedMemberId(null)
              setSelectedSpotId(null)
              return
            }
            setSelectedSpotId(item._id)
            setSelectedMemberId(null)
            setSelectedMeetupId(null)
          }}
          renderSelectedItem={(item) =>
            item.kind === 'member' ? (
              <SelectedMemberCard member={item} />
            ) : item.kind === 'meetup' ? (
              <SelectedMeetupCard meetup={item} />
            ) : (
              <SelectedSpotCard spot={item} />
            )
          }
          selectedItem={
            selectedMemberPanelItem ??
            selectedMeetupPanelItem ??
            selectedSpotPanelItem
          }
          title="Nearby"
        />
      </SafeAreaView>
    </View>
  )

  function SelectedSpotCard({ spot }: { spot: MobileMapSpot }) {
    const meta = getSpotCategoryMeta(spot.category)
    const tokens = CATEGORY_COLOR_TOKENS[meta.color]
    const Icon = meta.icon

    return (
      <View style={styles.detailCard}>
        <View style={[styles.cardIcon, { backgroundColor: tokens.bg }]}>
          <Icon color={tokens.fg} size={20} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {spot.name}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {meta.label}
            {formatDistance(spot.distanceMiles)
              ? ` · ${formatDistance(spot.distanceMiles)}`
              : ''}
          </Text>
        </View>
        <Pressable
          style={styles.viewButton}
          onPress={() => {
            onClose()
            router.push(`/(tabs)/map/spots/${spot._id}` as any)
          }}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </Pressable>
      </View>
    )
  }

  function SelectedMemberCard({ member }: { member: MobileMapMember }) {
    const displayName = member.profile?.displayName ?? member.name
    const age = member.profile?.age
    const subtitle = [
      age ? String(age) : null,
      member.isOnline ? 'Online' : 'Offline',
      formatDistance(member.distanceMiles),
    ]
      .filter(Boolean)
      .join(' · ')

    return (
      <View style={styles.detailCard}>
        <Avatar imageUrl={member.imageUrl} name={displayName} size="md" />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {displayName}
          </Text>
          {subtitle ? (
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Pressable
          style={styles.viewButton}
          onPress={() => {
            onClose()
            router.push(`/user/${member._id}` as never)
          }}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </Pressable>
      </View>
    )
  }

  function SelectedMeetupCard({ meetup }: { meetup: MobileMapMeetup }) {
    const subtitle = [
      MEETUP_TYPE_LABELS[meetup.meetupType] ?? 'Meetup',
      formatMeetupTime(meetup.startsAt),
      `${meetup.attendeeCount}/${meetup.maxAttendees}`,
    ].join(' · ')

    return (
      <View style={styles.detailCard}>
        <View style={styles.meetupCardIcon}>
          <CalendarClock color="#FAFAFA" size={20} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {meetup.title}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Pressable
          style={styles.viewButton}
          onPress={() => {
            onClose()
            router.push(`/(tabs)/map/meetups/${meetup._id}` as never)
          }}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </Pressable>
      </View>
    )
  }
}

function SpotMapMarker({
  activeCheckInCount,
  category,
  isSelected,
}: {
  activeCheckInCount?: number
  category: SpotCategory
  isSelected: boolean
}) {
  const meta = getSpotCategoryMeta(category)
  const Icon = meta.icon
  const count = activeCheckInCount ?? 0

  return (
    <View style={styles.markerShell}>
      <View
        style={[
          styles.spotMarker,
          count > 0 && styles.activeSpotMarker,
          isSelected && styles.selectedSpotMarker,
        ]}
      >
        <Icon color="#FAFAFA" size={isSelected ? 18 : 16} />
        {count > 0 ? (
          <View style={styles.spotMarkerBadge}>
            <Text style={styles.spotMarkerBadgeText}>{count}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.spotMarkerPointer} />
    </View>
  )
}

function MeetupMapMarker({ isSelected }: { isSelected: boolean }) {
  return (
    <View style={styles.markerShell}>
      <View
        style={[styles.meetupMarker, isSelected && styles.selectedMeetupMarker]}
      >
        <CalendarClock color="#FAFAFA" size={isSelected ? 18 : 16} />
      </View>
      <View style={styles.meetupMarkerPointer} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
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
  primaryButton: {
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: '#F11A23',
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FAFAFA',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#EDEDED',
    fontSize: 15,
    fontWeight: '700',
  },
  topHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  headerSlot: {
    width: 48,
    height: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(3,3,4,0.82)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(3,3,4,0.82)',
  },
  detailCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#0A0A0B',
    padding: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
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
  cardSubtitle: {
    flexShrink: 1,
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '500',
  },
  meetupCardIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(79, 70, 229, 0.85)',
  },
  viewButton: {
    minWidth: 68,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F11A23',
    paddingHorizontal: 16,
  },
  viewButtonText: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '800',
  },
  markerShell: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 46,
    minHeight: 52,
  },
  spotMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F11A23',
    borderWidth: 2,
    borderColor: '#FAFAFA',
  },
  selectedSpotMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: '#FAFAFA',
  },
  activeSpotMarker: {
    borderColor: 'rgba(255,255,255,0.86)',
  },
  spotMarkerBadge: {
    position: 'absolute',
    top: -6,
    right: -7,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: '#111111',
    paddingHorizontal: 4,
  },
  spotMarkerBadgeText: {
    color: '#FAFAFA',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  spotMarkerPointer: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F11A23',
  },
  meetupMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    borderWidth: 2,
    borderColor: '#FAFAFA',
  },
  selectedMeetupMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: '#FAFAFA',
  },
  meetupMarkerPointer: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#4f46e5',
  },
})
