import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery } from 'convex/react'
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  CalendarClock,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../../src/components/auth/AuthGate'
import { ResolvedImage } from '../../src/components/ui/ResolvedImage'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { useLocation } from '../../src/hooks/useLocation'
import type { ReactNode } from 'react'
import type { Id } from '@/src/lib/convexApi'

const MEETUP_TYPE_LABELS: Record<string, string> = {
  openPlay: 'Open Play',
  pumpAndDump: 'Pump & Dump',
  blowAndGo: 'Blow & Go',
  goonSession: 'Goon Session',
  circleJerk: 'Circle Jerk',
  orgy: 'Orgy',
  chill: 'Chill',
  other: 'Other',
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  myPlace: 'My Place',
  neutralZone: 'Neutral Zone',
  onTheGo: 'On The Go',
  hotel: 'Hotel',
  bathhouse: 'Bathhouse',
  outdoor: 'Outdoor',
}

const RULE_LABELS: Record<string, string> = {
  safeSexOnly: 'Safe Sex Only',
  noPhotosOrVideo: 'No Photos/Video',
  noRecording: 'No Recording',
  discretionRequired: 'Discretion Required',
  noSubstances: 'No Substances',
  bringYourOwn: 'BYOS',
  respectBoundaries: 'Respect Boundaries',
  noSpectators: 'No Spectators',
}

type MeetupDetails = {
  _id: Id<'meetups'>
  conversationId: Id<'conversations'>
  hostName: string
  title: string
  description?: string
  directions?: string
  address?: string
  locationType: string
  locationName?: string
  latitude?: number
  longitude?: number
  startsAt: number
  duration: number
  endsAt: number
  meetupType: string
  rules?: Array<string>
  photos?: Array<{ url: string; key: string }>
  maxAttendees: number
  approvalRequired: boolean
  status: string
  attendeeCount: number
  isMember: boolean
  isHost: boolean
  distanceMiles?: number
}

function asMeetupId(value: string | Array<string> | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  return raw as Id<'meetups'> | undefined
}

