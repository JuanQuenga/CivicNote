import { useMemo, useState } from 'react'
import { useAction, useMutation } from 'convex/react'
import { Redirect, useRouter } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MapPin, ShieldCheck } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../src/components/auth/AuthGate'
import { useCurrentUser } from '../src/hooks/useCurrentUser'
import { useLocation } from '../src/hooks/useLocation'

export default function OnboardingScreen() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const updateProfile = useAction(api.members.updateProfile)
  const updateLocation = useMutation(api.members.updateLocation)
  const {
    location,
    permissionStatus,
    requestPermission,
    isLoading: isLocationLoading,
  } = useLocation()

  const [displayName, setDisplayName] = useState(user?.name ?? '')
  const [ageInput, setAgeInput] = useState('')
  const [bio, setBio] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const age = useMemo(() => {
    const parsed = Number(ageInput)
    return Number.isFinite(parsed) ? Math.floor(parsed) : undefined
  }, [ageInput])

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#F11A23" size="large" />
      </SafeAreaView>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate
        title="Welcome"
        description="Sign in to finish setting up your profile."
      />
    )
  }

  if (user.onboardingComplete) {
    return <Redirect href="/(tabs)/members" />
  }

  const canContinue =
    displayName.trim().length > 0 &&
    age !== undefined &&
    age >= 18 &&
    permissionStatus === 'granted'

  const handleContinue = async () => {
    if (!canContinue || !user?._id) return

    try {
      setIsSaving(true)
      await updateProfile({
        displayName: displayName.trim(),
        age,
        bio: bio.trim() || undefined,
        onboardingComplete: true,
        ageConfirmedAt: Date.now(),
      })
      if (location) {
        await updateLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          locationName: 'Current location',
        })
      }
      router.replace('/(tabs)/members' as never)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not finish onboarding'
      Alert.alert('Onboarding failed', message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mt-4">
            <Text className="text-3xl font-bold text-foreground">
              Finish your profile
            </Text>
            <Text className="mt-3 text-base leading-6 text-muted-foreground">
              Civic Research Hub needs a basic profile and location access before showing
              nearby members and community spots.
            </Text>
          </View>

          <View className="mt-8 gap-5">
            <View>
              <Text className="mb-2 text-sm font-semibold text-muted-foreground">
                Display Name
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="How should people see you?"
                placeholderTextColor="#999999"
                className="rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
                maxLength={20}
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-muted-foreground">
                Age
              </Text>
              <TextInput
                value={ageInput}
                onChangeText={setAgeInput}
                placeholder="18+"
                placeholderTextColor="#999999"
                keyboardType="number-pad"
                className="rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-muted-foreground">
                Bio
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Say a little about yourself..."
                placeholderTextColor="#999999"
                multiline
                className="min-h-24 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
                maxLength={250}
              />
            </View>
          </View>

          <View className="mt-8 rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                <MapPin color="#F11A23" size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  Location Access
                </Text>
                <Text className="mt-0.5 text-sm text-muted-foreground">
                  {permissionStatus === 'granted'
                    ? 'Location is enabled'
                    : 'Required for nearby discovery'}
                </Text>
              </View>
              {permissionStatus === 'granted' ? (
                <ShieldCheck color="#22c55e" size={22} />
              ) : null}
            </View>
            {permissionStatus !== 'granted' ? (
              <Pressable
                className="mt-4 rounded-xl bg-primary px-4 py-3"
                disabled={isLocationLoading}
                onPress={() => void requestPermission()}
              >
                <Text className="text-center text-sm font-semibold text-primary-foreground">
                  {isLocationLoading ? 'Requesting...' : 'Enable Location'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable
            className={`mt-8 rounded-2xl px-4 py-4 ${
              canContinue && !isSaving ? 'bg-primary' : 'bg-primary/40'
            }`}
            disabled={!canContinue || isSaving}
            onPress={() => void handleContinue()}
          >
            <Text className="text-center text-base font-semibold text-primary-foreground">
              {isSaving ? 'Saving...' : 'Enter Civic Research Hub'}
            </Text>
          </Pressable>

          {age !== undefined && age < 18 ? (
            <Text className="mt-3 text-center text-sm text-destructive">
              Civic Research Hub is only for users 18 and older.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
