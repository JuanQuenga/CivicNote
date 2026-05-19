import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
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
import { Eye, MapPin, Shield, Shuffle, X } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../src/components/auth/AuthGate'
import { useCurrentUser } from '../src/hooks/useCurrentUser'
import { useLocation } from '../src/hooks/useLocation'

const FUZZ_OPTIONS = [0, 0.1, 0.5, 1, 2, 5]

function formatRadius(radius: number) {
  if (radius < 0.1) return 'Precise'
  return `${radius} mi`
}

export default function ControlsScreen() {
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const { location, refreshLocation } = useLocation()
  const fuzzRadius = useQuery(
    api.members.getLocationFuzzRadius,
    isAuthenticated ? {} : 'skip',
  )
  const savedAddresses = useQuery(
    api.savedAddresses.getSavedAddresses,
    user?._id ? {} : 'skip',
  )

  const updateFuzzRadius = useMutation(api.members.updateLocationFuzzRadius)
  const updatePreferences = useMutation(api.members.updateUserPreferences)
  const setExploreLocation = useMutation(api.members.setExploreLocation)
  const clearExploreLocation = useMutation(api.members.clearExploreLocation)
  const [manualName, setManualName] = useState('')
  const [manualLatitude, setManualLatitude] = useState('')
  const [manualLongitude, setManualLongitude] = useState('')
  const [savingKey, setSavingKey] = useState<string | null>(null)

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#F11A23" size="large" />
      </SafeAreaView>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate title="Controls" description="Sign in to manage controls." />
    )
  }

  const handleFuzzRadius = async (radius: number) => {
    try {
      setSavingKey('fuzz')
      await updateFuzzRadius({ radius })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not update radius'
      Alert.alert('Controls failed', message)
    } finally {
      setSavingKey(null)
    }
  }

  const handleToggleBlur = async () => {
    try {
      setSavingKey('blurNsfwMedia')
      await updatePreferences({
        blurNsfwMedia: !(user.blurNsfwMedia ?? false),
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not update blur setting'
      Alert.alert('Controls failed', message)
    } finally {
      setSavingKey(null)
    }
  }

  const handleExploreManual = async () => {
    const latitude = Number(manualLatitude)
    const longitude = Number(manualLongitude)
    if (
      !manualName.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      Alert.alert(
        'Location required',
        'Enter a label, latitude, and longitude.',
      )
      return
    }
    try {
      setSavingKey('explore')
      await setExploreLocation({
        latitude,
        longitude,
        locationName: manualName.trim(),
      })
      setManualName('')
      setManualLatitude('')
      setManualLongitude('')
      Alert.alert(
        'Exploring area',
        'Member and map discovery will include this area.',
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not set explore area'
      Alert.alert('Explore failed', message)
    } finally {
      setSavingKey(null)
    }
  }

  const handleUseSavedAddress = async (address: {
    name: string
    latitude: number
    longitude: number
    locationName: string
  }) => {
    try {
      setSavingKey(address.name)
      await setExploreLocation({
        latitude: address.latitude,
        longitude: address.longitude,
        locationName: address.locationName || address.name,
      })
      Alert.alert('Exploring area', `Now exploring ${address.name}.`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not set explore area'
      Alert.alert('Explore failed', message)
    } finally {
      setSavingKey(null)
    }
  }

  const handleClearExplore = async () => {
    try {
      setSavingKey('clearExplore')
      await clearExploreLocation({})
      if (location) {
        await refreshLocation()
      }
      Alert.alert('Nearby mode', 'Explore area cleared.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not clear explore area'
      Alert.alert('Explore failed', message)
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View>
          <Text className="text-3xl font-bold text-foreground">Controls</Text>
          <Text className="mt-2 text-base leading-6 text-muted-foreground">
            Manage discovery privacy and map browsing behavior.
          </Text>
        </View>

        <View className="mt-6 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-green-500/15">
              <Shield color="#22c55e" size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                Location Privacy
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                {fuzzRadius === undefined
                  ? 'Loading radius'
                  : fuzzRadius < 0.1
                    ? 'Exact location visible'
                    : `Fuzzy within ${formatRadius(fuzzRadius)}`}
              </Text>
            </View>
            {fuzzRadius !== undefined && fuzzRadius < 0.1 ? (
              <Eye color="#f59e0b" size={20} />
            ) : (
              <Shuffle color="#22c55e" size={20} />
            )}
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {FUZZ_OPTIONS.map((radius) => (
              <Pressable
                key={radius}
                disabled={savingKey === 'fuzz'}
                onPress={() => void handleFuzzRadius(radius)}
                className={`rounded-full border px-3 py-2 ${
                  fuzzRadius === radius
                    ? 'border-primary bg-primary'
                    : 'border-border bg-background'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    fuzzRadius === radius
                      ? 'text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {formatRadius(radius)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                Blur NSFW Media
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                Blur flagged media in albums, feed, and discovery surfaces.
              </Text>
            </View>
            <Pressable
              disabled={savingKey === 'blurNsfwMedia'}
              onPress={() => void handleToggleBlur()}
              className={`h-7 w-12 justify-center rounded-full px-1 ${
                user.blurNsfwMedia
                  ? 'items-end bg-primary'
                  : 'items-start bg-muted'
              }`}
            >
              <View className="h-5 w-5 rounded-full bg-white" />
            </Pressable>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <MapPin color="#F11A23" size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                Explore Area
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                Browse members around a saved or custom location.
              </Text>
            </View>
            <Pressable
              disabled={savingKey === 'clearExplore'}
              onPress={() => void handleClearExplore()}
              className="h-9 w-9 items-center justify-center rounded-full bg-background"
            >
              <X color="#FAFAFA" size={17} />
            </Pressable>
          </View>

          {savedAddresses && savedAddresses.length > 0 ? (
            <View className="mt-4 gap-2">
              {savedAddresses.map((address: any) => (
                <Pressable
                  key={address._id}
                  disabled={savingKey === address.name}
                  onPress={() => void handleUseSavedAddress(address)}
                  className="rounded-xl border border-border bg-background p-3"
                >
                  <Text className="text-sm font-semibold text-foreground">
                    {address.name}
                  </Text>
                  <Text className="mt-1 text-xs text-muted-foreground">
                    {address.address}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View className="mt-4 gap-3">
            <TextInput
              value={manualName}
              onChangeText={setManualName}
              placeholder="Area label"
              placeholderTextColor="#999999"
              className="rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
            />
            <View className="flex-row gap-3">
              <TextInput
                value={manualLatitude}
                onChangeText={setManualLatitude}
                placeholder="Latitude"
                placeholderTextColor="#999999"
                keyboardType="numbers-and-punctuation"
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
              />
              <TextInput
                value={manualLongitude}
                onChangeText={setManualLongitude}
                placeholder="Longitude"
                placeholderTextColor="#999999"
                keyboardType="numbers-and-punctuation"
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
              />
            </View>
            <Pressable
              disabled={savingKey === 'explore'}
              onPress={() => void handleExploreManual()}
              className="items-center rounded-2xl bg-primary px-4 py-4"
            >
              {savingKey === 'explore' ? (
                <ActivityIndicator color="#FAFAFA" />
              ) : (
                <Text className="text-base font-semibold text-primary-foreground">
                  Explore Custom Area
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
