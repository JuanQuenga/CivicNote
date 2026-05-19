import { useCallback, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery } from 'convex/react'
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Ban,
  BedDouble,
  Car,
  ChevronLeft,
  Clock,
  DoorOpen,
  Droplets,
  Flag,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  MoreVertical,
  Shield,
  TreePine,
  User,
  Users,
  Video,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../../src/components/auth/AuthGate'
import { ResolvedImage } from '../../src/components/ui/ResolvedImage'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import type { Id } from '@/src/lib/convexApi'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PHOTO_HEIGHT = SCREEN_WIDTH * (4 / 3)

function asUserId(value: string | Array<string> | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  return raw as Id<'users'> | undefined
}

const calculateDistanceMiles = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 3959
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const formatDistance = (miles: number | undefined): string | null => {
  if (miles === undefined) return null
  if (miles < 0.5) return 'Nearby'
  if (miles < 1) return '< 1 mi'
  return `~${Math.round(miles)} mi`
}

const formatHeight = (inches: number) => {
  const feet = Math.floor(inches / 12)
  const remainingInches = inches % 12
  return `${feet}'${remainingInches}"`
}

const formatLabel = (id: string) => {
  if (id === 'not_saying') return 'Ask Me'
  return id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const getPositionLabel = (position: string) => {
  const labels: Record<string, string> = {
    top: 'Top',
    bottom: 'Bottom',
    vers_top: 'Vers Top',
    vers_bottom: 'Vers Bottom',
    vers: 'Versatile',
    side: 'Side',
  }
  return labels[position] || formatLabel(position)
}

const lookingForLabel = (value: string) => {
  const labels: Record<string, string> = {
    chat: 'Chat & Friends',
    dates: 'Dates',
    fun: 'Fun',
    relationship: 'Relationship',
    network: 'Networking',
    open: 'Open to Anything',
  }
  return labels[value] || formatLabel(value)
}

const formatJoinDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const formatTimeRemaining = (expiresAt: number) => {
  const now = Date.now()
  const remaining = expiresAt - now
  if (remaining <= 0) return 'Expired'
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}

const getLastSeenText = (lastActive?: number, isOnline?: boolean) => {
  if (isOnline) return 'Online'
  if (!lastActive) return 'Offline'
  const diff = Date.now() - lastActive
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Online'
  if (minutes < 60) return `Active ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Active ${hours}h ago`
  return 'Active yesterday'
}

const buildStatsLine = (profile: {
  age?: number
  height?: number
  weight?: number
  position?: string
  endowment?: string
}) => {
  const parts: Array<string> = []
  if (profile.age) parts.push(`${profile.age}`)
  if (profile.height) parts.push(formatHeight(profile.height))
  if (profile.weight) parts.push(`${profile.weight} lbs`)
  if (profile.position) parts.push(getPositionLabel(profile.position))
  if (profile.endowment) {
    const val = profile.endowment
    parts.push(!isNaN(parseFloat(val)) ? `${val}"` : formatLabel(val))
  }
  return parts.join(' · ')
}

const hostingTypeIcons: Record<
  string,
  { label: string; Icon: React.ComponentType<{ size: number; color: string }> }
> = {
  '1on1': { label: '1 on 1', Icon: User },
  group: { label: 'Group', Icon: Users },
  gloryhole: { label: 'Gloryhole', Icon: DoorOpen },
  carFun: { label: 'Car Fun', Icon: Car },
  livePlay: { label: 'Live Play', Icon: Video },
  bathhouse: { label: 'Bathhouse', Icon: Droplets },
  hotel: { label: 'Hotel', Icon: BedDouble },
  outdoor: { label: 'Outdoor', Icon: TreePine },
}

function StatusDot({
  isOnline,
  size = 10,
}: {
  isOnline?: boolean
  size?: number
}) {
  return (
    <View
      className={`rounded-full ${isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'}`}
      style={{ width: size, height: size }}
    />
  )
}

function StatsRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-border/50 py-2.5 last:border-b-0">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  )
}