function formatMeetupDateTime(
  timestamp: number,
  options?: { includeWeekday?: boolean },
): string {
  const date = new Date(timestamp)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const timeLabel = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  if (date.toDateString() === now.toDateString()) return `Today at ${timeLabel}`
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${timeLabel}`
  }

  return `${date.toLocaleDateString([], {
    weekday: options?.includeWeekday ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
  })} at ${timeLabel}`
}

function formatDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
}

function formatDistance(miles?: number): string | null {
  if (miles === undefined) return null
  if (miles < 1) return `${Math.round(miles * 5280)} ft away`
  return `${miles.toFixed(1)} mi away`
}

function getStatusLabel(status: string) {
  if (status === 'active') return 'Active Now'
  if (status === 'upcoming') return 'Upcoming'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'ended') return 'Ended'
  return status
}

export default function MeetupDetailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ meetupId?: string }>()
  const meetupId = asMeetupId(params.meetupId)
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const { location } = useLocation()

  const meetup = useQuery(
    api.meetups.getMeetupPublicDetails,
    meetupId
      ? {
          meetupId,
          latitude: location?.latitude,
          longitude: location?.longitude,
        }
      : 'skip',
  ) as MeetupDetails | null | undefined

  const myRequest = useQuery(
    api.meetups.getMyMeetupRequest,
    meetupId && meetup && !meetup.isMember ? { meetupId } : 'skip',
  )

  const requestToJoin = useMutation(api.meetups.requestToJoinMeetup)
  const cancelMeetup = useMutation(api.meetups.cancelMeetup)
  const endMeetup = useMutation(api.meetups.endMeetup)

  const handleRequestJoin = async () => {
    if (!meetupId || !meetup) return
    try {
      await requestToJoin({ meetupId })
      Alert.alert(
        meetup.approvalRequired ? 'Request sent' : 'Joined',
        meetup.approvalRequired
          ? 'The host will review your request.'
          : 'You joined this meetup.',
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not join meetup'
      Alert.alert('Meetup failed', message)
    }
  }

  const handleCancel = () => {
    if (!meetupId) return
    Alert.alert('Cancel meetup?', 'This marks the meetup as cancelled.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Meetup',
        style: 'destructive',
        onPress: () => {
          cancelMeetup({ meetupId }).catch((error) => {
            const message =
              error instanceof Error ? error.message : 'Could not cancel meetup'
            Alert.alert('Cancel failed', message)
          })
        },
      },
    ])
  }

  const handleEnd = () => {
    if (!meetupId) return
    Alert.alert('End meetup?', 'This ends the meetup now.', [
      { text: 'Keep Open', style: 'cancel' },
      {
        text: 'End Meetup',
        style: 'destructive',
        onPress: () => {
          endMeetup({ meetupId }).catch((error) => {
            const message =
              error instanceof Error ? error.message : 'Could not end meetup'
            Alert.alert('End failed', message)
          })
        },
      },
    ])
  }

  const handleShowOnMap = () => {
    if (
      !meetup ||
      typeof meetup.latitude !== 'number' ||
      typeof meetup.longitude !== 'number'
    ) {
      return
    }

    DeviceEventEmitter.emit('mobile-map:open', {
      meetupId,
      target: {
        latitude: meetup.latitude,
        longitude: meetup.longitude,
      },
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F11A23" />
      </SafeAreaView>
    )
  }

  if (!isAuthenticated || !user) {
    return <AuthGate title="Meetup" description="Sign in to view meetups." />
  }

  if (!meetupId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-base text-muted-foreground">
          Meetup not found.
        </Text>
      </SafeAreaView>
    )
  }

  if (meetup === undefined) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F11A23" />
      </SafeAreaView>
    )
  }

  if (!meetup) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <CalendarClock color="#999999" size={44} />
        <Text className="mt-3 text-center text-base text-muted-foreground">
          This meetup is no longer available.
        </Text>
      </SafeAreaView>
    )
  }

  const isPending =
    myRequest &&
    typeof myRequest === 'object' &&
    'status' in myRequest &&
    myRequest.status === 'pending'
  const isFull = meetup.attendeeCount >= meetup.maxAttendees
  const coverPhotoUrl = meetup.photos?.[0]?.url
  const capacityPercent = Math.min(
    100,
    meetup.maxAttendees > 0
      ? (meetup.attendeeCount / meetup.maxAttendees) * 100
      : 0,
  )
  const distanceLabel = formatDistance(meetup.distanceMiles)

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        {coverPhotoUrl ? (
          <ResolvedImage
            uri={coverPhotoUrl}
            contentFit="cover"
            style={{ width: '100%', height: 220 }}
          />
        ) : (
          <View className="mx-4 mt-3 h-44 items-center justify-center rounded-2xl bg-primary/15">
            <CalendarClock color="#F11A23" size={48} />
          </View>
        )}

        <View className="mx-4 mt-5">
          <View className="flex-row flex-wrap gap-2">
            <View className="rounded-full bg-primary/15 px-3 py-1">
              <Text className="text-xs font-semibold text-primary">
                {getStatusLabel(meetup.status)}
              </Text>
            </View>
            <View className="rounded-full bg-muted px-3 py-1">
              <Text className="text-xs font-semibold text-foreground">
                {MEETUP_TYPE_LABELS[meetup.meetupType] ?? meetup.meetupType}
              </Text>
            </View>
          </View>

          <Text className="mt-3 text-2xl font-bold text-foreground">
            {meetup.title}
          </Text>

          <View className="mt-5 gap-4">
            <InfoRow
              iconBg="rgba(14, 165, 233, 0.12)"
              icon={<Clock color="#38bdf8" size={20} />}
              title={formatMeetupDateTime(meetup.startsAt, {
                includeWeekday: true,
              })}
              subtitle={`${formatDurationLabel(
                meetup.duration,
              )} · Ends ${formatMeetupDateTime(meetup.endsAt)}`}
            />
            <InfoRow
              iconBg="rgba(244, 63, 94, 0.12)"
              icon={<MapPin color="#fb7185" size={20} />}
              title={
                LOCATION_TYPE_LABELS[meetup.locationType] ?? meetup.locationType
              }
              subtitle={[
                meetup.locationName,
                meetup.isMember ? meetup.address : distanceLabel,
              ]
                .filter(Boolean)
                .join(' · ')}
            />
            {typeof meetup.latitude === 'number' &&
            typeof meetup.longitude === 'number' ? (
              <Pressable
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3"
                onPress={handleShowOnMap}
              >
                <MapPin color="#FAFAFA" size={17} />
                <Text className="text-sm font-semibold text-foreground">
                  Show on Map
                </Text>
              </Pressable>
            ) : null}
            <View className="rounded-2xl border border-border bg-card p-4">
              <View className="flex-row items-center gap-3">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)' }}
                >
                  <Users color="#a78bfa" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    {meetup.attendeeCount}/{meetup.maxAttendees} attendees
                  </Text>
                  <View className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {meetup.directions && meetup.isMember ? (
            <View className="mt-4 flex-row items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <View
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.18)' }}
              >
                <Navigation color="#fbbf24" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase text-amber-400">
                  Directions (Private)
                </Text>
                <Text className="mt-2 text-sm leading-5 text-foreground">
                  {meetup.directions}
                </Text>
              </View>
            </View>
          ) : null}

          {meetup.rules && meetup.rules.length > 0 ? (
            <View className="mt-4 rounded-2xl border border-border bg-card p-4">
              <View className="mb-3 flex-row items-center gap-2">
                <ShieldCheck color="#f59e0b" size={18} />
                <Text className="text-sm font-semibold text-foreground">
                  Rules
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {meetup.rules.map((rule) => (
                  <View
                    key={rule}
                    className="rounded-full bg-amber-500/10 px-3 py-1"
                  >
                    <Text className="text-xs font-semibold text-amber-400">
                      {RULE_LABELS[rule] ?? rule}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {meetup.description ? (
            <View className="mt-4 rounded-2xl border border-border bg-card p-4">
              <Text className="text-sm leading-5 text-foreground">
                {meetup.description}
              </Text>
            </View>
          ) : null}

          <Text className="mt-4 text-sm text-muted-foreground">
            Hosted by{' '}
            <Text className="font-semibold text-foreground">
              {meetup.hostName}
            </Text>
            {meetup.approvalRequired ? ' · Approval required' : ''}
          </Text>

          <View className="mt-5 gap-3">
            {meetup.isMember ? (
              <Pressable
                onPress={() =>
                  router.push(
                    `/(tabs)/messages/conversations/${meetup.conversationId}` as never,
                  )
                }
                className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4"
              >
                <MessageCircle color="#FAFAFA" size={20} />
                <Text className="text-base font-semibold text-primary-foreground">
                  Open Meetup Chat
                </Text>
              </Pressable>
            ) : isPending ? (
              <View className="items-center rounded-2xl border border-border bg-card px-4 py-4">
                <Text className="text-base font-semibold text-muted-foreground">
                  Request Pending
                </Text>
              </View>
            ) : isFull ? (
              <View className="items-center rounded-2xl border border-border bg-card px-4 py-4">
                <Text className="text-base font-semibold text-muted-foreground">
                  Meetup is Full
                </Text>
              </View>
            ) : meetup.status === 'cancelled' || meetup.status === 'ended' ? (
              <View className="items-center rounded-2xl border border-border bg-card px-4 py-4">
                <Text className="text-base font-semibold text-muted-foreground">
                  {meetup.status === 'cancelled'
                    ? 'Meetup Cancelled'
                    : 'Meetup Ended'}
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={() => void handleRequestJoin()}
                className="items-center rounded-2xl bg-primary px-4 py-4"
              >
                <Text className="text-base font-semibold text-primary-foreground">
                  {meetup.approvalRequired ? 'Request to Join' : 'Join Meetup'}
                </Text>
              </Pressable>
            )}

            {meetup.isHost &&
            meetup.status !== 'cancelled' &&
            meetup.status !== 'ended' ? (
              <View className="flex-row gap-3">
                {meetup.status === 'active' ? (
                  <Pressable
                    onPress={handleEnd}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <CalendarClock color="#FAFAFA" size={17} />
                    <Text className="text-sm font-semibold text-foreground">
                      End Early
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={handleCancel}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3"
                >
                  <XCircle color="#ef4444" size={17} />
                  <Text className="text-sm font-semibold text-red-500">
                    Cancel
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({
  icon,
  iconBg,
  title,
  subtitle,
}: {
  icon: ReactNode
  iconBg?: string
  title: string
  subtitle?: string
}) {
  return (
    <View className="flex-row items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <View
        className={`h-10 w-10 items-center justify-center rounded-xl ${
          iconBg ? '' : 'bg-muted'
        }`}
        style={iconBg ? { backgroundColor: iconBg } : undefined}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        {subtitle ? (
          <Text className="mt-1 text-xs leading-5 text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
