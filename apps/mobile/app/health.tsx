import { useEffect, useMemo, useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  CheckCircle,
  Clock,
  ExternalLink,
  HeartPulse,
  MapPin,
  Navigation,
  Phone,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../src/components/auth/AuthGate'
import { useCurrentUser } from '../src/hooks/useCurrentUser'
import { openNativeDirections } from '../src/lib/nativeMaps'
import type { Id } from '@/src/lib/convexApi'

type HealthOption = {
  id: string
  label: string
}

type Profile = {
  _id: Id<'profiles'>
  latitude?: number
  longitude?: number
  locationName?: string
  hivStatus?: string
  lastTested?: string
  onPrep?: string
  lastTestedUpdatedAt?: number
  showHealthOnProfile?: boolean
}

type Clinic = {
  _id: Id<'testingClinics'>
  name: string
  category: string
  latitude: number
  longitude: number
  address: string
  city?: string
  phone?: string
  hours?: string
  services?: Array<string>
  walkInsAccepted?: boolean
  freeOrLowCost?: boolean
  distanceMiles?: number
}

const HIV_STATUS_OPTIONS: Array<HealthOption> = [
  { id: 'negative', label: 'Negative' },
  { id: 'positive_undetectable', label: 'Positive, undetectable' },
  { id: 'positive', label: 'Positive' },
  { id: 'unknown', label: 'Unknown' },
]

const PREP_OPTIONS: Array<HealthOption> = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
  { id: 'interested', label: 'Interested' },
]

const CATEGORY_LABELS: Record<string, string> = {
  hiv_testing: 'HIV Testing',
  sti_testing: 'STI Testing',
  prep: 'PrEP',
  lgbtq_health: 'LGBTQ+ Health',
  clinic: 'Clinic',
}

