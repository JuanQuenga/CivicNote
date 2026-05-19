import { useEffect, useMemo, useState } from 'react'
import { DeviceEventEmitter } from 'react-native'
import { useQuery } from 'convex/react'
import { api } from '@/src/lib/convexApi'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { useLocation } from '../../hooks/useLocation'
import { MobileMapOverlay } from './MobileMapOverlay'
import { MobileMap } from './MobileMap'
import type { MobileMapCameraTarget } from './MobileMap'
import type { SpotCategory } from '../../lib/spot-categories'
import type { Id } from '@/src/lib/convexApi'

type SpotMapItem = {
  _id: Id<'spots'>
  name: string
  category: SpotCategory
  latitude: number
  longitude: number
  distanceMiles?: number
  activeCheckInCount?: number
}

type MemberMapItem = {
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

type MeetupMapItem = {
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

const DEFAULT_LATITUDE_DELTA = 0.12
const DEFAULT_LONGITUDE_DELTA = 0.12
const SEARCH_RADIUS_MILES = 50
const OFFLINE_MEMBER_MARKER_RETENTION_MS = 3 * 60 * 60 * 1000

function getBounds(latitude: number, longitude: number, radiusMiles: number) {
  const latDelta = radiusMiles / 69
  const lonDelta = radiusMiles / (69 * Math.cos((latitude * Math.PI) / 180))

  return {
    north: latitude + latDelta,
    south: latitude - latDelta,
    east: longitude + lonDelta,
    west: longitude - lonDelta,
  }
}

const MAP_PANEL_EDGE_GAP = 12

type MobileMapOpenPayload = {
  memberId?: Id<'users'>
  meetupId?: Id<'meetups'>
  spotId?: Id<'spots'>
  target?: MobileMapCameraTarget
}

export function MobileAppMapSheet() {
  const { isAuthenticated } = useCurrentUser()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSpotId, setSelectedSpotId] = useState<Id<'spots'> | null>(null)
  const [requestedSpotId, setRequestedSpotId] = useState<Id<'spots'> | null>(
    null,
  )
  const [requestedMemberId, setRequestedMemberId] =
    useState<Id<'users'> | null>(null)
  const [requestedMeetupId, setRequestedMeetupId] =
    useState<Id<'meetups'> | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<Id<'users'> | null>(
    null,
  )
  const [selectedMeetupId, setSelectedMeetupId] =
    useState<Id<'meetups'> | null>(null)
  const [target, setTarget] = useState<MobileMapCameraTarget | null>(null)
  const {
    location,
    isLoading: isLocationLoading,
    error: locationError,
    permissionStatus,
    requestPermission,
    refreshLocation,
  } = useLocation()

  const bounds = useMemo(() => {
    if (!location) return null
    return getBounds(location.latitude, location.longitude, SEARCH_RADIUS_MILES)
  }, [location])

  const nearbySpots = useQuery(
    api.spots.getNearbySpots,
    isAuthenticated && location && bounds
      ? {
          bounds,
          latitude: location.latitude,
          longitude: location.longitude,
          limit: 80,
        }
      : 'skip',
  ) as Array<SpotMapItem> | undefined

  const requestedSpot = useQuery(
    api.spots.getSpot,
    requestedSpotId ? { spotId: requestedSpotId } : 'skip',
  ) as SpotMapItem | null | undefined
  const nearbyMembers = useQuery(
    api.members.getNearbyUsers,
    isAuthenticated && location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          maxDistanceMiles: SEARCH_RADIUS_MILES,
          limit: 80,
          includeSelf: false,
          withPhotos: false,
          onlineOnly: false,
        }
      : 'skip',
  ) as { users: Array<MemberMapItem> } | undefined
  const requestedMember = useQuery(
    api.members.getMapMember,
    requestedMemberId ? { userId: requestedMemberId } : 'skip',
  ) as MemberMapItem | null | undefined
  const nearbyMeetups = useQuery(
    api.meetups.listUpcomingMeetups,
    isAuthenticated && location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
        }
      : 'skip',
  ) as Array<MeetupMapItem> | undefined
  const requestedMeetup = useQuery(
    api.meetups.getMeetupPublicDetails,
    requestedMeetupId
      ? {
          meetupId: requestedMeetupId,
          latitude: location?.latitude,
          longitude: location?.longitude,
        }
      : 'skip',
  ) as MeetupMapItem | null | undefined

  const mapSpots = useMemo(() => {
    const spots = nearbySpots ?? []
    if (
      !requestedSpot ||
      spots.some((spot) => spot._id === requestedSpot._id)
    ) {
      return spots
    }
    return [requestedSpot, ...spots]
  }, [nearbySpots, requestedSpot])

  const mapMembers = useMemo(() => {
    const members = nearbyMembers?.users ?? []
    const visibleMembers = members.filter((member) => {
      if (member.isOnline === true) return true
      if (member._id === requestedMemberId) return true
      return (
        typeof member.lastActive === 'number' &&
        Date.now() - member.lastActive <= OFFLINE_MEMBER_MARKER_RETENTION_MS
      )
    })

    if (!requestedMember) {
      return visibleMembers
    }
    if (visibleMembers.some((member) => member._id === requestedMember._id)) {
      return visibleMembers
    }
    return [requestedMember, ...visibleMembers]
  }, [nearbyMembers?.users, requestedMember, requestedMemberId])

  const mapMeetups = useMemo(() => {
    const meetups = nearbyMeetups ?? []
    if (
      !requestedMeetup ||
      meetups.some((meetup) => meetup._id === requestedMeetup._id)
    ) {
      return meetups
    }
    return [requestedMeetup, ...meetups]
  }, [nearbyMeetups, requestedMeetup])

  const selectedSpot = useMemo(
    () => mapSpots.find((spot) => spot._id === selectedSpotId) ?? null,
    [mapSpots, selectedSpotId],
  )
  const selectedMeetup = useMemo(
    () => mapMeetups.find((meetup) => meetup._id === selectedMeetupId) ?? null,
    [mapMeetups, selectedMeetupId],
  )
  const selectedMember = useMemo(
    () => mapMembers.find((member) => member._id === selectedMemberId) ?? null,
    [mapMembers, selectedMemberId],
  )

  const initialRegion = useMemo(() => {
    if (!location) return undefined
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: DEFAULT_LATITUDE_DELTA,
      longitudeDelta: DEFAULT_LONGITUDE_DELTA,
    }
  }, [location])

  useEffect(() => {
    const toggleSubscription = DeviceEventEmitter.addListener(
      'mobile-map:toggle',
      () => {
        setIsOpen((current) => !current)
      },
    )
    const openSubscription = DeviceEventEmitter.addListener(
      'mobile-map:open',
      (payload?: MobileMapOpenPayload) => {
        if (payload?.spotId) {
          setRequestedSpotId(payload.spotId)
          setSelectedSpotId(payload.spotId)
        }
        if (payload?.memberId) {
          setRequestedMemberId(payload.memberId)
          setSelectedMemberId(payload.memberId)
          setSelectedMeetupId(null)
          setSelectedSpotId(null)
        }
        if (payload?.meetupId) {
          setRequestedMeetupId(payload.meetupId)
          setSelectedMeetupId(payload.meetupId)
          setSelectedMemberId(null)
          setSelectedSpotId(null)
        }
        if (payload?.target) {
          setTarget(payload.target)
        }
        setIsOpen(true)
      },
    )
    const closeSubscription = DeviceEventEmitter.addListener(
      'mobile-map:close',
      () => {
        setIsOpen(false)
      },
    )

    return () => {
      toggleSubscription.remove()
      openSubscription.remove()
      closeSubscription.remove()
    }
  }, [])

  const close = () => setIsOpen(false)

  return (
    <MobileMapOverlay isOpen={isOpen}>
      <MobileMap
        bottomOffset={MAP_PANEL_EDGE_GAP}
        initialRegion={initialRegion}
        isLocationLoading={isLocationLoading}
        locationError={locationError}
        onClose={close}
        permissionStatus={permissionStatus}
        refreshLocation={refreshLocation}
        requestPermission={requestPermission}
        meetups={mapMeetups}
        selectedMember={selectedMember}
        selectedMemberId={selectedMemberId}
        selectedMeetup={selectedMeetup}
        selectedMeetupId={selectedMeetupId}
        selectedSpot={selectedSpot}
        selectedSpotId={selectedSpotId}
        setSelectedMemberId={setSelectedMemberId}
        setSelectedMeetupId={setSelectedMeetupId}
        setSelectedSpotId={setSelectedSpotId}
        members={mapMembers}
        spots={mapSpots}
        target={target}
      />
    </MobileMapOverlay>
  )
}
