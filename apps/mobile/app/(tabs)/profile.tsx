import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Check,
  ChevronRight,
  Clapperboard,
  Ghost,
  HeartPulse,
  Image as ImageIcon,
  Instagram,
  Link2,
  LogOut,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Twitter,
  X,
  type LucideIcon,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../../src/components/auth/AuthGate'
import { ProfilePhotoGrid } from '../../src/components/profile/ProfilePhotoGrid'
import { ResolvedImage } from '../../src/components/ui/ResolvedImage'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { useWorkOSAuth } from '../../src/lib/workosAuth'
import {
  ACCOMMODATION_OPTIONS,
  BODY_TYPE_OPTIONS,
  ETHNICITY_OPTIONS,
  HIV_STATUS_OPTIONS,
  HOSTING_OPTIONS,
  INTEREST_CATEGORIES,
  LOOKING_FOR_OPTIONS,
  NSFW_PREF_OPTIONS,
  POSITION_OPTIONS,
  PREP_OPTIONS,
  PRONOUNS_OPTIONS,
  RELATIONSHIP_STATUS_OPTIONS,
  SAFE_SEX_OPTIONS,
  TRIBE_OPTIONS,
  type InterestCategory,
} from '../../src/lib/filter-options'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PHOTO_HEIGHT = SCREEN_WIDTH * (4 / 3)
const MAX_INTERESTS = 12
const MAX_TRIBES = 5

interface Option {
  id: string
  label: string
  icon?: string
}

type PickerConfig =
  | {
      kind: 'single'
      title: string
      options: ReadonlyArray<Option>
      value: string
      onChange: (id: string) => void
    }
  | {
      kind: 'multi'
      title: string
      options: ReadonlyArray<Option>
      value: Array<string>
      onChange: (next: Array<string>) => void
      maxSelections?: number
    }
  | {
      kind: 'interests'
      title: string
      value: Array<string>
      onChange: (next: Array<string>) => void
    }
  | {
      kind: 'text'
      title: string
      value: string
      placeholder?: string
      onChange: (next: string) => void
      multiline?: boolean
      maxLength?: number
      keyboardType?: 'default' | 'number-pad' | 'decimal-pad'
    }
  | {
      kind: 'photos'
      title: string
    }

