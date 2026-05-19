import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAction, useMutation, useQuery } from 'convex/react'
import * as ImagePicker from 'expo-image-picker'
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  EyeOff,
  Flag,
  Flame,
  Lock,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Navigation,
  Star,
  Trash2,
  X,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../../src/components/auth/AuthGate'
import { Avatar } from '../../src/components/ui/Avatar'
import { ResolvedImage } from '../../src/components/ui/ResolvedImage'
import { SpotChatRoom } from '../../src/components/spots/SpotChatRoom'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { useR2Upload } from '../../src/hooks/useR2Upload'
import { openNativeDirections } from '../../src/lib/nativeMaps'
import {
  CATEGORY_COLOR_TOKENS,
  getActivityLevel,
  getSpotCategoryMeta,
} from '../../src/lib/spot-categories'
import type { Id } from '@/src/lib/convexApi'

function asSpotId(value: string | Array<string> | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  return raw as Id<'spots'> | undefined
}

function formatRemaining(ms: number) {
  if (ms <= 0) return 'Expired'
  const minutes = Math.max(0, Math.round(ms / 60000))
  if (minutes < 60) return `${minutes}m left`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h ${remaining}m left` : `${hours}h left`
}

const DURATION_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
]

const TAB_BAR_HEIGHT = 48

export default function SpotDetailScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ spotId?: string; view?: string }>()
  const spotId = asSpotId(params.spotId)
  const isChatView = params.view === 'chat'
  const { isAuthenticated, isLoading, user } = useCurrentUser()

  const [photoIndex, setPhotoIndex] = useState(0)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isFavoriting, setIsFavoriting] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCheckInDialog, setShowCheckInDialog] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState<number>(120)
  const [checkInAnonymously, setCheckInAnonymously] = useState(false)
  const [now, setNow] = useState(Date.now())
  const photoScrollRef = useRef<ScrollView>(null)

  const spot = useQuery(api.spots.getSpot, spotId ? { spotId } : 'skip')
  const checkInSnapshot = useQuery(
    api.spotCheckIns.getSpotCheckInCount,
    spotId ? { spotId } : 'skip',
  )
  const activeCheckIn = useQuery(
    api.spotCheckIns.getMyActiveCheckIn,
    user?._id ? {} : 'skip',
  )
  const isFavorited = useQuery(
    api.spotFavorites.isSpotFavorited,
    spotId && user?._id ? { spotId } : 'skip',
  )

  const checkIn = useMutation(api.spotCheckIns.checkIn)
  const checkOut = useMutation(api.spotCheckIns.checkOut)
  const toggleFavorite = useMutation(api.spotFavorites.toggleFavoriteSpot)
  const reportSpot = useMutation(api.spots.reportSpot)
  const deleteSpot = useMutation(api.spots.deleteSpot)
  const addSpotPhoto = useAction(api.spots.addSpotPhoto)
  const { upload } = useR2Upload(user?._id)

  const isCheckedInHere =
    !!spotId &&
    activeCheckIn?.spotId === spotId &&
    activeCheckIn.expiresAt > now
  const isCheckedInElsewhere =
    !!spotId &&
    !!activeCheckIn &&
    activeCheckIn.spotId !== spotId &&
    activeCheckIn.expiresAt > now

  // Tick once per second while checked in to update countdown
  useEffect(() => {
    if (!isCheckedInHere) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [isCheckedInHere])

  const photos = useMemo(() => spot?.photos ?? [], [spot?.photos])
  const heroWidth = width
  const heroHeight = Math.round((heroWidth * 10) / 16)
  const bottomNavClearance = TAB_BAR_HEIGHT + insets.bottom

  const checkedInUsers = checkInSnapshot?.users ?? []
  const activeCount = checkInSnapshot?.count ?? spot?.activeCheckInCount ?? 0
  const activity = getActivityLevel(activeCount)

  const meta = getSpotCategoryMeta(spot?.category ?? 'other')
  const tokens = CATEGORY_COLOR_TOKENS[meta.color]
  const CategoryIcon = meta.icon

  const handleReportSpot = () => {
    if (!spotId || !user?._id) return
    Alert.alert('Report this spot', 'Choose the closest reason.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Inaccurate', onPress: () => void submitReport('inaccurate') },
      {
        text: 'Inappropriate',
        onPress: () => void submitReport('inappropriate'),
      },
      { text: 'Dangerous', onPress: () => void submitReport('dangerous') },
      { text: 'Spam', onPress: () => void submitReport('spam') },
    ])
  }

  const submitReport = async (
    reason: 'inaccurate' | 'inappropriate' | 'dangerous' | 'spam',
  ) => {
    if (!spotId) return
    try {
      await reportSpot({ spotId, reason })
      Alert.alert('Report submitted', 'Thanks. Our team will review it.')
    } catch (error) {
      Alert.alert(
        'Report failed',
        error instanceof Error ? error.message : 'Could not report',
      )
    }
  }

  const handleDeleteSpot = () => {
    if (!spotId) return
    Alert.alert('Delete this spot?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsDeleting(true)
            await deleteSpot({ spotId })
            router.back()
          } catch (error) {
            Alert.alert(
              'Delete failed',
              error instanceof Error ? error.message : 'Could not delete',
            )
          } finally {
            setIsDeleting(false)
          }
        },
      },
    ])
  }

  const handleAddSpotPhoto = async () => {
    if (!spotId || !user?._id || isUploadingPhoto) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Enable photo library access to add a spot photo.',
      )
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.88,
      allowsMultipleSelection: false,
    })
    if (result.canceled || !result.assets[0]) return
    try {
      setIsUploadingPhoto(true)
      const asset = result.assets[0]
      const response = await fetch(asset.uri)
      const blob = await response.blob()
      const typedBlob =
        blob.type && blob.type !== 'application/octet-stream'
          ? blob
          : new Blob([blob], { type: asset.mimeType ?? 'image/jpeg' })
      const uploaded = await upload(typedBlob, 'spots')
      await addSpotPhoto({
        spotId,
        photoKey: uploaded.key,
        photoUrl: uploaded.url,
      })
    } catch (error) {
      Alert.alert(
        'Upload failed',
        error instanceof Error ? error.message : 'Could not add photo',
      )
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleDirections = async () => {
    if (!spot) return
    await openNativeDirections({
      latitude: spot.latitude,
      longitude: spot.longitude,
      label: spot.name,
    })
  }

  const handleShowOnMap = () => {
    if (!spot) return
    DeviceEventEmitter.emit('mobile-map:open', {
      spotId,
      target: {
        latitude: spot.latitude,
        longitude: spot.longitude,
      },
    })
  }

  const handleOpenSpotChat = () => {
    if (!spotId) return
    router.push(`/(tabs)/map/spots/${spotId}?view=chat` as never)
  }

  const handleBackToSpot = () => {
    if (!spotId) return
    router.replace(`/(tabs)/map/spots/${spotId}` as never)
  }

  const handleToggleFavorite = async () => {
    if (!spotId || !user?._id) return
    try {
      setIsFavoriting(true)
      await toggleFavorite({ spotId })
    } catch (error) {
      Alert.alert(
        'Favorite failed',
        error instanceof Error ? error.message : 'Could not update favorite',
      )
    } finally {
      setIsFavoriting(false)
    }
  }

  const handleConfirmCheckIn = async () => {
    if (!spotId || !user?._id) return
    try {
      setIsCheckingIn(true)
      const result = await checkIn({
        spotId,
        durationMinutes: selectedDuration,
        ...(checkInAnonymously ? { isAnonymous: true } : {}),
      })
      setShowCheckInDialog(false)
      if (!result.alreadyCheckedIn) {
        Alert.alert(
          'Checked in',
          `Your check-in expires ${formatRemaining(result.expiresAt - Date.now())}.`,
        )
      }
      router.replace(`/(tabs)/map/spots/${spotId}?view=chat` as never)
    } catch (error) {
      Alert.alert(
        'Check-in failed',
        error instanceof Error ? error.message : 'Could not check in',
      )
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleCheckOut = async () => {
    if (!spotId) return
    try {
      setIsCheckingIn(true)
      await checkOut({ spotId })
    } catch (error) {
      Alert.alert(
        'Check-out failed',
        error instanceof Error ? error.message : 'Could not check out',
      )
    } finally {
      setIsCheckingIn(false)
    }
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          paddingTop: insets.top,
          paddingBottom: bottomNavClearance,
        }}
      >
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color="#F11A23" />
        </View>
      </View>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate title="Spot" description="Sign in to view community spots." />
    )
  }

  if (!spotId) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          paddingTop: insets.top,
          paddingBottom: bottomNavClearance,
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Text style={{ color: '#8B98A5' }}>Spot not found.</Text>
        </View>
      </View>
    )
  }

  if (spot === undefined) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          paddingTop: insets.top,
          paddingBottom: bottomNavClearance,
        }}
      >
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color="#F11A23" />
        </View>
      </View>
    )
  }

  if (!spot) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          paddingTop: insets.top,
          paddingBottom: bottomNavClearance,
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Text style={{ color: '#8B98A5' }}>
            This spot is no longer available.
          </Text>
        </View>
      </View>
    )
  }

  const canDelete = spot.createdBy === user._id
  const remainingMs = activeCheckIn ? activeCheckIn.expiresAt - now : 0

  if (isChatView) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          paddingTop: insets.top,
          paddingBottom: bottomNavClearance,
        }}
      >
        <View
          style={{
            height: 52,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 12,
            borderBottomWidth: 1,
            borderColor: '#2F3336',
          }}
        >
          <Pressable
            onPress={handleBackToSpot}
            hitSlop={8}
            style={{
              width: 34,
              height: 34,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 17,
              backgroundColor: '#16181C',
            }}
          >
            <ChevronLeft color="#FAFAFA" size={20} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FAFAFA', fontSize: 15, fontWeight: '700' }}>
              Spot Chat
            </Text>
            <Text style={{ color: '#8B98A5', fontSize: 11 }} numberOfLines={1}>
              {spot.name}
            </Text>
          </View>
        </View>
        {isCheckedInHere ? (
          <SpotChatRoom spotId={spotId} currentUserId={user._id} />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              gap: 10,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 24,
                backgroundColor: '#1F1F1F',
              }}
            >
              <Lock color="#8B98A5" size={20} />
            </View>
            <Text style={{ color: '#E7E9EA', fontSize: 15, fontWeight: '700' }}>
              Check in to join this chat
            </Text>
            <Text
              style={{ color: '#8B98A5', fontSize: 12, textAlign: 'center' }}
            >
              Spot chat is only available while you're actively checked in here.
            </Text>
            <Pressable
              onPress={handleBackToSpot}
              style={{
                marginTop: 8,
                height: 42,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#2F3336',
                backgroundColor: '#16181C',
              }}
            >
              <Text
                style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '700' }}
              >
                Back to Spot
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    )
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#000',
        paddingTop: insets.top,
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomNavClearance + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with category icon */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: 'rgba(56, 56, 56, 0.5)',
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: tokens.bg,
            }}
          >
            <CategoryIcon color={tokens.fg} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: '#FAFAFA', fontSize: 15, fontWeight: '700' }}
              numberOfLines={1}
            >
              {spot.name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 2,
              }}
            >
              <Text
                style={{ color: tokens.fg, fontSize: 11, fontWeight: '600' }}
              >
                {meta.label}
              </Text>
              {activity ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    borderRadius: 999,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    backgroundColor: activity.bg,
                    borderWidth: 1,
                    borderColor: activity.border,
                  }}
                >
                  <Flame color={activity.fg} size={9} />
                  <Text
                    style={{
                      color: activity.fg,
                      fontSize: 9,
                      fontWeight: '700',
                    }}
                  >
                    {activeCount} {activity.label}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <RoundButton
              onPress={() => void handleToggleFavorite()}
              disabled={isFavoriting}
            >
              <Star
                color={isFavorited ? '#fbbf24' : '#FAFAFA'}
                fill={isFavorited ? '#fbbf24' : 'transparent'}
                size={17}
              />
            </RoundButton>
            <RoundButton onPress={handleReportSpot}>
              <Flag color="#FAFAFA" size={17} />
            </RoundButton>
            {canDelete ? (
              <RoundButton onPress={handleDeleteSpot} disabled={isDeleting}>
                <Trash2 color="#f87171" size={17} />
              </RoundButton>
            ) : null}
          </View>
        </View>

        {/* Hero / photo carousel */}
        {photos.length > 0 ? (
          <View>
            <ScrollView
              ref={photoScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const next = Math.round(
                  e.nativeEvent.contentOffset.x / heroWidth,
                )
                setPhotoIndex(next)
              }}
            >
              {photos.map((photo: any) => (
                <ResolvedImage
                  key={photo.key}
                  uri={photo.url}
                  contentFit="cover"
                  style={{ width: heroWidth, height: heroHeight }}
                />
              ))}
            </ScrollView>
            {photos.length > 1 ? (
              <>
                <View
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 0,
                    right: 0,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {photos.map((_: any, i: number) => (
                    <View
                      key={i}
                      style={{
                        width: i === photoIndex ? 18 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor:
                          i === photoIndex
                            ? '#FAFAFA'
                            : 'rgba(250, 250, 250, 0.5)',
                      }}
                    />
                  ))}
                </View>
                {photoIndex > 0 ? (
                  <Pressable
                    onPress={() => {
                      const next = photoIndex - 1
                      photoScrollRef.current?.scrollTo({
                        x: next * heroWidth,
                        animated: true,
                      })
                      setPhotoIndex(next)
                    }}
                    style={{
                      position: 'absolute',
                      top: heroHeight / 2 - 18,
                      left: 12,
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.45)',
                    }}
                  >
                    <ChevronLeft color="#FAFAFA" size={20} />
                  </Pressable>
                ) : null}
                {photoIndex < photos.length - 1 ? (
                  <Pressable
                    onPress={() => {
                      const next = photoIndex + 1
                      photoScrollRef.current?.scrollTo({
                        x: next * heroWidth,
                        animated: true,
                      })
                      setPhotoIndex(next)
                    }}
                    style={{
                      position: 'absolute',
                      top: heroHeight / 2 - 18,
                      right: 12,
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.45)',
                    }}
                  >
                    <ChevronRight color="#FAFAFA" size={20} />
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>
        ) : (
          <View
            style={{
              width: heroWidth,
              height: heroHeight,
              backgroundColor: tokens.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CategoryIcon color={tokens.fg} size={56} />
          </View>
        )}

        {/* Address + activity bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 14,
          }}
        >
          <MapPin color="#8B98A5" size={16} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => void handleDirections()}>
              <Text
                style={{
                  color: '#E7E9EA',
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                {spot.address}
              </Text>
              {spot.city || spot.state ? (
                <Text
                  style={{
                    color: '#8B98A5',
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {[spot.city, spot.state].filter(Boolean).join(', ')}
                </Text>
              ) : null}
            </Pressable>
          </View>
          <Pressable
            onPress={() => void handleAddSpotPhoto()}
            disabled={isUploadingPhoto}
            style={{
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              backgroundColor: '#16181C',
              borderWidth: 1,
              borderColor: '#2F3336',
            }}
          >
            {isUploadingPhoto ? (
              <ActivityIndicator color="#F11A23" size="small" />
            ) : (
              <Camera color="#FAFAFA" size={14} />
            )}
          </Pressable>
        </View>

        {spot.description ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <Text style={{ color: '#B0B7BE', fontSize: 13, lineHeight: 19 }}>
              {spot.description}
            </Text>
          </View>
        ) : null}

        {/* CTA row: Show on Map + Check In */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
        >
          <Pressable
            onPress={handleShowOnMap}
            style={{
              flex: 1,
              minWidth: 0,
              height: 44,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#2F3336',
              backgroundColor: '#16181C',
            }}
          >
            <MapIcon color="#FAFAFA" size={16} />
            <Text style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '600' }}>
              Show on Map
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void handleDirections()}
            style={{
              flex: 1,
              minWidth: 0,
              height: 44,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#2F3336',
              backgroundColor: '#16181C',
            }}
          >
            <Navigation color="#FAFAFA" size={16} />
            <Text style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '600' }}>
              Directions
            </Text>
          </Pressable>
          {isCheckedInHere ? (
            <Pressable
              onPress={() => void handleCheckOut()}
              disabled={isCheckingIn}
              style={{
                width: '100%',
                height: 44,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#F11A23',
                backgroundColor: 'rgba(241, 26, 35, 0.1)',
              }}
            >
              {isCheckingIn ? (
                <ActivityIndicator color="#F11A23" />
              ) : (
                <>
                  <Clock3 color="#F11A23" size={16} />
                  <Text
                    style={{
                      color: '#F11A23',
                      fontSize: 13,
                      fontWeight: '700',
                    }}
                  >
                    {formatRemaining(remainingMs)} · Tap to check out
                  </Text>
                </>
              )}
            </Pressable>
          ) : isCheckedInElsewhere ? (
            <Pressable
              onPress={() =>
                router.push(
                  `/(tabs)/map/spots/${activeCheckIn.spotId}` as never,
                )
              }
              style={{
                width: '100%',
                height: 44,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#2F3336',
                backgroundColor: '#16181C',
              }}
            >
              <Clock3 color="#8B98A5" size={16} />
              <Text
                numberOfLines={1}
                style={{ color: '#8B98A5', fontSize: 13, fontWeight: '700' }}
              >
                Checked in at {activeCheckIn.spotName}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setShowCheckInDialog(true)}
              disabled={isCheckingIn}
              style={{
                width: '100%',
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                backgroundColor: '#F11A23',
              }}
            >
              {isCheckingIn ? (
                <ActivityIndicator color="#FAFAFA" />
              ) : (
                <Text
                  style={{
                    color: '#FAFAFA',
                    fontSize: 14,
                    fontWeight: '700',
                  }}
                >
                  Check In
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {/* Who's here */}
        {checkedInUsers.length > 0 ? (
          <View
            style={{
              marginTop: 18,
              paddingTop: 16,
              paddingHorizontal: 16,
              borderTopWidth: 1,
              borderColor: 'rgba(56, 56, 56, 0.3)',
            }}
          >
            <Text
              style={{
                color: '#FAFAFA',
                fontSize: 13,
                fontWeight: '700',
                marginBottom: 10,
              }}
            >
              Who's here
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {checkedInUsers.slice(0, 12).map((u: any) => (
                <View key={u._id} style={{ alignItems: 'center', width: 56 }}>
                  <Avatar imageUrl={u.imageUrl} name={u.name} size="sm" />
                  <Text
                    numberOfLines={1}
                    style={{
                      color: '#B0B7BE',
                      fontSize: 10,
                      marginTop: 4,
                    }}
                  >
                    {u.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Spot Chat */}
        <View
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTopWidth: 1,
            borderColor: 'rgba(56, 56, 56, 0.3)',
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
            }}
          >
            <MessageCircle color="#8B98A5" size={14} />
            <Text style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '700' }}>
              Spot Chat
            </Text>
          </View>
          {isCheckedInHere ? (
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              <Text style={{ color: '#8B98A5', fontSize: 12, lineHeight: 17 }}>
                Chat with everyone checked in right now.
              </Text>
              <Pressable
                onPress={handleOpenSpotChat}
                style={{
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  backgroundColor: '#F11A23',
                }}
              >
                <Text
                  style={{
                    color: '#FAFAFA',
                    fontSize: 14,
                    fontWeight: '700',
                  }}
                >
                  Open Spot Chat
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={{
                marginHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 8,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  backgroundColor: '#16181C',
                }}
              >
                <Lock color="#8B98A5" size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: '#E7E9EA', fontSize: 13, fontWeight: '700' }}
                >
                  Check in to join the chat
                </Text>
                <Text style={{ color: '#8B98A5', fontSize: 11, marginTop: 2 }}>
                  Your chat is only active while you're checked in here
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Added by */}
        {spot.creator ? (
          <View
            style={{
              marginTop: 18,
              paddingTop: 16,
              paddingHorizontal: 16,
              borderTopWidth: 1,
              borderColor: 'rgba(56, 56, 56, 0.3)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Avatar
              imageUrl={spot.creator.imageUrl}
              name={spot.creator.name}
              size="sm"
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: '#71767B',
                  fontSize: 11,
                  fontWeight: '500',
                }}
              >
                Added by
              </Text>
              <Text
                style={{
                  color: '#E7E9EA',
                  fontSize: 13,
                  fontWeight: '600',
                  marginTop: 1,
                }}
              >
                {spot.creator.name}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Check-in duration dialog */}
      <Modal
        transparent
        animationType="fade"
        visible={showCheckInDialog}
        onRequestClose={() => setShowCheckInDialog(false)}
      >
        <Pressable
          onPress={() => setShowCheckInDialog(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: '#0A0A0A',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 18,
              paddingBottom: 30,
              borderTopWidth: 1,
              borderColor: '#2F3336',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <Text
                style={{ color: '#FAFAFA', fontSize: 16, fontWeight: '700' }}
              >
                Check in to {spot.name}
              </Text>
              <Pressable
                onPress={() => setShowCheckInDialog(false)}
                hitSlop={6}
              >
                <X color="#8B98A5" size={20} />
              </Pressable>
            </View>
            <Text style={{ color: '#8B98A5', fontSize: 12, marginBottom: 12 }}>
              How long do you want to be here?
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 14,
              }}
            >
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = opt.value === selectedDuration
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setSelectedDuration(opt.value)}
                    style={{
                      flexBasis: '47%',
                      paddingVertical: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? '#F11A23' : '#2F3336',
                      backgroundColor: isSelected
                        ? 'rgba(241, 26, 35, 0.12)'
                        : '#16181C',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#F11A23' : '#FAFAFA',
                        fontSize: 14,
                        fontWeight: '700',
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: '#16181C',
                borderWidth: 1,
                borderColor: '#2F3336',
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <EyeOff color="#8B98A5" size={16} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: '#FAFAFA',
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    Check in anonymously
                  </Text>
                  <Text
                    style={{ color: '#71767B', fontSize: 11, marginTop: 1 }}
                  >
                    Ultra members only
                  </Text>
                </View>
              </View>
              <Switch
                value={checkInAnonymously}
                onValueChange={setCheckInAnonymously}
                trackColor={{ false: '#2F3336', true: '#F11A23' }}
                thumbColor="#FAFAFA"
              />
            </View>
            <Pressable
              onPress={() => void handleConfirmCheckIn()}
              disabled={isCheckingIn}
              style={{
                height: 50,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                backgroundColor: '#F11A23',
              }}
            >
              {isCheckingIn ? (
                <ActivityIndicator color="#FAFAFA" />
              ) : (
                <Text
                  style={{
                    color: '#FAFAFA',
                    fontSize: 15,
                    fontWeight: '700',
                  }}
                >
                  Check In
                </Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

function RoundButton({
  children,
  onPress,
  disabled,
}: {
  children: React.ReactNode
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 17,
        backgroundColor: '#16181C',
        borderWidth: 1,
        borderColor: '#2F3336',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </Pressable>
  )
}
