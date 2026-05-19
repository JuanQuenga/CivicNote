import { useState } from 'react'
import { useAction } from 'convex/react'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Camera, LocateFixed, MapPin, Plus, X } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../../src/components/auth/AuthGate'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { useLocation } from '../../src/hooks/useLocation'
import { useR2Upload } from '../../src/hooks/useR2Upload'
import {
  CATEGORY_COLOR_TOKENS,
  SPOT_CATEGORIES,
  SPOT_CATEGORY_OPTIONS,
} from '../../src/lib/spot-categories'
import type { SpotCategory } from '../../src/lib/spot-categories'

export default function NewSpotScreen() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const {
    location,
    isLoading: isLocationLoading,
    permissionStatus,
    requestPermission,
    refreshLocation,
  } = useLocation()
  const createSpot = useAction(api.spots.createSpot)
  const { upload, isUploading } = useR2Upload(user?._id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<SpotCategory | null>(null)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isBusy = isSubmitting || isUploading

  const handlePickPhoto = async () => {
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

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0])
    }
  }

  const handleUseCurrentLocation = async () => {
    const refreshed =
      permissionStatus === 'granted'
        ? await refreshLocation()
        : await requestPermission()

    if (!refreshed) {
      Alert.alert(
        'Location unavailable',
        'Enable location access to pin this spot.',
      )
    }
  }

  const handleSubmit = async () => {
    if (!user?._id || isBusy) return
    if (!name.trim()) {
      Alert.alert('Name required', 'Add a short spot name.')
      return
    }
    if (!category) {
      Alert.alert('Category required', 'Choose the closest spot category.')
      return
    }
    if (!location) {
      Alert.alert('Location required', 'Use your current location first.')
      return
    }
    if (!address.trim()) {
      Alert.alert('Address required', 'Add an address or readable place name.')
      return
    }

    try {
      setIsSubmitting(true)
      let photoR2Key: string | undefined
      let photoR2Url: string | undefined

      if (photo) {
        const response = await fetch(photo.uri)
        const blob = await response.blob()
        const typedBlob =
          blob.type && blob.type !== 'application/octet-stream'
            ? blob
            : new Blob([blob], { type: photo.mimeType ?? 'image/jpeg' })
        const uploaded = await upload(typedBlob, 'spots')
        photoR2Key = uploaded.key
        photoR2Url = uploaded.url
      }

      const spotId = await createSpot({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        latitude: location.latitude,
        longitude: location.longitude,
        address: address.trim(),
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        photoR2Key,
        photoR2Url,
      })

      router.replace(`/(tabs)/map/spots/${spotId}` as never)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not create spot'
      Alert.alert('Spot failed', message)
    } finally {
      setIsSubmitting(false)
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
        title="Add Spot"
        description="Sign in to add community spots."
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-2">
          <Text className="text-3xl font-bold text-foreground">Add Spot</Text>
          <Text className="mt-3 text-base leading-6 text-muted-foreground">
            Share a real community location using your current position.
          </Text>
        </View>

        <View className="mt-6 gap-5">
          <View>
            <Text className="mb-2 text-sm font-semibold text-muted-foreground">
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Spot name"
              placeholderTextColor="#999999"
              className="rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
              maxLength={100}
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold text-muted-foreground">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SPOT_CATEGORY_OPTIONS.map((option) => {
                const meta = SPOT_CATEGORIES[option.value]
                const tokens = CATEGORY_COLOR_TOKENS[meta.color]
                const Icon = meta.icon
                const isSelected = category === option.value
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setCategory(option.value)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? '#F11A23' : '#2F3336',
                      backgroundColor: isSelected
                        ? 'rgba(241, 26, 35, 0.12)'
                        : '#16181C',
                    }}
                  >
                    <Icon
                      color={isSelected ? '#F11A23' : tokens.fg}
                      size={14}
                    />
                    <Text
                      style={{
                        color: isSelected ? '#F11A23' : '#E7E9EA',
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold text-muted-foreground">
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Useful details for other members"
              placeholderTextColor="#999999"
              multiline
              className="min-h-24 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
              maxLength={500}
            />
          </View>

          <View className="rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                <MapPin color="#F11A23" size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  Pin Location
                </Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">
                  {location
                    ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                    : 'Current location is required'}
                </Text>
              </View>
              {isLocationLoading ? (
                <ActivityIndicator color="#F11A23" />
              ) : (
                <Pressable
                  onPress={() => void handleUseCurrentLocation()}
                  className="h-10 w-10 items-center justify-center rounded-full bg-primary"
                >
                  <LocateFixed color="#FAFAFA" size={18} />
                </Pressable>
              )}
            </View>
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold text-muted-foreground">
              Address or Place
            </Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Readable address or place name"
              placeholderTextColor="#999999"
              className="rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
            />
            <View className="mt-3 flex-row gap-3">
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor="#999999"
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
              />
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="State"
                placeholderTextColor="#999999"
                className="w-24 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
                maxLength={32}
              />
            </View>
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold text-muted-foreground">
              Photo
            </Text>
            {photo ? (
              <View className="overflow-hidden rounded-2xl border border-border bg-card">
                <Image
                  source={{ uri: photo.uri }}
                  contentFit="cover"
                  style={{ width: '100%', height: 190 }}
                />
                <Pressable
                  onPress={() => setPhoto(null)}
                  className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-background/80"
                >
                  <X color="#FAFAFA" size={18} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => void handlePickPhoto()}
                className="items-center justify-center rounded-2xl border border-dashed border-border bg-card px-4 py-8"
              >
                <Camera color="#F11A23" size={26} />
                <Text className="mt-2 text-sm font-semibold text-foreground">
                  Add photo
                </Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => void handleSubmit()}
            disabled={isBusy}
            className={`mt-2 flex-row items-center justify-center gap-2 rounded-2xl px-4 py-4 ${
              isBusy ? 'bg-primary/60' : 'bg-primary'
            }`}
          >
            {isBusy ? (
              <ActivityIndicator color="#FAFAFA" />
            ) : (
              <Plus color="#FAFAFA" size={20} />
            )}
            <Text className="text-base font-semibold text-primary-foreground">
              {isBusy ? 'Creating...' : 'Create Spot'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