function formatLabel(id: string) {
  if (!id) return ''
  if (id === 'not_saying' || id === 'ask_me') return 'Ask Me'
  return id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function findLabel(options: ReadonlyArray<Option>, id: string) {
  if (!id) return ''
  return options.find((o) => o.id === id)?.label ?? formatLabel(id)
}

function formatHeightInches(inches?: number) {
  if (!inches) return ''
  const feet = Math.floor(inches / 12)
  const rem = inches % 12
  return `${feet}'${rem}"`
}

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  const { isAuthenticated, isLoading, user, workosUser } = useCurrentUser()
  const { signOut } = useWorkOSAuth()

  const profile = useQuery(
    api.members.getProfile,
    user?._id ? { userId: user._id } : 'skip',
  )
  const profilePhotos = useQuery(
    api.members.getProfilePhotos,
    user?._id ? { userId: user._id } : 'skip',
  )
  const updateProfile = useAction(api.members.updateProfile)

  const [picker, setPicker] = useState<PickerConfig | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // Basic
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [hideAge, setHideAge] = useState(false)
  const [bio, setBio] = useState('')
  const [lookingFor, setLookingFor] = useState('')
  const [position, setPosition] = useState('')
  const [relationshipStatus, setRelationshipStatus] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [hosting, setHosting] = useState('')
  const [accommodation, setAccommodation] = useState('')
  const [safeSex, setSafeSex] = useState('')
  const [nsfwPref, setNsfwPref] = useState('')

  // Stats
  const [heightInches, setHeightInches] = useState<number | undefined>()
  const [weight, setWeight] = useState('')
  const [bodyType, setBodyType] = useState('')
  const [ethnicity, setEthnicity] = useState('')
  const [endowment, setEndowment] = useState('')
  const [showStatsOnProfile, setShowStatsOnProfile] = useState(true)
  const [selectedTribes, setSelectedTribes] = useState<Array<string>>([])

  // Health
  const [hivStatus, setHivStatus] = useState('')
  const [lastTested, setLastTested] = useState('')
  const [onPrep, setOnPrep] = useState('')
  const [showHealthOnProfile, setShowHealthOnProfile] = useState(false)

  // Interests
  const [selectedInterests, setSelectedInterests] = useState<Array<string>>([])

  // Socials
  const [socialInstagram, setSocialInstagram] = useState('')
  const [socialTwitter, setSocialTwitter] = useState('')
  const [socialSnapchat, setSocialSnapchat] = useState('')
  const [socialTiktok, setSocialTiktok] = useState('')
  const [socialSpotify, setSocialSpotify] = useState('')

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.displayName ?? '')
    setAge(profile.age != null ? String(profile.age) : '')
    setBio(profile.bio ?? '')
    setLookingFor(profile.lookingFor ?? '')
    setPosition(profile.position ?? '')
    setRelationshipStatus(profile.relationshipStatus ?? '')
    setSelectedInterests(profile.interests ?? [])
    setHeightInches(profile.height ?? undefined)
    setWeight(profile.weight != null ? String(profile.weight) : '')
    setBodyType(profile.bodyType ?? '')
    setEthnicity(profile.ethnicity ?? '')
    setEndowment(profile.endowment ?? '')
    setHivStatus(profile.hivStatus ?? '')
    setLastTested(profile.lastTested ?? '')
    setOnPrep(profile.onPrep ?? '')
    setShowHealthOnProfile(profile.showHealthOnProfile ?? false)
    setShowStatsOnProfile(profile.showStatsOnProfile ?? true)
    setSelectedTribes(profile.tribes ?? [])
    setPronouns(profile.pronouns ?? '')
    setHosting(profile.hosting ?? '')
    setAccommodation(profile.accommodation ?? '')
    setSafeSex(profile.safeSex ?? '')
    setNsfwPref(profile.nsfwPref ?? '')
    setSocialInstagram(profile.socialInstagram ?? '')
    setSocialTwitter(profile.socialTwitter ?? '')
    setSocialSnapchat(profile.socialSnapchat ?? '')
    setSocialTiktok(profile.socialTiktok ?? '')
    setSocialSpotify(profile.socialSpotify ?? '')
  }, [profile])

  useEffect(() => {
    setHideAge(user?.hideAge ?? false)
  }, [user?.hideAge])

  useEffect(() => {
    if (!profile) return
    const changed =
      displayName !== (profile.displayName ?? '') ||
      age !== (profile.age != null ? String(profile.age) : '') ||
      hideAge !== (user?.hideAge ?? false) ||
      bio !== (profile.bio ?? '') ||
      lookingFor !== (profile.lookingFor ?? '') ||
      position !== (profile.position ?? '') ||
      relationshipStatus !== (profile.relationshipStatus ?? '') ||
      JSON.stringify(selectedInterests) !==
        JSON.stringify(profile.interests ?? []) ||
      (heightInches ?? null) !== (profile.height ?? null) ||
      weight !== (profile.weight != null ? String(profile.weight) : '') ||
      bodyType !== (profile.bodyType ?? '') ||
      ethnicity !== (profile.ethnicity ?? '') ||
      endowment !== (profile.endowment ?? '') ||
      hivStatus !== (profile.hivStatus ?? '') ||
      lastTested !== (profile.lastTested ?? '') ||
      onPrep !== (profile.onPrep ?? '') ||
      showHealthOnProfile !== (profile.showHealthOnProfile ?? false) ||
      showStatsOnProfile !== (profile.showStatsOnProfile ?? true) ||
      JSON.stringify(selectedTribes) !== JSON.stringify(profile.tribes ?? []) ||
      pronouns !== (profile.pronouns ?? '') ||
      hosting !== (profile.hosting ?? '') ||
      accommodation !== (profile.accommodation ?? '') ||
      safeSex !== (profile.safeSex ?? '') ||
      nsfwPref !== (profile.nsfwPref ?? '') ||
      socialInstagram !== (profile.socialInstagram ?? '') ||
      socialTwitter !== (profile.socialTwitter ?? '') ||
      socialSnapchat !== (profile.socialSnapchat ?? '') ||
      socialTiktok !== (profile.socialTiktok ?? '') ||
      socialSpotify !== (profile.socialSpotify ?? '')
    setHasChanges(changed)
  }, [
    displayName, age, hideAge, bio, lookingFor, position, relationshipStatus,
    selectedInterests, heightInches, weight, bodyType, ethnicity, endowment,
    hivStatus, lastTested, onPrep, showHealthOnProfile, showStatsOnProfile,
    selectedTribes, pronouns, hosting, accommodation, safeSex, nsfwPref,
    socialInstagram, socialTwitter, socialSnapchat, socialTiktok,
    socialSpotify, profile, user?.hideAge,
  ])

  const parsedAge = useMemo(() => {
    const value = Number(age)
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined
  }, [age])

  const isValid = useCallback(() => {
    return (
      displayName.trim().length >= 2 &&
      parsedAge !== undefined &&
      parsedAge >= 18 &&
      lookingFor !== ''
    )
  }, [displayName, lookingFor, parsedAge])

  const handleSave = async () => {
    if (!user?._id || !isValid()) return
    if ((parsedAge ?? 0) < 18) {
      Alert.alert('Age requirement', 'Civic Research Hub is only for users 18 and older.')
      return
    }

    try {
      setIsSaving(true)
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        age: parsedAge,
        hideAge,
        lookingFor,
        position: position || undefined,
        relationshipStatus: relationshipStatus || undefined,
        interests: selectedInterests,
        height: heightInches,
        weight: weight ? parseInt(weight) : undefined,
        bodyType: bodyType || undefined,
        ethnicity: ethnicity || undefined,
        endowment: endowment || undefined,
        hivStatus: hivStatus || undefined,
        lastTested: lastTested.trim() || undefined,
        onPrep: onPrep || undefined,
        showHealthOnProfile,
        showStatsOnProfile,
        tribes: selectedTribes.length > 0 ? selectedTribes : undefined,
        pronouns: pronouns || undefined,
        hosting: hosting || undefined,
        accommodation: accommodation || undefined,
        safeSex: safeSex || undefined,
        nsfwPref: nsfwPref || undefined,
        socialInstagram: socialInstagram.trim() || undefined,
        socialTwitter: socialTwitter.trim() || undefined,
        socialSnapchat: socialSnapchat.trim() || undefined,
        socialTiktok: socialTiktok.trim() || undefined,
        socialSpotify: socialSpotify.trim() || undefined,
        onboardingComplete: true,
        ageConfirmedAt: Date.now(),
      })
      setHasChanges(false)
      Alert.alert('Saved', 'Your profile has been updated.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Profile update failed'
      Alert.alert('Update failed', message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F11A23" />
      </View>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate title="Profile" description="Sign in to manage your account." />
    )
  }

  const hasUltraAccess =
    ((user.subscriptionTier === 'ultra' || user.subscriptionTier === 'pro') &&
      user.subscriptionStatus === 'active') ||
    (user.referralUltraExpiresAt ?? 0) > Date.now()
  const isUltra = hasUltraAccess

  const photos =
    (profilePhotos
      ?.map((p: { url?: string | null }) => p.url ?? undefined)
      .filter(Boolean) as Array<string>) ?? []
  const hasMultiplePhotos = photos.length > 1
  const currentPhoto = photos[currentPhotoIndex]
  const initials = (displayName || user.name || '?')
    .slice(0, 2)
    .toUpperCase()

  const statsLineParts: Array<string> = []
  if (parsedAge && !hideAge) statsLineParts.push(String(parsedAge))
  if (heightInches) statsLineParts.push(formatHeightInches(heightInches))
  if (weight) statsLineParts.push(`${weight} lbs`)
  if (position) statsLineParts.push(findLabel(POSITION_OPTIONS, position))
  const statsLine = statsLineParts.join(' · ')

  const lookingForOption = LOOKING_FOR_OPTIONS.find((o) => o.id === lookingFor)

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero photo carousel */}
        <View
          className="relative bg-black"
          style={{ height: PHOTO_HEIGHT + insets.top, marginTop: -insets.top }}
        >
          <View style={{ height: insets.top, backgroundColor: '#000' }} />
          <Pressable
            className="h-full w-full"
            onPress={() => {
              if (hasMultiplePhotos) {
                setCurrentPhotoIndex((prev) =>
                  prev < photos.length - 1 ? prev + 1 : 0,
                )
              }
            }}
          >
            {currentPhoto ? (
              <ResolvedImage
                uri={currentPhoto}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <View className="mb-3 h-24 w-24 items-center justify-center rounded-full bg-white/10">
                  <Text className="text-3xl font-semibold text-white/70">
                    {initials}
                  </Text>
                </View>
                <Text className="text-sm text-white/50">No photos yet</Text>
              </View>
            )}
          </Pressable>

          {hasMultiplePhotos ? (
            <View
              className="absolute left-3 right-3 flex-row gap-1"
              style={{ top: insets.top + 10 }}
            >
              {photos.map((_, i) => (
                <View
                  key={i}
                  className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25"
                >
                  <View
                    className={`h-full ${
                      i === currentPhotoIndex ? 'w-full bg-white' : 'w-0'
                    }`}
                  />
                </View>
              ))}
            </View>
          ) : null}

          {/* Top-right actions */}
          <View
            className="absolute right-3 flex-row gap-2"
            style={{ top: insets.top + 18 }}
          >
            <Pressable
              onPress={() => router.push('/settings' as never)}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            >
              <Settings color="#FFFFFF" size={18} />
            </Pressable>
          </View>

          {/* Bottom gradient fade */}
          <LinearGradient
            pointerEvents="none"
            colors={[
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0.2)',
              'rgba(0,0,0,0.55)',
              'rgba(0,0,0,0.9)',
              '#000000',
            ]}
            locations={[0, 0.3, 0.6, 0.85, 1]}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 240,
            }}
          />

          {/* Edit photos pill */}
          <Pressable
            onPress={() => setPicker({ kind: 'photos', title: 'Photos' })}
            className="absolute right-4 bottom-4 flex-row items-center gap-1.5 rounded-full px-4 py-2.5"
            style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
          >
            <ImageIcon color="#FFFFFF" size={15} />
            <Text className="text-sm font-semibold text-white">
              Edit Photos
            </Text>
          </Pressable>

          {/* Name & stats overlay (matches profile view) */}
          <View className="absolute left-4 right-4 bottom-4 pr-32">
            <Pressable
              onPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'Display Name',
                  value: displayName,
                  placeholder: 'How should we call you?',
                  maxLength: 20,
                  onChange: setDisplayName,
                })
              }
            >
              <Text
                className="text-3xl font-bold text-white"
                style={{
                  textShadowColor: 'rgba(0,0,0,0.5)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {displayName || 'Tap to set name'}
              </Text>
            </Pressable>
            {statsLine ? (
              <Text className="mt-1 text-sm font-medium text-white/85">
                {statsLine}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Body */}
        <View className="-mt-5 gap-4 px-4">
          {/* Looking For — primary call card */}
          <Card>
            <Pressable
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'Looking For',
                  options: LOOKING_FOR_OPTIONS,
                  value: lookingFor,
                  onChange: setLookingFor,
                })
              }
              className="flex-row items-center justify-between gap-3 p-5"
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="h-12 w-12 items-center justify-center bg-white/8"
                  style={{ borderRadius: 18, borderCurve: 'continuous' }}
                >
                  <Text className="text-2xl">{lookingForOption?.icon ?? '✨'}</Text>
                </View>
                <View>
                  <Text className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Looking For
                  </Text>
                  <Text className="mt-0.5 text-lg font-semibold text-foreground">
                    {lookingForOption?.label ?? 'Tap to choose'}
                  </Text>
                </View>
              </View>
              <ChevronRight color="#a1a1aa" size={20} />
            </Pressable>
          </Card>

          {/* Identity */}
          <Card>
            <CardHeader title="Identity" />
            <DividerRow />
            <Row
              label="Display Name"
              value={displayName}
              placeholder="Tap to set"
              onPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'Display Name',
                  value: displayName,
                  placeholder: 'How should we call you?',
                  maxLength: 20,
                  onChange: setDisplayName,
                })
              }
            />
            <DividerRow />
            <Row
              label="Age"
              value={parsedAge ? String(parsedAge) : ''}
              placeholder="18+"
              onPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'Age',
                  value: age,
                  placeholder: '18+',
                  keyboardType: 'number-pad',
                  maxLength: 3,
                  onChange: setAge,
                })
              }
            />
            <DividerRow />
            <ToggleRow
              label="Hide Age"
              subtitle="Keep your age off your public profile"
              value={hideAge}
              onValueChange={setHideAge}
            />
            <DividerRow />
            <Row
              label="Pronouns"
              value={findLabel(PRONOUNS_OPTIONS, pronouns)}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'Pronouns',
                  options: PRONOUNS_OPTIONS,
                  value: pronouns,
                  onChange: setPronouns,
                })
              }
            />
            <DividerRow />
            <Row
              label="Relationship"
              value={findLabel(RELATIONSHIP_STATUS_OPTIONS, relationshipStatus)}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'Relationship',
                  options: RELATIONSHIP_STATUS_OPTIONS,
                  value: relationshipStatus,
                  onChange: setRelationshipStatus,
                })
              }
            />
          </Card>

          {/* Bio */}
          <Card>
            <CardHeader
              title="Bio"
              action={
                <Pencil color="#a1a1aa" size={14} />
              }
              onActionPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'Bio',
                  value: bio,
                  placeholder: 'Tell people about yourself...',
                  multiline: true,
                  maxLength: 250,
                  onChange: setBio,
                })
              }
            />
            <Pressable
              onPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'Bio',
                  value: bio,
                  placeholder: 'Tell people about yourself...',
                  multiline: true,
                  maxLength: 250,
                  onChange: setBio,
                })
              }
              className="px-5 pb-5"
            >
              {bio ? (
                <Text className="text-base leading-relaxed text-foreground">
                  {bio}
                </Text>
              ) : (
                <Text className="text-base text-muted-foreground">
                  Tell people about yourself…
                </Text>
              )}
            </Pressable>
          </Card>

          {/* Stats & Body */}
          <Card>
            <CardHeader title="Stats & Body" />
            <DividerRow />
            <ToggleRow
              label="Show on profile"
              subtitle="Let other members see your stats"
              value={showStatsOnProfile}
              onValueChange={setShowStatsOnProfile}
            />
            <DividerRow />
            <Row
              label="Position"
              value={findLabel(POSITION_OPTIONS, position)}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'Position',
                  options: POSITION_OPTIONS,
                  value: position,
                  onChange: setPosition,
                })
              }
            />
            <DividerRow />
            <Row
              label="Height"
              value={heightInches ? formatHeightInches(heightInches) : ''}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'Height',
                  options: buildHeightOptions(),
                  value: heightInches ? String(heightInches) : '',
                  onChange: (id) =>
                    setHeightInches(id ? parseInt(id) : undefined),
                })
              }
            />
            <DividerRow />
            <Row
              label="Weight"
              value={weight ? `${weight} lbs` : ''}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'Weight (lbs)',
                  value: weight,
                  placeholder: '175',
                  keyboardType: 'number-pad',
                  maxLength: 3,
                  onChange: setWeight,
                })
              }
            />
            <DividerRow />
            <Row
              label="Body Type"
              value={findLabel(BODY_TYPE_OPTIONS, bodyType)}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'Body Type',
                  options: BODY_TYPE_OPTIONS,
                  value: bodyType,
                  onChange: setBodyType,
                })
              }
            />
            <DividerRow />
            <Row
              label="Ethnicity"
              value={findLabel(ETHNICITY_OPTIONS, ethnicity)}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'Ethnicity',
                  options: ETHNICITY_OPTIONS,
                  value: ethnicity,
                  onChange: setEthnicity,
                })
              }
            />
            <DividerRow />
            <Row
              label="Endowment"
              value={endowment ? `${endowment}"` : ''}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'Endowment (inches)',
                  value: endowment,
                  placeholder: 'e.g. 7',
                  keyboardType: 'decimal-pad',
                  maxLength: 4,
                  onChange: setEndowment,
                })
              }
            />
          </Card>

          {/* Tribes */}
          <Card>
            <CardHeader
              title="Tribes"
              subtitle={`${selectedTribes.length}/${MAX_TRIBES}`}
              action={<Pencil color="#a1a1aa" size={14} />}
              onActionPress={() =>
                setPicker({
                  kind: 'multi',
                  title: 'Tribes',
                  options: TRIBE_OPTIONS,
                  value: selectedTribes,
                  maxSelections: MAX_TRIBES,
                  onChange: setSelectedTribes,
                })
              }
            />
            <ChipsDisplay
              ids={selectedTribes}
              options={TRIBE_OPTIONS}
              emptyLabel="Tap edit to add tribes"
              onPress={() =>
                setPicker({
                  kind: 'multi',
                  title: 'Tribes',
                  options: TRIBE_OPTIONS,
                  value: selectedTribes,
                  maxSelections: MAX_TRIBES,
                  onChange: setSelectedTribes,
                })
              }
            />
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader
              title="Interests"
              subtitle={`${selectedInterests.length}/${MAX_INTERESTS}`}
              action={<Pencil color="#a1a1aa" size={14} />}
              onActionPress={() =>
                setPicker({
                  kind: 'interests',
                  title: 'Interests',
                  value: selectedInterests,
                  onChange: setSelectedInterests,
                })
              }
            />
            <ChipsDisplay
              ids={selectedInterests}
              options={selectedInterests.map((id) => ({ id, label: id }))}
              emptyLabel="Tap edit to add interests"
              onPress={() =>
                setPicker({
                  kind: 'interests',
                  title: 'Interests',
                  value: selectedInterests,
                  onChange: setSelectedInterests,
                })
              }
            />
          </Card>

          {/* Health */}
          <Card>
            <CardHeader title="Health & Safety" icon={HeartPulse} />
            <DividerRow />
            <ToggleRow
              label="Show on profile"
              subtitle="Let other members see your health info"
              value={showHealthOnProfile}
              onValueChange={setShowHealthOnProfile}
            />
            <DividerRow />
            <Row
              label="HIV Status"
              value={findLabel(HIV_STATUS_OPTIONS, hivStatus)}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'HIV Status',
                  options: HIV_STATUS_OPTIONS,
                  value: hivStatus,
                  onChange: setHivStatus,
                })
              }
            />
            <DividerRow />
            <Row
              label="Last Tested"
              value={lastTested}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'Last Tested',
                  value: lastTested,
                  placeholder: 'e.g. Jan 2025',
                  maxLength: 50,
                  onChange: setLastTested,
                })
              }
            />
            <DividerRow />
            <Row
              label="On PrEP"
              value={findLabel(PREP_OPTIONS, onPrep)}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'On PrEP',
                  options: PREP_OPTIONS,
                  value: onPrep,
                  onChange: setOnPrep,
                })
              }
            />
          </Card>

          {/* Meetup Preferences */}
          <Card>
            <CardHeader title="Meetup Preferences" icon={Sparkles} />
            <DividerRow />
            <Row
              label="Hosting"
              value={findLabel(HOSTING_OPTIONS, hosting)}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'Hosting',
                  options: HOSTING_OPTIONS,
                  value: hosting,
                  onChange: setHosting,
                })
              }
            />
            <DividerRow />
            <Row
              label="Accommodation"
              value={findLabel(ACCOMMODATION_OPTIONS, accommodation)}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'Accommodation',
                  options: ACCOMMODATION_OPTIONS,
                  value: accommodation,
                  onChange: setAccommodation,
                })
              }
            />
            <DividerRow />
            <Row
              label="Safe Sex"
              value={findLabel(SAFE_SEX_OPTIONS, safeSex)}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'Safe Sex',
                  options: SAFE_SEX_OPTIONS,
                  value: safeSex,
                  onChange: setSafeSex,
                })
              }
            />
            <DividerRow />
            <Row
              label="NSFW Messaging"
              value={findLabel(NSFW_PREF_OPTIONS, nsfwPref)}
              placeholder="Add"
              onPress={() =>
                setPicker({
                  kind: 'single',
                  title: 'NSFW Messaging',
                  options: NSFW_PREF_OPTIONS,
                  value: nsfwPref,
                  onChange: setNsfwPref,
                })
              }
            />
          </Card>

          {/* Socials */}
          <Card>
            <CardHeader title="Socials" icon={Link2} />
            <DividerRow />
            <SocialRow
              icon={Instagram}
              label="Instagram"
              value={socialInstagram}
              onPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'Instagram',
                  value: socialInstagram,
                  placeholder: 'username',
                  maxLength: 30,
                  onChange: setSocialInstagram,
                })
              }
            />
            <DividerRow />
            <SocialRow
              icon={Twitter}
              label="X / Twitter"
              value={socialTwitter}
              onPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'X / Twitter',
                  value: socialTwitter,
                  placeholder: 'username',
                  maxLength: 30,
                  onChange: setSocialTwitter,
                })
              }
            />
            <DividerRow />
            <SocialRow
              icon={Ghost}
              label="Snapchat"
              value={socialSnapchat}
              onPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'Snapchat',
                  value: socialSnapchat,
                  placeholder: 'username',
                  maxLength: 30,
                  onChange: setSocialSnapchat,
                })
              }
            />
            <DividerRow />
            <SocialRow
              icon={Clapperboard}
              label="TikTok"
              value={socialTiktok}
              onPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'TikTok',
                  value: socialTiktok,
                  placeholder: 'username',
                  maxLength: 30,
                  onChange: setSocialTiktok,
                })
              }
            />
            <DividerRow />
            <SocialRow
              icon={Link2}
              label="Spotify"
              value={socialSpotify}
              onPress={() =>
                setPicker({
                  kind: 'text',
                  title: 'Spotify',
                  value: socialSpotify,
                  placeholder: 'username',
                  maxLength: 100,
                  onChange: setSocialSpotify,
                })
              }
            />
          </Card>

          {/* Account */}
          <Card>
            <CardHeader title="Account" />
            <DividerRow />
            <Pressable
              onPress={() => router.push('/settings' as never)}
              className="flex-row items-center justify-between px-5 py-4"
            >
              <Text className="text-base font-medium text-foreground">
                Settings
              </Text>
              <ChevronRight color="#a1a1aa" size={18} />
            </Pressable>
            <DividerRow />
            <Pressable
              onPress={() => router.push('/referrals' as never)}
              className="flex-row items-center justify-between px-5 py-4"
            >
              <Text className="text-base font-medium text-foreground">
                Referrals
              </Text>
              <ChevronRight color="#a1a1aa" size={18} />
            </Pressable>
            <DividerRow />
            <Pressable
              onPress={() => void signOut()}
              className="flex-row items-center gap-2 px-5 py-4"
            >
              <LogOut color="#dc2626" size={18} />
              <Text className="text-base font-medium text-destructive">
                Sign Out
              </Text>
            </Pressable>
          </Card>

          {workosUser?.email ? (
            <Text className="text-center text-xs text-muted-foreground/70">
              {workosUser.email}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* Floating save bar */}
      {hasChanges ? (
        <View
          className="absolute inset-x-4 rounded-full border border-white/10"
          style={{
            bottom: insets.bottom + 64,
            backgroundColor: 'rgba(20,20,22,0.92)',
            shadowColor: '#000',
            shadowOpacity: 0.5,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
            elevation: 16,
          }}
        >
          <Pressable
            disabled={!isValid() || isSaving}
            onPress={() => void handleSave()}
            className="h-14 flex-row items-center justify-center gap-2 rounded-full"
            style={{
              backgroundColor:
                isValid() && !isSaving ? '#F11A23' : 'rgba(241,26,35,0.4)',
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Check color="#FFFFFF" size={18} />
                <Text className="text-base font-semibold text-white">
                  Save Changes
                </Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}

      {/* Picker modal */}
      <PickerSheet
        config={picker}
        onClose={() => setPicker(null)}
        userId={user._id}
        isUltra={isUltra}
      />
    </View>
  )
}

// ----- Card primitives -----

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="overflow-hidden border border-white/8 bg-card"
      style={{ borderRadius: 28, borderCurve: 'continuous' }}
    >
      {children}
    </View>
  )
}

function CardHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  onActionPress,
}: {
  title: string
  subtitle?: string
  icon?: LucideIcon
  action?: React.ReactNode
  onActionPress?: () => void
}) {
  return (
    <View className="flex-row items-center justify-between gap-2 px-5 pt-4 pb-2.5">
      <View className="flex-row items-center gap-2">
        {Icon ? <Icon color="#a1a1aa" size={14} /> : null}
        <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80">
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-[11px] font-medium tabular-nums text-muted-foreground/60">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Pressable
          onPress={onActionPress}
          hitSlop={8}
          className="h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        >
          {action}
        </Pressable>
      ) : null}
    </View>
  )
}

function DividerRow() {
  return (
    <View className="h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
  )
}

function Row({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string
  value: string
  placeholder: string
  onPress: () => void
}) {
  const filled = value && value.length > 0
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between gap-3 px-5 py-4"
    >
      <Text className="text-base text-muted-foreground">{label}</Text>
      <View className="flex-row items-center gap-1.5">
        <Text
          className={`text-base font-medium ${
            filled ? 'text-foreground' : 'text-muted-foreground/50'
          }`}
          numberOfLines={1}
          style={{ maxWidth: SCREEN_WIDTH * 0.45 }}
        >
          {filled ? value : placeholder}
        </Text>
        <ChevronRight color="#a1a1aa" size={16} />
      </View>
    </Pressable>
  )
}

