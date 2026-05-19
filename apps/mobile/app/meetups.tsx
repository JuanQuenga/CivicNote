import { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
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
import { CalendarClock, MapPin, Search, Users } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../src/components/auth/AuthGate'
import { useCurrentUser } from '../src/hooks/useCurrentUser'
import { useLocation } from '../src/hooks/useLocation'
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

type MeetupListItem = {
  _id: Id<'meetups'>
  title: string
  description?: string
  meetupType: string
  locationType: string
  locationName?: string
  startsAt: number
  duration: number
  maxAttendees: number
  approvalRequired: boolean
  status: string
  hostName: string
  attendeeCount: number
  isMember: boolean
  isHost: boolean
  distanceMiles?: number
}

function formatMeetupDateTime(timestamp: number): string {
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
    month: 'short',
    day: 'numeric',
  })} at ${timeLabel}`
}

function formatDistance(miles?: number): string | null {
  if (miles === undefined) return null
  if (miles < 1) return `${Math.round(miles * 5280)} ft`
  return `${miles.toFixed(1)} mi`
}

function statusColor(status: string) {
  if (status === 'active') return 'text-green-500'
  if (status === 'cancelled' || status === 'ended') return 'text-red-500'
  return 'text-sky-400'
}

export default function MeetupsScreen() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const { location } = useLocation()
  const [query, setQuery] = useState('')

  const meetups = useQuery(
    api.meetups.listUpcomingMeetups,
    isAuthenticated
      ? {
          latitude: location?.latitude,
          longitude: location?.longitude,
        }
      : 'skip',
  ) as Array<MeetupListItem> | undefined

  const requestToJoin = useMutation(api.meetups.requestToJoinMeetup)

  const filteredMeetups = useMemo(() => {
    if (!meetups) return []
    const normalized = query.trim().toLowerCase()
    if (!normalized) return meetups

    return meetups.filter((meetup) => {
      const haystack = [
        meetup.title,
        meetup.description,
        meetup.locationName,
        meetup.hostName,
        MEETUP_TYPE_LABELS[meetup.meetupType],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }, [meetups, query])

  const handleJoin = async (meetup: MeetupListItem) => {
    try {
      await requestToJoin({ meetupId: meetup._id })
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
        title="Meetups"
        description="Sign in to browse nearby meetups."
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="border-b border-border bg-background px-4 pb-3 pt-3">
        <Text className="text-2xl font-bold text-foreground">Meetups</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Upcoming and active community plans.
        </Text>
        <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Search color="#999999" size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search meetups"
            placeholderTextColor="#999999"
            className="flex-1 py-3 text-base text-foreground"
          />
        </View>
      </View>

      {meetups === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#F11A23" />
        </View>
      ) : (
        <FlatList
          data={filteredMeetups}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <CalendarClock color="#999999" size={42} />
              <Text className="mt-3 text-base font-semibold text-foreground">
                {query.trim() ? 'No meetups found' : 'No meetups yet'}
              </Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                {query.trim()
                  ? 'Try a different search term.'
                  : 'Create meetups from messages on the web PWA.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isFull = item.attendeeCount >= item.maxAttendees
            const distanceLabel = formatDistance(item.distanceMiles)

            return (
              <Pressable
                className="rounded-2xl border border-border bg-card p-4"
                onPress={() =>
                  router.push(`/(tabs)/map/meetups/${item._id}` as never)
                }
              >
                <View className="flex-row gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
                    <CalendarClock color="#F11A23" size={22} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-3">
                      <Text className="flex-1 text-base font-semibold text-foreground">
                        {item.title}
                      </Text>
                      <Text
                        className={`text-xs font-semibold ${statusColor(
                          item.status,
                        )}`}
                      >
                        {item.status === 'active' ? 'Active' : item.status}
                      </Text>
                    </View>

                    <Text className="mt-1 text-sm text-muted-foreground">
                      {MEETUP_TYPE_LABELS[item.meetupType] ?? item.meetupType}
                      {item.locationName ? ` · ${item.locationName}` : ''}
                      {distanceLabel ? ` · ${distanceLabel}` : ''}
                    </Text>

                    <View className="mt-3 flex-row flex-wrap gap-2">
                      <View className="flex-row items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <CalendarClock color="#999999" size={13} />
                        <Text className="text-xs text-muted-foreground">
                          {formatMeetupDateTime(item.startsAt)}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Users color="#999999" size={13} />
                        <Text className="text-xs text-muted-foreground">
                          {item.attendeeCount}/{item.maxAttendees}
                        </Text>
                      </View>
                      {item.isMember ? (
                        <View className="rounded-full bg-primary/15 px-2.5 py-1">
                          <Text className="text-xs font-semibold text-primary">
                            Joined
                          </Text>
                        </View>
                      ) : isFull ? (
                        <View className="rounded-full bg-muted px-2.5 py-1">
                          <Text className="text-xs text-muted-foreground">
                            Full
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View className="mt-3 flex-row items-center justify-between">
                      <Text className="text-xs text-muted-foreground">
                        Hosted by {item.hostName}
                      </Text>
                      {!item.isMember && !isFull ? (
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation()
                            void handleJoin(item)
                          }}
                          className="rounded-full bg-primary px-3 py-1.5"
                        >
                          <Text className="text-xs font-semibold text-primary-foreground">
                            {item.approvalRequired ? 'Request' : 'Join'}
                          </Text>
                        </Pressable>
                      ) : (
                        <MapPin color="#999999" size={16} />
                      )}
                    </View>
                  </View>
                </View>
              </Pressable>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