export default function HealthScreen() {
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const profile = useQuery(
    api.members.getProfile,
    user?._id ? { userId: user._id } : 'skip',
  ) as Profile | null | undefined
  const updateProfile = useAction(api.members.updateProfile)

  const [hivStatus, setHivStatus] = useState('')
  const [lastTested, setLastTested] = useState('')
  const [onPrep, setOnPrep] = useState('')
  const [showOnProfile, setShowOnProfile] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setHivStatus(profile.hivStatus ?? '')
    setLastTested(profile.lastTested ?? '')
    setOnPrep(profile.onPrep ?? '')
    setShowOnProfile(profile.showHealthOnProfile ?? false)
    setHasChanges(false)
  }, [profile])

  const clinicQueryArgs = useMemo(() => {
    if (
      typeof profile?.latitude !== 'number' ||
      typeof profile.longitude !== 'number'
    ) {
      return 'skip' as const
    }

    return {
      bounds: {
        north: profile.latitude + 0.5,
        south: profile.latitude - 0.5,
        east: profile.longitude + 0.5,
        west: profile.longitude - 0.5,
      },
      latitude: profile.latitude,
      longitude: profile.longitude,
      limit: 50,
    }
  }, [profile?.latitude, profile?.longitude])

  const clinics = useQuery(
    api.testingClinics.getNearbyClinics,
    clinicQueryArgs,
  ) as Array<Clinic> | undefined

  const handleSelect = (
    currentValue: string,
    nextValue: string,
    setter: (value: string) => void,
  ) => {
    setter(currentValue === nextValue ? '' : nextValue)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!user?._id) return
    setIsSaving(true)
    try {
      await updateProfile({
        hivStatus: hivStatus || undefined,
        lastTested: lastTested.trim() || undefined,
        onPrep: onPrep || undefined,
        showHealthOnProfile: showOnProfile,
      })
      setHasChanges(false)
      Alert.alert('Saved', 'Your health info was updated.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not update health info'
      Alert.alert('Save failed', message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || (user?._id && profile === undefined)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#F11A23" size="large" />
      </SafeAreaView>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate
        title="Health"
        description="Sign in to update health info and find nearby clinics."
      />
    )
  }

  const lastUpdated = profile?.lastTestedUpdatedAt
    ? new Date(profile.lastTestedUpdatedAt).toLocaleDateString()
    : null
  const hasLocation =
    typeof profile?.latitude === 'number' &&
    typeof profile.longitude === 'number'

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 44 }}>
        <View className="rounded-2xl border border-border bg-card p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <HeartPulse color="#F11A23" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold uppercase text-muted-foreground">
                Health
              </Text>
              <Text className="mt-1 text-2xl font-bold text-foreground">
                Your Health Status
              </Text>
            </View>
          </View>

          <Text className="mt-5 text-xs font-semibold uppercase text-muted-foreground">
            HIV Status
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {HIV_STATUS_OPTIONS.map((option) => (
              <OptionChip
                key={option.id}
                active={hivStatus === option.id}
                label={option.label}
                onPress={() => handleSelect(hivStatus, option.id, setHivStatus)}
              />
            ))}
          </View>

          <Text className="mt-5 text-xs font-semibold uppercase text-muted-foreground">
            Last Tested
          </Text>
          <TextInput
            value={lastTested}
            onChangeText={(text) => {
              setLastTested(text)
              setHasChanges(true)
            }}
            placeholder='e.g. "Jan 2026"'
            placeholderTextColor="#999999"
            maxLength={50}
            className="mt-2 rounded-2xl border border-border bg-input px-4 py-3 text-base text-foreground"
          />

          <Text className="mt-5 text-xs font-semibold uppercase text-muted-foreground">
            On PrEP
          </Text>
          <View className="mt-2 flex-row gap-2">
            {PREP_OPTIONS.map((option) => (
              <OptionChip
                key={option.id}
                active={onPrep === option.id}
                label={option.label}
                onPress={() => handleSelect(onPrep, option.id, setOnPrep)}
              />
            ))}
          </View>

          <View className="mt-5 flex-row items-center justify-between rounded-2xl border border-border bg-background p-4">
            <View className="mr-4 flex-1">
              <Text className="text-sm font-semibold text-foreground">
                Show on profile
              </Text>
              <Text className="mt-1 text-xs leading-5 text-muted-foreground">
                Let other members see your health info.
              </Text>
            </View>
            <Switch
              value={showOnProfile}
              onValueChange={(checked) => {
                setShowOnProfile(checked)
                setHasChanges(true)
              }}
              trackColor={{ false: '#27272A', true: '#F11A23' }}
              thumbColor="#FAFAFA"
            />
          </View>

          <View className="mt-5 flex-row items-center gap-3">
            {lastUpdated ? (
              <View className="flex-1 flex-row items-center gap-1">
                <CheckCircle color="#22c55e" size={15} />
                <Text className="text-xs text-muted-foreground">
                  Updated {lastUpdated}
                </Text>
              </View>
            ) : (
              <View className="flex-1" />
            )}
            <Pressable
              className={`rounded-2xl px-5 py-3 ${
                hasChanges && !isSaving ? 'bg-primary' : 'bg-muted'
              }`}
              disabled={!hasChanges || isSaving}
              onPress={() => void handleSave()}
            >
              <Text className="text-sm font-semibold text-primary-foreground">
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-5 rounded-2xl border border-border bg-card p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <MapPin color="#F11A23" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold uppercase text-muted-foreground">
                Nearby
              </Text>
              <Text className="mt-1 text-2xl font-bold text-foreground">
                Testing Clinics
              </Text>
              {profile?.locationName ? (
                <Text className="mt-1 text-xs text-muted-foreground">
                  Around {profile.locationName}
                </Text>
              ) : null}
            </View>
          </View>

          {!hasLocation ? (
            <Text className="mt-5 text-sm leading-6 text-muted-foreground">
              Add your location in profile or controls to see nearby testing
              clinics.
            </Text>
          ) : clinics === undefined ? (
            <View className="mt-8 items-center">
              <ActivityIndicator color="#F11A23" />
            </View>
          ) : clinics.length === 0 ? (
            <Text className="mt-5 text-sm leading-6 text-muted-foreground">
              No clinics found nearby. Check back soon for new clinic listings.
            </Text>
          ) : (
            <View className="mt-5 gap-3">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic._id} clinic={clinic} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function OptionChip({
  active,
  label,
  onPress,
}: {
  active: boolean
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      className={`rounded-full border px-4 py-2 ${
        active ? 'border-primary bg-primary' : 'border-border bg-background'
      }`}
      onPress={onPress}
    >
      <Text
        className={
          active
            ? 'text-sm font-semibold text-primary-foreground'
            : 'text-sm font-semibold text-foreground'
        }
      >
        {label}
      </Text>
    </Pressable>
  )
}

function ClinicCard({ clinic }: { clinic: Clinic }) {
  const category = CATEGORY_LABELS[clinic.category] ?? 'Clinic'

  return (
    <View className="rounded-2xl border border-border bg-background p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">
            {clinic.name}
          </Text>
          <Text className="mt-1 text-xs font-semibold uppercase text-primary">
            {category}
          </Text>
        </View>
        {clinic.distanceMiles !== undefined ? (
          <Text className="text-xs text-muted-foreground">
            {clinic.distanceMiles < 1
              ? `${Math.round(clinic.distanceMiles * 5280)} ft`
              : `${clinic.distanceMiles.toFixed(1)} mi`}
          </Text>
        ) : null}
      </View>

      <Text className="mt-3 text-sm leading-5 text-muted-foreground">
        {clinic.address}
      </Text>

      {clinic.phone ? (
        <Pressable
          className="mt-3 flex-row items-center gap-2"
          onPress={() => void Linking.openURL(`tel:${clinic.phone}`)}
        >
          <Phone color="#F11A23" size={15} />
          <Text className="text-sm font-semibold text-primary">
            {clinic.phone}
          </Text>
        </Pressable>
      ) : null}

      {clinic.hours ? (
        <View className="mt-2 flex-row items-center gap-2">
          <Clock color="#999999" size={15} />
          <Text className="text-sm text-muted-foreground">{clinic.hours}</Text>
        </View>
      ) : null}

      {clinic.services?.length ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {clinic.services.map((service) => (
            <View key={service} className="rounded-full bg-muted px-2.5 py-1">
              <Text className="text-xs font-semibold text-muted-foreground">
                {service}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="mt-3 flex-row flex-wrap gap-2">
        {clinic.walkInsAccepted ? (
          <View className="rounded-full bg-green-500/15 px-2.5 py-1">
            <Text className="text-xs font-semibold text-green-500">
              Walk-ins OK
            </Text>
          </View>
        ) : null}
        {clinic.freeOrLowCost ? (
          <View className="rounded-full bg-blue-500/15 px-2.5 py-1">
            <Text className="text-xs font-semibold text-blue-400">
              Free / low cost
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3"
        onPress={() =>
          void openNativeDirections({
            latitude: clinic.latitude,
            longitude: clinic.longitude,
            label: clinic.name,
          })
        }
      >
        <Navigation color="#FAFAFA" size={16} />
        <Text className="text-sm font-semibold text-primary-foreground">
          Directions
        </Text>
        <ExternalLink color="#FAFAFA" size={14} />
      </Pressable>
    </View>
  )
}