function ToggleRow({
  label,
  subtitle,
  value,
  onValueChange,
}: {
  label: string
  subtitle?: string
  value: boolean
  onValueChange: (v: boolean) => void
}) {
  return (
    <View className="flex-row items-center justify-between gap-3 px-5 py-3.5">
      <View className="flex-1">
        <Text className="text-base font-medium text-foreground">{label}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#2A2A2C', true: '#F11A23' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#2A2A2C"
      />
    </View>
  )
}

function SocialRow({
  icon: Icon,
  label,
  value,
  onPress,
}: {
  icon: LucideIcon
  label: string
  value: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-5 py-3.5"
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
      >
        <Icon color="#FAFAFA" size={16} />
      </View>
      <Text className="flex-1 text-base text-muted-foreground">{label}</Text>
      <View className="flex-row items-center gap-1.5">
        <Text
          className={`text-base font-medium ${
            value ? 'text-foreground' : 'text-muted-foreground/50'
          }`}
        >
          {value ? `@${value}` : 'Add'}
        </Text>
        <ChevronRight color="#a1a1aa" size={16} />
      </View>
    </Pressable>
  )
}

function ChipsDisplay({
  ids,
  options,
  onPress,
  emptyLabel,
}: {
  ids: Array<string>
  options: ReadonlyArray<Option>
  onPress: () => void
  emptyLabel: string
}) {
  return (
    <Pressable onPress={onPress} className="px-5 pb-5">
      {ids.length === 0 ? (
        <View
          className="flex-row items-center justify-center gap-1.5 py-4"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 22,
            borderCurve: 'continuous',
          }}
        >
          <Plus color="#a1a1aa" size={14} />
          <Text className="text-sm text-muted-foreground">{emptyLabel}</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {ids.map((id) => {
            const label = findLabel(options, id)
            return (
              <View
                key={id}
                className="rounded-full px-3.5 py-1.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <Text className="text-sm font-medium text-foreground">
                  {label}
                </Text>
              </View>
            )
          })}
        </View>
      )}
    </Pressable>
  )
}