function PhotoFadeOverlay() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[
        'rgba(0,0,0,0)',
        'rgba(0,0,0,0.12)',
        'rgba(0,0,0,0.42)',
        'rgba(0,0,0,0.88)',
        '#000000',
      ]}
      locations={[0, 0.28, 0.58, 0.84, 1]}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 220,
      }}
    />
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon?: React.ComponentType<{ size: number; color: string }>
  children: React.ReactNode
}) {
  return (
    <View className="overflow-hidden rounded-3xl border border-border/60 bg-card">
      <View className="flex-row items-center gap-2 px-4 pb-1 pt-4">
        {Icon && <Icon size={16} color="#a1a1aa" />}
        <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          {title}
        </Text>
      </View>
      <View className="px-4 pb-3">{children}</View>
    </View>
  )
}

function LookingNowBanner({
  post,
}: {
  post: {
    message?: string | null
    expiresAt: number
    canHost?: boolean | null
    hostingType?: string | null
    iAmPosition?: string | null
    locationName?: string | null
  }
}) {
  const availLabel =
    post.canHost === true
      ? "I'm Hosting Now"
      : post.canHost === false
        ? "I'm Mobile Now"
        : undefined
  const typeInfo = post.hostingType
    ? hostingTypeIcons[post.hostingType]
    : undefined
  const TypeIcon = typeInfo?.Icon
  const hasDetails = availLabel || typeInfo

  return (
    <View className="mb-3 space-y-2">
      <View className="flex-row flex-wrap items-center gap-1.5 self-start rounded-2xl bg-muted/60 px-3 py-2">
        <View className="relative mr-1 h-2 w-2">
          <View className="absolute h-2 w-2 animate-ping rounded-full bg-red-400 opacity-75" />
          <View className="relative h-2 w-2 rounded-full bg-red-500" />
        </View>
        {hasDetails ? (
          <>
            {availLabel && (
              <View className="flex-row items-center gap-1">
                {post.canHost ? (
                  <Home size={14} color="#F11A23" />
                ) : (
                  <Car size={14} color="#F11A23" />
                )}
                <Text className="font-medium text-primary">{availLabel}</Text>
              </View>
            )}
            {typeInfo && (
              <>
                {availLabel && (
                  <Text className="text-muted-foreground/50">·</Text>
                )}
                <View className="flex-row items-center gap-1">
                  {TypeIcon && <TypeIcon size={14} color="#a1a1aa" />}
                  <Text className="text-sm">{typeInfo.label}</Text>
                </View>
              </>
            )}
          </>
        ) : (
          <Text className="font-medium text-primary">Looking Now</Text>
        )}
        <Text className="text-muted-foreground/50">·</Text>
        <View className="flex-row items-center gap-1">
          <Clock size={12} color="#a1a1aa" />
          <Text className="text-xs text-muted-foreground">
            {formatTimeRemaining(post.expiresAt)}
          </Text>
        </View>
      </View>
      {post.message && (
        <Text className="px-1 text-sm text-muted-foreground">
          {post.message}
        </Text>
      )}
      {post.iAmPosition && (
        <View className="px-1">
          <View className="self-start rounded-md bg-muted px-2 py-0.5">
            <Text className="text-xs text-muted-foreground">
              {getPositionLabel(post.iAmPosition)}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default function UserProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ userId?: string }>()
  const userId = asUserId(params.userId)

  const { isAuthenticated, isLoading, user: currentUser } = useCurrentUser()
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showMenu, setShowMenu] = useState(false)

  // Fetch user data
  const user = useQuery(
    api.members.getUser,
    currentUser?._id && userId ? { userId } : 'skip',
  )
  const profile = useQuery(api.members.getProfile, userId ? { userId } : 'skip')
  const currentUserProfile = useQuery(
    api.members.getProfile,
    currentUser?._id ? { userId: currentUser._id } : 'skip',
  )
  const profilePhotos = useQuery(
    api.members.getProfilePhotos,
    userId ? { userId } : 'skip',
  )
  const lookingNowPost = useQuery(
    api.lookingNow.getUserActivePost,
    userId ? { userId } : 'skip',
  )

  // Mutations
  const startConversation = useMutation(api.messages.startConversation)
  const blockUser = useMutation(api.members.blockUser)
  const reportUser = useMutation(api.members.reportUser)

  // Touch handling for photo swiping
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const minSwipeDistance = 50

  const photos =
    (profilePhotos
      ?.map((photo: { url?: string | null }) => photo.url ?? undefined)
      .filter(Boolean) as Array<string>) ?? []
  const hasMultiplePhotos = photos.length > 1
  const currentPhoto = photos[currentPhotoIndex]

  const handleTouchStart = useCallback((x: number) => {
    touchEndX.current = null
    touchStartX.current = x
  }, [])

  const handleTouchMove = useCallback((x: number) => {
    touchEndX.current = x
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return

    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && hasMultiplePhotos) {
      setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
    } else if (isRightSwipe && hasMultiplePhotos) {
      setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
    }

    touchStartX.current = null
    touchEndX.current = null
  }, [hasMultiplePhotos, photos.length])

  const handleMessage = async () => {
    if (!currentUser?._id || !userId) return
    try {
      const result = await startConversation({
        otherUserId: userId,
      })
      router.push(`/(tabs)/messages/conversations/${result.conversationId}`)
    } catch {
      Alert.alert('Error', 'Failed to start conversation')
    }
  }

  const handleShowOnMap = () => {
    if (
      typeof profile?.latitude !== 'number' ||
      typeof profile.longitude !== 'number'
    ) {
      return
    }

    DeviceEventEmitter.emit('mobile-map:open', {
      memberId: userId,
      target: {
        latitude: profile.latitude,
        longitude: profile.longitude,
      },
    })
  }

  const handleBlockUser = () => {
    if (!currentUser?._id || !userId) return
    Alert.alert(
      'Block this user?',
      'They will no longer be able to find or message you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            blockUser({ blockedId: userId })
              .then(() => router.replace('/(tabs)/members' as never))
              .catch((error) => {
                const message =
                  error instanceof Error
                    ? error.message
                    : 'Failed to block user'
                Alert.alert('Block failed', message)
              })
          },
        },
      ],
    )
  }

  const handleReportUser = () => {
    if (!currentUser?._id || !userId) return
    Alert.alert('Report this user', 'Choose the closest reason.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Harassment',
        onPress: () =>
          void submitUserReport({
            reporterId: currentUser._id,
            reportedId: userId,
            reason: 'harassment',
          }),
      },
      {
        text: 'Spam or scam',
        onPress: () =>
          void submitUserReport({
            reporterId: currentUser._id,
            reportedId: userId,
            reason: 'scam',
          }),
      },
      {
        text: 'Underage',
        onPress: () =>
          void submitUserReport({
            reporterId: currentUser._id,
            reportedId: userId,
            reason: 'underage',
          }),
      },
    ])
  }

  const submitUserReport = async (args: {
    reporterId: Id<'users'>
    reportedId: Id<'users'>
    reason: 'harassment' | 'scam' | 'underage'
  }) => {
    try {
      await reportUser(args)
      Alert.alert('Report submitted', 'Thanks. Our team will review it.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to submit report'
      Alert.alert('Report failed', message)
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F11A23" />
      </View>
    )
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <AuthGate
        title="Profile"
        description="Sign in to view member profiles."
      />
    )
  }

  if (!userId) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-base font-normal text-muted-foreground">
          User not found.
        </Text>
      </View>
    )
  }

  if (!user || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F11A23" />
      </View>
    )
  }

  const displayName = profile.displayName || user.name
  const initials = displayName?.slice(0, 2).toUpperCase() ?? '??'

  // Calculate distance
  const distanceMiles =
    user.showDistance !== false &&
    currentUserProfile?.latitude !== undefined &&
    currentUserProfile.longitude !== undefined &&
    profile.latitude !== undefined &&
    profile.longitude !== undefined
      ? calculateDistanceMiles(
          currentUserProfile.latitude,
          currentUserProfile.longitude,
          profile.latitude,
          profile.longitude,
        )
      : undefined

  const statsLine = buildStatsLine({
    age: user?.hideAge ? undefined : profile.age,
    height: profile.height,
    weight: profile.weight,
    position: profile.position,
    endowment: profile.endowment,
  })

  const hasBodyStats =
    profile.position ||
    profile.lookingFor ||
    profile.height ||
    profile.weight ||
    profile.bodyType ||
    profile.ethnicity ||
    profile.endowment

  const hasHealth = profile.hivStatus || profile.lastTested || profile.onPrep

  const hasInterests =
    (profile.interests && profile.interests.length > 0) ||
    (profile.tribes && profile.tribes.length > 0)

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Safe area spacer */}
        <View style={{ height: insets.top }} className="bg-black" />

        {/* Hero Photo Carousel */}
        <View className="relative bg-black" style={{ height: PHOTO_HEIGHT }}>
          <Pressable
            className="h-full w-full"
            onTouchStart={(e) => handleTouchStart(e.nativeEvent.locationX)}
            onTouchMove={(e) => handleTouchMove(e.nativeEvent.locationX)}
            onTouchEnd={handleTouchEnd}
          >
            {currentPhoto ? (
              <ResolvedImage
                uri={currentPhoto}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <View className="h-full w-full items-center justify-center bg-muted">
                <Text className="text-5xl font-bold text-muted-foreground/30">
                  {initials}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Progress bars at top */}
          {hasMultiplePhotos && (
            <View className="absolute left-2 right-2 top-2 flex-row gap-1">
              {photos.map((_, index) => (
                <View
                  key={index}
                  className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
                >
                  <View
                    className={`h-full rounded-full ${index <= currentPhotoIndex ? 'w-full bg-white' : 'w-0'}`}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute left-3 top-4 rounded-full bg-black/50 p-2"
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>

          {/* Photo counter pill */}
          {hasMultiplePhotos && (
            <View className="absolute right-3 top-4 rounded-full bg-black/50 px-2.5 py-1">
              <Text className="text-xs font-medium tabular-nums text-white/90">
                {currentPhotoIndex + 1} / {photos.length}
              </Text>
            </View>
          )}

          <PhotoFadeOverlay />
        </View>

        {/* Profile Content (overlaps photo via negative margin) */}
        <View className="-mt-24 px-4">
          {/* Looking Now Banner */}
          {lookingNowPost && <LookingNowBanner post={lookingNowPost} />}

          {/* Name & Identity Card */}
          <View className="mb-4 overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-lg">
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="text-xl font-bold text-foreground">
                  {displayName}
                </Text>
                {statsLine ? (
                  <Text className="mt-0.5 text-sm text-muted-foreground">
                    {statsLine}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => setShowMenu(!showMenu)}
                className="rounded-full p-2"
              >
                <MoreVertical size={20} color="#a1a1aa" />
              </Pressable>
            </View>

            {/* Dropdown menu */}
            {showMenu && (
              <View className="absolute right-4 top-14 z-50 w-48 rounded-xl border border-border bg-card shadow-xl">
                <Pressable
                  onPress={() => {
                    setShowMenu(false)
                    handleReportUser()
                  }}
                  className="flex-row items-center gap-2 border-b border-border px-4 py-3"
                >
                  <Flag size={16} color="#d97706" />
                  <Text className="text-sm text-amber-600">Report user</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowMenu(false)
                    handleBlockUser()
                  }}
                  className="flex-row items-center gap-2 px-4 py-3"
                >
                  <Ban size={16} color="#dc2626" />
                  <Text className="text-sm text-destructive">Block user</Text>
                </Pressable>
              </View>
            )}

            {/* Status + distance row */}
            <View className="mt-3 flex-row flex-wrap items-center gap-3">
              <View className="flex-row items-center gap-1.5">
                <StatusDot isOnline={user.isOnline} />
                <Text className="text-sm text-muted-foreground">
                  {getLastSeenText(user.lastActive, user.isOnline)}
                </Text>
              </View>
              {formatDistance(distanceMiles) && (
                <View className="flex-row items-center gap-1">
                  <MapPin size={14} color="#a1a1aa" />
                  <Text className="text-sm text-muted-foreground">
                    {formatDistance(distanceMiles)}
                  </Text>
                </View>
              )}
            </View>

            {/* CTAs */}
            <View className="mt-4 flex-row gap-3">
              <Pressable
                onPress={() => void handleMessage()}
                className="h-14 flex-1 flex-row items-center justify-center rounded-2xl bg-primary shadow-md"
              >
                <MessageCircle size={20} color="#FAFAFA" />
                <Text className="ml-2 text-base font-semibold text-primary-foreground">
                  Message
                </Text>
              </Pressable>
              {typeof profile.latitude === 'number' &&
              typeof profile.longitude === 'number' ? (
                <Pressable
                  onPress={handleShowOnMap}
                  className="h-14 flex-1 flex-row items-center justify-center rounded-2xl border border-border bg-muted/70"
                >
                  <MapPin size={19} color="#FAFAFA" />
                  <Text className="ml-2 text-base font-semibold text-foreground">
                    Show on Map
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Bio */}
          {profile.bio && (
            <View className="mb-4 rounded-3xl border border-border/60 bg-card p-5">
              <Text className="text-sm leading-relaxed text-foreground">
                {profile.bio}
              </Text>
            </View>
          )}

          {/* Body & Stats */}
          {hasBodyStats && (
            <View className="mb-4">
              <SectionCard title="Stats" icon={User}>
                <View>
                  {profile.position && (
                    <StatsRow
                      label="Position"
                      value={formatLabel(profile.position)}
                    />
                  )}
                  {profile.lookingFor && (
                    <StatsRow
                      label="Looking For"
                      value={lookingForLabel(profile.lookingFor)}
                    />
                  )}
                  {profile.height && (
                    <StatsRow
                      label="Height"
                      value={formatHeight(profile.height)}
                    />
                  )}
                  {profile.weight && (
                    <StatsRow label="Weight" value={`${profile.weight} lbs`} />
                  )}
                  {profile.bodyType && (
                    <StatsRow
                      label="Body"
                      value={formatLabel(profile.bodyType)}
                    />
                  )}
                  {profile.ethnicity && (
                    <StatsRow
                      label="Ethnicity"
                      value={formatLabel(profile.ethnicity)}
                    />
                  )}
                  {profile.endowment && (
                    <StatsRow
                      label="Endowment"
                      value={
                        !isNaN(parseFloat(profile.endowment))
                          ? `${profile.endowment}"`
                          : formatLabel(profile.endowment)
                      }
                    />
                  )}
                  {user._creationTime && (
                    <StatsRow
                      label="Joined"
                      value={formatJoinDate(user._creationTime)}
                    />
                  )}
                </View>
              </SectionCard>
            </View>
          )}

          {/* Health & Safety */}
          {hasHealth && (
            <View className="mb-4">
              <SectionCard title="Health & Safety" icon={Shield}>
                <View>
                  {profile.hivStatus && (
                    <StatsRow
                      label="HIV Status"
                      value={formatLabel(profile.hivStatus)}
                    />
                  )}
                  {profile.lastTested && (
                    <StatsRow label="Last Tested" value={profile.lastTested} />
                  )}
                  {profile.onPrep && (
                    <StatsRow
                      label="PrEP"
                      value={formatLabel(profile.onPrep)}
                    />
                  )}
                </View>
              </SectionCard>
            </View>
          )}

          {/* Interests & Tribes */}
          {hasInterests && (
            <View className="mb-4">
              <SectionCard title="Interests" icon={Heart}>
                <View className="space-y-3 pt-1">
                  {profile.interests && profile.interests.length > 0 && (
                    <View className="flex-row flex-wrap gap-2">
                      {profile.interests.map((interest: string) => (
                        <View
                          key={interest}
                          className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5"
                        >
                          <Text className="text-sm font-medium text-primary">
                            {interest}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {profile.tribes && profile.tribes.length > 0 && (
                    <>
                      {profile.interests && profile.interests.length > 0 && (
                        <View className="border-t border-border/40" />
                      )}
                      <View className="flex-row flex-wrap gap-2">
                        {profile.tribes.map((tribe: string) => (
                          <View
                            key={tribe}
                            className="rounded-full bg-muted px-3 py-1.5"
                          >
                            <Text className="text-sm font-medium text-muted-foreground">
                              {formatLabel(tribe)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              </SectionCard>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Tap outside to close menu */}
      {showMenu && (
        <Pressable
          className="absolute inset-0"
          onPress={() => setShowMenu(false)}
        />
      )}
    </View>
  )
}
