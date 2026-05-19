import { useState } from 'react'
import { useMutation } from 'convex/react'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Bell,
  ChevronRight,
  Eye,
  Gift,
  HeartPulse,
  Languages,
  LogOut,
  Phone,
  Scale,
  Shield,
  SlidersHorizontal,
  Sparkles,
  User,
  UserX,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../src/components/auth/AuthGate'
import { Avatar } from '../src/components/ui/Avatar'
import { useCurrentUser } from '../src/hooks/useCurrentUser'
import { useWorkOSAuth } from '../src/lib/workosAuth'

type PreferenceKey =
  | 'emailNotificationsEnabled'
  | 'showDistance'
  | 'hideAge'
  | 'blurNsfwMedia'
  | 'autoTranslateEnabled'

type SettingRowProps = {
  icon: React.ComponentType<{ color: string; size: number }>
  title: string
  subtitle?: string
  value?: boolean
  onPress: () => void
  danger?: boolean
  isLink?: boolean
  disabled?: boolean
}

function SettingRow({
  icon: Icon,
  title,
  subtitle,
  value,
  onPress,
  danger,
  isLink,
  disabled,
}: SettingRowProps) {
  return (
    <Pressable
      className={`flex-row items-center gap-3 border-b border-border/60 px-4 py-4 ${
        disabled ? 'opacity-50' : ''
      }`}
      disabled={disabled}
      onPress={onPress}
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-xl ${
          danger ? 'bg-destructive/10' : 'bg-primary/10'
        }`}
      >
        <Icon color={danger ? '#DC2626' : '#F11A23'} size={20} />
      </View>
      <View className="flex-1">
        <Text
          className={`text-base font-semibold ${
            danger ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-sm text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {typeof value === 'boolean' ? (
        <View
          className={`h-7 w-12 justify-center rounded-full px-1 ${
            value ? 'items-end bg-primary' : 'items-start bg-muted'
          }`}
        >
          <View className="h-5 w-5 rounded-full bg-white" />
        </View>
      ) : isLink ? (
        <ChevronRight color="#999999" size={20} />
      ) : null}
    </Pressable>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const { signOut } = useWorkOSAuth()
  const { isAuthenticated, isLoading, user, workosUser } = useCurrentUser()
  const updatePreferences = useMutation(api.members.updateUserPreferences)
  const toggleDoNotDisturb = useMutation(api.members.toggleDoNotDisturb)
  const toggleDiscreet = useMutation(api.members.toggleDiscreet)
  const toggleInvisible = useMutation(api.members.toggleInvisible)
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
      <AuthGate
        title="Settings"
        description="Sign in to manage your account settings."
      />
    )
  }

  const hasUltraAccess =
    ((user.subscriptionTier === 'ultra' || user.subscriptionTier === 'pro') &&
      user.subscriptionStatus === 'active') ||
    (user.referralUltraExpiresAt ?? 0) > Date.now()

  const updatePreference = async (key: PreferenceKey, value: boolean) => {
    try {
      setSavingKey(key)
      await updatePreferences({
        [key]: value,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not update setting'
      Alert.alert('Setting failed', message)
    } finally {
      setSavingKey(null)
    }
  }

  const toggleStatus = async (
    key: 'doNotDisturb' | 'isDiscreet' | 'isInvisible',
  ) => {
    try {
      setSavingKey(key)
      if (key === 'doNotDisturb') await toggleDoNotDisturb({})
      if (key === 'isDiscreet') await toggleDiscreet({})
      if (key === 'isInvisible') await toggleInvisible({})
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not update status'
      Alert.alert('Status failed', message)
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-4 pt-4">
          <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <Avatar imageUrl={user.imageUrl} name={user.name} size="lg" />
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">
                {user.name}
              </Text>
              <Text className="mt-0.5 text-sm text-muted-foreground">
                {workosUser?.email ?? 'No email'}
              </Text>
              <Text className="mt-1 text-xs font-semibold uppercase text-primary">
                {hasUltraAccess ? 'Ultra access' : 'Free'}
              </Text>
            </View>
          </View>
        </View>

        <View className="mx-4 mt-5 overflow-hidden rounded-2xl border border-border bg-card">
          <SettingRow
            icon={User}
            title="Edit Profile"
            subtitle="Photos, stats, health, and bio"
            isLink
            onPress={() => router.push('/(tabs)/profile' as never)}
          />
          <SettingRow
            icon={HeartPulse}
            title="Health"
            subtitle="Health status and nearby testing clinics"
            isLink
            onPress={() => router.push('/health' as never)}
          />
          <SettingRow
            icon={Gift}
            title="Referrals"
            subtitle="Share your code and track rewards"
            isLink
            onPress={() => router.push('/referrals' as never)}
          />
          <SettingRow
            icon={SlidersHorizontal}
            title="Controls"
            subtitle="Location privacy and map browsing"
            isLink
            onPress={() => router.push('/controls' as never)}
          />
          <SettingRow
            icon={Sparkles}
            title="Subscription"
            subtitle={
              hasUltraAccess
                ? 'Your paid or referral Ultra benefits are active'
                : 'Compare plans and manage billing'
            }
            isLink
            onPress={() => router.push('/subscription' as never)}
          />
          <SettingRow
            icon={Phone}
            title="Calls"
            subtitle="Call minutes and active call controls"
            isLink
            onPress={() => router.push('/calls' as never)}
          />
          <SettingRow
            icon={Scale}
            title="Appeals"
            subtitle="Review moderation status and appeal history"
            isLink
            onPress={() => router.push('/appeal' as never)}
          />
          <SettingRow
            icon={Shield}
            title="Moderation Updates"
            subtitle="Warnings, restrictions, and appeal decisions"
            isLink
            onPress={() => router.push('/moderation-notifications' as never)}
          />
          <SettingRow
            icon={UserX}
            title="Blocked Users"
            subtitle="Review and unblock people"
            isLink
            onPress={() => router.push('/blocked-users' as never)}
          />
        </View>

        <Text className="mx-4 mt-6 text-xs font-semibold uppercase text-muted-foreground">
          Notifications
        </Text>
        <View className="mx-4 mt-2 overflow-hidden rounded-2xl border border-border bg-card">
          <SettingRow
            icon={Bell}
            title="Email Notifications"
            subtitle="Messages and account updates"
            value={user.emailNotificationsEnabled ?? true}
            disabled={savingKey === 'emailNotificationsEnabled'}
            onPress={() =>
              void updatePreference(
                'emailNotificationsEnabled',
                !(user.emailNotificationsEnabled ?? true),
              )
            }
          />
        </View>

        <Text className="mx-4 mt-6 text-xs font-semibold uppercase text-muted-foreground">
          Privacy
        </Text>
        <View className="mx-4 mt-2 overflow-hidden rounded-2xl border border-border bg-card">
          <SettingRow
            icon={Eye}
            title="Show Distance"
            subtitle="Let nearby members see approximate distance"
            value={user.showDistance ?? true}
            disabled={savingKey === 'showDistance'}
            onPress={() =>
              void updatePreference(
                'showDistance',
                !(user.showDistance ?? true),
              )
            }
          />
          <SettingRow
            icon={User}
            title="Hide Age"
            subtitle="Do not show your age on profile cards"
            value={user.hideAge ?? false}
            disabled={savingKey === 'hideAge'}
            onPress={() =>
              void updatePreference('hideAge', !(user.hideAge ?? false))
            }
          />
          <SettingRow
            icon={Shield}
            title="Blur NSFW Media"
            subtitle="Blur flagged media in album and feed surfaces"
            value={user.blurNsfwMedia ?? false}
            disabled={savingKey === 'blurNsfwMedia'}
            onPress={() =>
              void updatePreference(
                'blurNsfwMedia',
                !(user.blurNsfwMedia ?? false),
              )
            }
          />
        </View>

        <Text className="mx-4 mt-6 text-xs font-semibold uppercase text-muted-foreground">
          Status
        </Text>
        <View className="mx-4 mt-2 overflow-hidden rounded-2xl border border-border bg-card">
          <SettingRow
            icon={Bell}
            title="Do Not Disturb"
            subtitle="Mute attention indicators"
            value={user.doNotDisturb ?? false}
            disabled={savingKey === 'doNotDisturb'}
            onPress={() => void toggleStatus('doNotDisturb')}
          />
          <SettingRow
            icon={Shield}
            title="Discreet Mode"
            subtitle="Hide from discovery while staying signed in"
            value={user.isDiscreet ?? false}
            disabled={savingKey === 'isDiscreet'}
            onPress={() => void toggleStatus('isDiscreet')}
          />
          <SettingRow
            icon={Eye}
            title="Appear Offline"
            subtitle="Pro and Ultra only"
            value={user.isInvisible ?? false}
            disabled={savingKey === 'isInvisible' || !hasUltraAccess}
            onPress={() => void toggleStatus('isInvisible')}
          />
        </View>

        <Text className="mx-4 mt-6 text-xs font-semibold uppercase text-muted-foreground">
          Language
        </Text>
        <View className="mx-4 mt-2 overflow-hidden rounded-2xl border border-border bg-card">
          <SettingRow
            icon={Languages}
            title="Auto Translate"
            subtitle="Pro and Ultra only"
            value={user.autoTranslateEnabled ?? false}
            disabled={savingKey === 'autoTranslateEnabled'}
            onPress={() =>
              void updatePreference(
                'autoTranslateEnabled',
                !(user.autoTranslateEnabled ?? false),
              )
            }
          />
        </View>

        <View className="mx-4 mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <SettingRow
            icon={LogOut}
            title="Sign Out"
            danger
            onPress={() => {
              void signOut()
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