// ----- Picker sheet -----

function PickerSheet({
  config,
  onClose,
  userId,
  isUltra,
}: {
  config: PickerConfig | null
  onClose: () => void
  userId: import('@/src/lib/convexApi').Id<'users'>
  isUltra: boolean
}) {
  const insets = useSafeAreaInsets()

  return (
    <Modal
      visible={config !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="bg-background"
          style={{
            paddingBottom: insets.bottom + 16,
            maxHeight: '88%',
            borderColor: 'rgba(255,255,255,0.08)',
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            borderCurve: 'continuous',
          }}
        >
          <View className="flex-row items-center justify-between px-5 pt-3 pb-1">
            <View
              className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
            />
            <Text className="text-lg font-bold text-foreground">
              {config?.title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              <X color="#FAFAFA" size={16} />
            </Pressable>
          </View>

          {config?.kind === 'single' ? (
            <SinglePicker config={config} onClose={onClose} />
          ) : null}
          {config?.kind === 'multi' ? (
            <MultiPicker config={config} onClose={onClose} />
          ) : null}
          {config?.kind === 'interests' ? (
            <InterestsPicker config={config} onClose={onClose} />
          ) : null}
          {config?.kind === 'text' ? (
            <TextPicker config={config} onClose={onClose} />
          ) : null}
          {config?.kind === 'photos' ? (
            <View className="px-5 pt-3 pb-2" style={{ minHeight: 380 }}>
              <ProfilePhotoGrid userId={userId} isUltra={isUltra} />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

function SinglePicker({
  config,
  onClose,
}: {
  config: Extract<PickerConfig, { kind: 'single' }>
  onClose: () => void
}) {
  return (
    <ScrollView
      className="px-5 pt-3"
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-2">
        {config.options.map((option) => {
          const selected = config.value === option.id
          return (
            <Pressable
              key={option.id}
              onPress={() => {
                config.onChange(selected ? '' : option.id)
                onClose()
              }}
              className="flex-row items-center justify-between gap-3 px-4 py-4"
              style={{
                borderRadius: 22,
                borderCurve: 'continuous',
                backgroundColor: selected
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.04)',
                borderWidth: 1,
                borderColor: selected
                  ? 'rgba(255,255,255,0.22)'
                  : 'rgba(255,255,255,0.06)',
              }}
            >
              <View className="flex-row items-center gap-3">
                {option.icon ? (
                  <Text className="text-xl">{option.icon}</Text>
                ) : null}
                <Text className="text-base font-medium text-foreground">
                  {option.label}
                </Text>
              </View>
              {selected ? (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-white">
                  <Check color="#000" size={14} />
                </View>
              ) : null}
            </Pressable>
          )
        })}

        {config.value ? (
          <Pressable
            onPress={() => {
              config.onChange('')
              onClose()
            }}
            className="mt-2 items-center py-3.5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 22,
              borderCurve: 'continuous',
            }}
          >
            <Text className="text-sm font-medium text-muted-foreground">
              Clear
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  )
}

function MultiPicker({
  config,
  onClose: _onClose,
}: {
  config: Extract<PickerConfig, { kind: 'multi' }>
  onClose: () => void
}) {
  return (
    <ScrollView
      className="px-5 pt-3"
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="mb-3 text-xs text-muted-foreground">
        {config.value.length}
        {config.maxSelections ? `/${config.maxSelections}` : ''} selected
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {config.options.map((option) => {
          const selected = config.value.includes(option.id)
          const disabled =
            !selected &&
            config.maxSelections !== undefined &&
            config.value.length >= config.maxSelections
          return (
            <Pressable
              key={option.id}
              disabled={disabled}
              onPress={() => {
                if (selected) {
                  config.onChange(config.value.filter((v) => v !== option.id))
                } else {
                  config.onChange([...config.value, option.id])
                }
              }}
              className="rounded-full px-4 py-2.5"
              style={{
                backgroundColor: selected
                  ? '#FFFFFF'
                  : 'rgba(255,255,255,0.06)',
                opacity: disabled ? 0.35 : 1,
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: selected ? '#000' : '#FAFAFA' }}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </ScrollView>
  )
}

function InterestsPicker({
  config,
  onClose: _onClose,
}: {
  config: Extract<PickerConfig, { kind: 'interests' }>
  onClose: () => void
}) {
  const [category, setCategory] = useState<'all' | InterestCategory>('all')
  const [search, setSearch] = useState('')

  const visible =
    category === 'all'
      ? Object.values(INTEREST_CATEGORIES).flatMap(
          (c) => c.interests as ReadonlyArray<string>,
        )
      : (INTEREST_CATEGORIES[category].interests as ReadonlyArray<string>)
  const filtered = visible.filter(
    (i) => !search || i.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <View className="flex-1 pt-3" style={{ minHeight: 480 }}>
      <View className="px-5">
        <View
          className="flex-row items-center gap-2 px-4 py-2"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 22,
            borderCurve: 'continuous',
          }}
        >
          <Search color="#a1a1aa" size={16} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search interests..."
            placeholderTextColor="#777"
            className="flex-1 text-base text-foreground"
            style={{ paddingVertical: 8 }}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 12 }}
      >
        {[
          { key: 'all' as const, emoji: '', label: 'All' },
          ...(
            Object.entries(INTEREST_CATEGORIES) as Array<
              [InterestCategory, { emoji: string; label: string }]
            >
          ).map(([key, cat]) => ({
            key,
            emoji: cat.emoji,
            label: cat.label.replace('My ', ''),
          })),
        ].map((pill) => {
          const active = category === pill.key
          return (
            <Pressable
              key={pill.key}
              onPress={() => {
                setCategory(pill.key)
                setSearch('')
              }}
              className="rounded-full px-4 py-2"
              style={{
                backgroundColor: active
                  ? '#FFFFFF'
                  : 'rgba(255,255,255,0.06)',
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: active ? '#000' : '#FAFAFA' }}
              >
                {pill.emoji ? `${pill.emoji} ${pill.label}` : pill.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-3 text-xs text-muted-foreground">
          {config.value.length}/{MAX_INTERESTS} selected
        </Text>
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {filtered.map((interest) => {
            const selected = config.value.includes(interest)
            const disabled =
              !selected && config.value.length >= MAX_INTERESTS
            return (
              <Pressable
                key={interest}
                disabled={disabled}
                onPress={() => {
                  if (selected) {
                    config.onChange(
                      config.value.filter((v) => v !== interest),
                    )
                  } else {
                    config.onChange([...config.value, interest])
                  }
                }}
                className="rounded-full px-3.5 py-2"
                style={{
                  backgroundColor: selected
                    ? '#FFFFFF'
                    : 'rgba(255,255,255,0.06)',
                  opacity: disabled ? 0.35 : 1,
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: selected ? '#000' : '#FAFAFA' }}
                >
                  {interest}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

function TextPicker({
  config,
  onClose,
}: {
  config: Extract<PickerConfig, { kind: 'text' }>
  onClose: () => void
}) {
  const [draft, setDraft] = useState(config.value)
  useEffect(() => setDraft(config.value), [config.value])

  return (
    <View className="px-5 pt-3 pb-2">
      <View
        className="px-4 py-3"
        style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: 22,
          borderCurve: 'continuous',
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={config.placeholder}
          placeholderTextColor="#777"
          maxLength={config.maxLength}
          keyboardType={config.keyboardType}
          multiline={config.multiline}
          autoFocus
          className="text-base text-foreground"
          style={
            config.multiline
              ? { minHeight: 140, textAlignVertical: 'top' }
              : undefined
          }
        />
      </View>
      {config.maxLength && config.multiline ? (
        <Text className="mt-2 text-right text-xs text-muted-foreground">
          {draft.length}/{config.maxLength}
        </Text>
      ) : null}

      <Pressable
        onPress={() => {
          config.onChange(draft)
          onClose()
        }}
        className="mt-4 h-14 items-center justify-center rounded-full"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <Text className="text-base font-semibold text-black">Done</Text>
      </Pressable>
    </View>
  )
}

// ----- Helpers -----

function buildHeightOptions(): Array<Option> {
  const opts: Array<Option> = []
  for (let total = 48; total <= 84; total++) {
    const feet = Math.floor(total / 12)
    const inch = total % 12
    opts.push({ id: String(total), label: `${feet}'${inch}"` })
  }
  return opts
}
