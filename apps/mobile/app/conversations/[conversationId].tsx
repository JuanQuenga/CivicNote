import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  useAction,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from 'convex/react'
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av'
import { Image as ExpoImage } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import * as ExpoLocation from 'expo-location'
import {
  Album,
  AudioLines,
  CheckCheck,
  Clock,
  ExternalLink,
  EyeOff,
  ImageIcon,
  MapPin,
  Pause,
  Phone,
  PhoneOff,
  Play,
  Send,
  Sparkles,
  Timer,
  Trash2,
  UserPlus,
  Video,
  X,
} from 'lucide-react-native'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../../src/components/auth/AuthGate'
import {
  AudioWaveform,
  createSeededWaveform,
  normalizeWaveform,
} from '../../src/components/messaging/AudioWaveform'
import { AttachmentMenu } from '../../src/components/messaging/AttachmentMenu'
import { CallRoom } from '../../src/components/messaging/CallRoom'
import { CallSystemMessage } from '../../src/components/messaging/CallSystemMessage'
import { ChatHeader } from '../../src/components/messaging/ChatHeader'
import { CreateGroupSheet } from '../../src/components/messaging/CreateGroupSheet'
import { GroupInfoSheet } from '../../src/components/messaging/GroupInfoSheet'
import { HeaderMenuSheet } from '../../src/components/messaging/HeaderMenuSheet'
import { IncomingCallBanner } from '../../src/components/messaging/IncomingCallBanner'
import {
  MessageActionsSheet,
  REACTION_EMOJIS,
} from '../../src/components/messaging/MessageActionsSheet'
import { MessageReactionPills } from '../../src/components/messaging/MessageReactionPills'
import { MessageComposer } from '../../src/components/messaging/MessageComposer'
import { QuotedMessage } from '../../src/components/messaging/QuotedMessage'
import { ReplyPreview } from '../../src/components/messaging/ReplyPreview'
import { SystemMessage } from '../../src/components/messaging/SystemMessage'
import { TypingIndicator } from '../../src/components/messaging/TypingIndicator'
import { VoiceMessageBubble } from '../../src/components/messaging/VoiceMessageBubble'
import { Avatar } from '../../src/components/ui/Avatar'
import { ResolvedImage } from '../../src/components/ui/ResolvedImage'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { useLocation } from '../../src/hooks/useLocation'
import { useOptimisticThreadMessages } from '../../src/hooks/useOptimisticThreadMessages'
import { useR2Upload } from '../../src/hooks/useR2Upload'
import { formatDateDivider, formatMessageTime } from '../../src/lib/format'
import { openNativeMapSearch } from '../../src/lib/nativeMaps'
import { createOptimisticKey } from '../../src/lib/optimistic'
import type { AttachmentAction } from '../../src/components/messaging/AttachmentMenu'
import type { AVPlaybackStatus } from 'expo-av'
import type { Id } from '@/src/lib/convexApi'

const MIN_RECORDING_DURATION_MS = 350
const RECORDING_BAR_LIMIT = 120
const WEB_MESSAGES_URL = 'https://civicresearchhub.org/messages'
const GIPHY_API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
}

interface VoiceDraft {
  uri: string
  durationMs: number
  waveform: Array<number>
}

type ImageDraft = ImagePicker.ImagePickerAsset
type MessageReaction = {
  emoji: string
  userId: Id<'users'>
  reactedAt: number
}
type ReplyTo = {
  _id: Id<'messages'>
  content: string
  senderId: Id<'users'>
  senderName: string
  format: string
  isDeleted?: boolean
}
type GifResult = {
  id: string
  title: string
  previewUrl: string
  originalUrl: string
}
type SmartReplySuggestion = {
  type: 'text' | 'take_photo' | 'location' | 'unlock_album'
  content: string
}
type ShareMember = {
  _id: Id<'users'>
  name: string
  imageUrl?: string
  isOnline?: boolean
  distanceMiles?: number
  profile?: {
    displayName?: string
    age?: number
    profilePhotoUrl?: string
    profilePhotoUrls?: Array<string>
  } | null
  customStatusEmoji?: string
  customStatusText?: string
}
type ShareAlbum = {
  _id: Id<'albums'>
  name: string
  coverUrl?: string | null
  photoCount?: number
  isDefault?: boolean
}

const isCallEventType = (
  value: string | undefined,
): value is 'call_started' | 'call_ended' | 'call_missed' | 'call_declined' =>
  value === 'call_started' ||
  value === 'call_ended' ||
  value === 'call_missed' ||
  value === 'call_declined'

function asConversationId(value: string | Array<string> | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  return raw as Id<'conversations'> | undefined
}

function normalizeMeteringValue(metering: number): number {
  const clamped = Math.max(-60, Math.min(0, metering))
  return (clamped + 60) / 60
}

function formatDuration(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0
  const mins = Math.floor(safe / 60)
  const secs = Math.floor(safe % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDistance(miles?: number): string | null {
  if (miles === undefined) return null
  if (miles < 0.5) return 'Nearby'
  if (miles < 1) return '< 1 mi'
  return `${Math.round(miles)} mi`
}

function formatConversationDistance(miles?: number | null): string | null {
  if (miles === undefined || miles === null) return null
  if (miles < 0.1) return '<0.1 mi'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

function parseJsonContent<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

async function setRecordingAudioMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  })
}

async function setPlaybackAudioMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  })
}

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ conversationId?: string }>()
  const conversationId = asConversationId(params.conversationId)
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const { location, requestPermission } = useLocation()
  const { upload, isUploading: isUploadingVoice } = useR2Upload(user?._id)

  const [draft, setDraft] = useState('')
  const [composerHeight, setComposerHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDurationMs, setRecordingDurationMs] = useState(0)
  const [recordingWaveform, setRecordingWaveform] = useState<Array<number>>(
    createSeededWaveform('recording-idle'),
  )
  const [voiceDraft, setVoiceDraft] = useState<VoiceDraft | null>(null)
  const [imageDraft, setImageDraft] = useState<ImageDraft | null>(null)
  const [isEphemeral, setIsEphemeral] = useState(false)
  const [isInvisibleInk, setIsInvisibleInk] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [showSharePicker, setShowSharePicker] = useState(false)
  const [shareMode, setShareMode] = useState<'spot' | 'member' | 'album'>(
    'spot',
  )
  const [shareSearch, setShareSearch] = useState('')
  const [gifSearch, setGifSearch] = useState('')
  const [gifResults, setGifResults] = useState<Array<GifResult>>([])
  const [isGifLoading, setIsGifLoading] = useState(false)
  const [messageSearch, setMessageSearch] = useState('')
  const [smartRepliesDismissedFor, setSmartRepliesDismissedFor] =
    useState<Id<'messages'> | null>(null)
  const [editingMessageId, setEditingMessageId] =
    useState<Id<'messages'> | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [isEditSaving, setIsEditSaving] = useState(false)
  const [revealedMessageIds, setRevealedMessageIds] = useState<
    Set<Id<'messages'>>
  >(new Set())
  const [isPlayingVoiceDraft, setIsPlayingVoiceDraft] = useState(false)
  const [voicePreviewPositionMs, setVoicePreviewPositionMs] = useState(0)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [activeMessage, setActiveMessage] = useState<{
    messageId: Id<'messages'>
    senderId: Id<'users'>
    content: string
    format: string
    reactions?: Array<MessageReaction>
    sentAt: number
    isOwn: boolean
  } | null>(null)
  const [replyingTo, setReplyingTo] = useState<{
    messageId: Id<'messages'>
    senderName: string
    content: string
    format: string
  } | null>(null)
  const [dismissedIncomingCallId, setDismissedIncomingCallId] =
    useState<Id<'callSessions'> | null>(null)
  const [optimisticOutgoingCall, setOptimisticOutgoingCall] = useState<{
    _id: Id<'callSessions'>
    conversationId: Id<'conversations'>
    initiatorId: Id<'users'>
    status: 'ringing'
    type: 'audio' | 'video'
  } | null>(null)

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingRef = useRef<number>(0)
  const recordingRef = useRef<Audio.Recording | null>(null)
  const recordingPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordingStartRef = useRef<number>(0)
  const meteringValuesRef = useRef<Array<number>>([])
  const voicePreviewSoundRef = useRef<Audio.Sound | null>(null)
  const isRecordButtonPressedRef = useRef(false)
  const stopRecordingWhenReadyRef = useRef(false)
  const stopRecordingRef = useRef<null | (() => Promise<void>)>(null)

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true)
    })
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  const conversation = useQuery(
    api.messages.getConversation,
    conversationId && user?._id ? { conversationId } : 'skip',
  )

  const { loadMore, results, status } = usePaginatedQuery(
    api.messages.listMessages,
    conversationId && user?._id ? { conversationId } : 'skip',
    { initialNumItems: 40 },
  )
  const latestIncomingMessage = useMemo(
    () =>
      results.find(
        (message) =>
          message.senderId !== user?._id &&
          !message.isDeleted &&
          (message.format === 'text' ||
            message.format === 'image' ||
            message.format === 'location'),
      ),
    [results, user?._id],
  )

  const typingUsers = useQuery(
    api.messages.getTypingUsers,
    conversationId && user?._id ? { conversationId } : 'skip',
  )
  const deferredMessageSearch = useDeferredValue(messageSearch)
  const deferredGifSearch = useDeferredValue(gifSearch)
  const deferredShareSearch = useDeferredValue(shareSearch)
  const messageSearchResults = useQuery(
    api.messages.searchMessagesInConversation,
    conversationId && user?._id && deferredMessageSearch.trim().length >= 2
      ? { conversationId, query: deferredMessageSearch }
      : 'skip',
  )
  const smartReplySuggestions = useQuery(
    api.smartReplies.getCurrentUserPrecomputedSmartReplies,
    conversationId &&
      latestIncomingMessage?._id &&
      smartRepliesDismissedFor !== latestIncomingMessage._id
      ? { conversationId, messageId: latestIncomingMessage._id }
      : 'skip',
  )
  const smartReplyLimit = useQuery(
    api.smartReplies.checkCurrentUserSmartReplyLimit,
    conversationId && latestIncomingMessage?._id ? { conversationId } : 'skip',
  )
  const shareSpotResults = useQuery(
    api.spots.listSpots,
    showSharePicker && shareMode === 'spot'
      ? {
          searchQuery: deferredShareSearch.trim() || undefined,
          latitude: location?.latitude,
          longitude: location?.longitude,
          limit: 30,
        }
      : 'skip',
  )
  const shareMemberSearchResults = useQuery(
    api.members.searchUsers,
    showSharePicker &&
      shareMode === 'member' &&
      user?._id &&
      deferredShareSearch.trim().length >= 2
      ? { query: deferredShareSearch, limit: 30 }
      : 'skip',
  )
  const shareNearbyMemberResults = useQuery(
    api.members.getNearbyUsers,
    showSharePicker &&
      shareMode === 'member' &&
      location &&
      deferredShareSearch.trim().length < 2
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          maxDistanceMiles: 50,
          limit: 30,
          includeSelf: false,
        }
      : 'skip',
  )
  const shareAlbums = useQuery(
    api.albums.listMyAlbums,
    showSharePicker && shareMode === 'album' && user?._id ? {} : 'skip',
  )

  useEffect(() => {
    if (!showGifPicker || !GIPHY_API_KEY) {
      setGifResults([])
      setIsGifLoading(false)
      return
    }

    const controller = new AbortController()
    const query = deferredGifSearch.trim()
    const endpoint = query
      ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=r`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=r`

    setIsGifLoading(true)
    fetch(endpoint, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load GIFs')
        return (await response.json()) as {
          data?: Array<{
            id?: string
            title?: string
            images?: {
              fixed_width?: { url?: string }
              original?: { url?: string }
            }
          }>
        }
      })
      .then((payload) => {
        const nextResults =
          payload.data
            ?.map((item) => {
              const previewUrl = item.images?.fixed_width?.url
              const originalUrl = item.images?.original?.url ?? previewUrl
              if (!item.id || !previewUrl || !originalUrl) return null
              return {
                id: item.id,
                title: item.title ?? 'GIF',
                previewUrl,
                originalUrl,
              }
            })
            .filter((item): item is GifResult => item !== null) ?? []
        setGifResults(nextResults)
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return
        setGifResults([])
      })
      .finally(() => setIsGifLoading(false))

    return () => controller.abort()
  }, [deferredGifSearch, showGifPicker])
  const activeCall = useQuery(api.callSessions.getMyActiveCall)
  const callCredits = useQuery(api.callSessions.getCallCredits)

  const sendMessage = useAction(api.messages.sendMessageToConversation)
  const mintCallToken = useAction(api.callSessionsNode.mintCallToken)
  const markMessagesRead = useMutation(api.messages.markMessagesRead)
  const setTypingStatus = useMutation(api.messages.setTypingStatus)
  const addReaction = useMutation(api.messages.addReaction)
  const removeReaction = useMutation(api.messages.removeReaction)
  const deleteMessage = useMutation(api.messages.deleteMessage)
  const reportMessage = useMutation(api.messages.reportMessage)
  const blockUser = useMutation(api.members.blockUser)
  const reportUser = useMutation(api.members.reportUser)
  const startCall = useMutation(api.callSessions.startCall)
  const answerCall = useMutation(api.callSessions.answerCall)
  const declineCall = useMutation(api.callSessions.declineCall)
  const endCall = useMutation(api.callSessions.endCall)
  const leaveCall = useMutation(api.callSessions.leaveCall)
  const markParticipantConnected = useMutation(
    api.callSessions.markParticipantConnected,
  )
  const createMeetupDistance = useMutation(
    api.meetupDistance.createMeetupDistanceRequest,
  )
  const editMessage = useAction(api.messages.editMessage)
  const incrementSmartReplyUsage = useMutation(
    api.smartReplies.incrementCurrentUserSmartReplyUsage,
  )
  const shareAlbum = useMutation(api.albums.shareAlbum)

  useEffect(() => {
    if (!conversationId || !user?._id || results.length === 0) return
    void markMessagesRead({ conversationId })
  }, [conversationId, markMessagesRead, results.length, user?._id])

  const stopTypingIndicator = useCallback(() => {
    if (!conversationId || !user?._id) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    void setTypingStatus({ conversationId, isTyping: false })
    lastTypingRef.current = 0
  }, [conversationId, setTypingStatus, user?._id])

  const unloadVoicePreviewSound = useCallback(async () => {
    const sound = voicePreviewSoundRef.current
    voicePreviewSoundRef.current = null
    if (sound) {
      try {
        await sound.unloadAsync()
      } catch {
        // Ignore unload errors.
      }
    }
    setIsPlayingVoiceDraft(false)
    setVoicePreviewPositionMs(0)
  }, [])

  const clearRecordingPolling = useCallback(() => {
    if (!recordingPollRef.current) return
    clearInterval(recordingPollRef.current)
    recordingPollRef.current = null
  }, [])

  const clearVoiceDraft = useCallback(async () => {
    await unloadVoicePreviewSound()
    setVoiceDraft(null)
  }, [unloadVoicePreviewSound])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (conversationId && user?._id && lastTypingRef.current > 0) {
        void setTypingStatus({ conversationId, isTyping: false })
      }
      clearRecordingPolling()
      const recording = recordingRef.current
      if (recording) {
        void recording.stopAndUnloadAsync().catch(() => null)
      }
      void unloadVoicePreviewSound()
    }
  }, [
    clearRecordingPolling,
    conversationId,
    setTypingStatus,
    unloadVoicePreviewSound,
    user?._id,
  ])

  const handleTyping = useCallback(
    (text: string) => {
      setDraft(text)

      const activeConversationId = conversationId
      const currentUserId = user?._id
      if (!activeConversationId || !currentUserId) return

      const now = Date.now()
      if (now - lastTypingRef.current > 2000) {
        lastTypingRef.current = now
        void setTypingStatus({
          conversationId: activeConversationId,
          isTyping: true,
        })
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        void setTypingStatus({
          conversationId: activeConversationId,
          isTyping: false,
        })
        lastTypingRef.current = 0
      }, 3000)
    },
    [conversationId, setTypingStatus, user?._id],
  )

  const startRecording = useCallback(async () => {
    if (
      !conversationId ||
      !user?._id ||
      isRecording ||
      isSending ||
      draft.trim()
    ) {
      return
    }

    try {
      const permission = await Audio.requestPermissionsAsync()
      if (!permission.granted) {
        Alert.alert(
          'Microphone permission needed',
          'Enable microphone access to send voice messages.',
        )
        return
      }

      await clearVoiceDraft()
      await setRecordingAudioMode()

      const recording = new Audio.Recording()
      await recording.prepareToRecordAsync(RECORDING_OPTIONS)
      await recording.startAsync()

      recordingRef.current = recording
      recordingStartRef.current = Date.now()
      meteringValuesRef.current = []
      setRecordingDurationMs(0)
      setRecordingWaveform(createSeededWaveform('recording-live'))
      setIsRecording(true)

      if (
        stopRecordingWhenReadyRef.current ||
        !isRecordButtonPressedRef.current
      ) {
        stopRecordingWhenReadyRef.current = false
        void stopRecordingRef.current?.()
      }

      clearRecordingPolling()
      recordingPollRef.current = setInterval(() => {
        const activeRecording = recordingRef.current
        if (!activeRecording) return

        void activeRecording.getStatusAsync().then((recordingStatus) => {
          if (!recordingStatus.isRecording) return
          setRecordingDurationMs(recordingStatus.durationMillis)

          if (typeof recordingStatus.metering === 'number') {
            const normalized = normalizeMeteringValue(recordingStatus.metering)
            const nextValues = [...meteringValuesRef.current, normalized].slice(
              -RECORDING_BAR_LIMIT,
            )
            meteringValuesRef.current = nextValues
            setRecordingWaveform([...nextValues])
          }
        })
      }, 120)
    } catch {
      setIsRecording(false)
      recordingRef.current = null
      clearRecordingPolling()
      stopRecordingWhenReadyRef.current = false
      Alert.alert('Recording error', 'Unable to start recording right now.')
    }
  }, [
    clearRecordingPolling,
    clearVoiceDraft,
    conversationId,
    draft,
    isRecording,
    isSending,
    user?._id,
  ])

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current
    if (!recording) return

    isRecordButtonPressedRef.current = false
    stopRecordingWhenReadyRef.current = false
    recordingRef.current = null
    clearRecordingPolling()
    setIsRecording(false)

    let uri: string | null = null
    let durationMs = 0

    try {
      const statusBeforeStop = await recording.getStatusAsync()
      await recording.stopAndUnloadAsync()
      uri = recording.getURI()
      const statusAfterStop = await recording.getStatusAsync()
      durationMs = Math.max(
        statusAfterStop.durationMillis,
        statusBeforeStop.durationMillis,
        Date.now() - recordingStartRef.current,
      )
    } catch {
      uri = null
      durationMs = 0
    } finally {
      await setPlaybackAudioMode()
      setRecordingDurationMs(0)
      setRecordingWaveform(createSeededWaveform('recording-idle'))
    }

    if (!uri || durationMs < MIN_RECORDING_DURATION_MS) {
      meteringValuesRef.current = []
      return
    }

    const waveformSource =
      meteringValuesRef.current.length > 0
        ? meteringValuesRef.current
        : createSeededWaveform(uri)

    setVoiceDraft({
      uri,
      durationMs,
      waveform: normalizeWaveform(waveformSource),
    })
    setVoicePreviewPositionMs(0)
    setIsPlayingVoiceDraft(false)
    meteringValuesRef.current = []
  }, [clearRecordingPolling])

  useEffect(() => {
    stopRecordingRef.current = stopRecording
  }, [stopRecording])

  const onVoicePreviewStatus = useCallback(
    (playbackStatus: AVPlaybackStatus) => {
      if (!playbackStatus.isLoaded) {
        setIsPlayingVoiceDraft(false)
        return
      }

      setIsPlayingVoiceDraft(playbackStatus.isPlaying)
      setVoicePreviewPositionMs(playbackStatus.positionMillis)
    },
    [],
  )

  const ensureVoicePreviewSound = useCallback(async () => {
    if (!voiceDraft) return null
    if (voicePreviewSoundRef.current) return voicePreviewSoundRef.current

    await setPlaybackAudioMode()
    const { sound } = await Audio.Sound.createAsync(
      { uri: voiceDraft.uri },
      { shouldPlay: false, progressUpdateIntervalMillis: 90 },
      onVoicePreviewStatus,
    )

    voicePreviewSoundRef.current = sound
    return sound
  }, [onVoicePreviewStatus, voiceDraft])

  const toggleVoicePreviewPlayback = useCallback(async () => {
    const sound = await ensureVoicePreviewSound()
    if (!sound) return

    const previewStatus = await sound.getStatusAsync()
    if (!previewStatus.isLoaded) return

    if (previewStatus.isPlaying) {
      await sound.pauseAsync()
      return
    }

    if (
      previewStatus.didJustFinish ||
      (previewStatus.durationMillis &&
        previewStatus.positionMillis >= previewStatus.durationMillis - 120)
    ) {
      await sound.setPositionAsync(0)
      setVoicePreviewPositionMs(0)
    }

    await sound.playAsync()
  }, [ensureVoicePreviewSound])

  const seekVoicePreview = useCallback(
    async (progress: number) => {
      const sound = await ensureVoicePreviewSound()
      if (!sound || !voiceDraft) return

      const nextPosition = Math.round(voiceDraft.durationMs * progress)
      await sound.setPositionAsync(nextPosition)
      setVoicePreviewPositionMs(nextPosition)
    },
    [ensureVoicePreviewSound, voiceDraft],
  )

  const otherParticipantId = conversation?.otherParticipant?._id as
    | Id<'users'>
    | undefined
  const isGroup =
    conversation?.type === 'group' || conversation?.type === 'meetup'
  const isUltra =
    !!user &&
    (((user.subscriptionTier === 'ultra' || user.subscriptionTier === 'pro') &&
      user.subscriptionStatus === 'active') ||
      (user.referralUltraExpiresAt ?? 0) > Date.now())

  const handleSend = async () => {
    if (!conversationId || !user?._id || isRecording) return

    const content = draft.trim()
    if (!content && !voiceDraft && !imageDraft) return

    stopTypingIndicator()

    try {
      setIsSending(true)

      if (voiceDraft) {
        const fileResponse = await fetch(voiceDraft.uri)
        const audioBlob = await fileResponse.blob()
        const typedBlob =
          audioBlob.type && audioBlob.type !== 'application/octet-stream'
            ? audioBlob
            : new Blob([audioBlob], { type: 'audio/mp4' })
        const { key, url } = await upload(typedBlob, 'voice')

        await sendMessage({
          conversationId,
          content: content || 'Voice message',
          format: 'voice',
          r2Key: key,
          r2Url: url,
          voiceDuration: Math.max(1, Math.round(voiceDraft.durationMs / 1000)),
          isEphemeral: isEphemeral || undefined,
          isInvisibleInk: isInvisibleInk || undefined,
          replyToMessageId: replyingTo?.messageId,
        })

        await clearVoiceDraft()
        setReplyingTo(null)
        setDraft('')
        return
      }

      if (imageDraft) {
        const fileResponse = await fetch(imageDraft.uri)
        const imageBlob = await fileResponse.blob()
        const typedBlob =
          imageBlob.type && imageBlob.type !== 'application/octet-stream'
            ? imageBlob
            : new Blob([imageBlob], {
                type: imageDraft.mimeType ?? 'image/jpeg',
              })
        const { key, url } = await upload(typedBlob, 'messages')

        await sendMessage({
          conversationId,
          content: content || 'Photo',
          format: 'image',
          r2Key: key,
          r2Url: url,
          isEphemeral: isEphemeral || undefined,
          isInvisibleInk: isInvisibleInk || undefined,
          replyToMessageId: replyingTo?.messageId,
        })

        setImageDraft(null)
        setReplyingTo(null)
        setDraft('')
        return
      }

      // Text path is optimistic — show the message instantly, send in the background.
      setIsSending(false)
      const ephemeralFlag = isEphemeral || undefined
      const invisibleInkFlag = isInvisibleInk || undefined
      const replyToMessageId = replyingTo?.messageId
      const optimisticKey = createOptimisticKey('chat')
      const pendingMessage: PendingTextMessage = {
        _id: optimisticKey as unknown as Id<'messages'>,
        optimisticKey,
        optimisticStatus: 'sending',
        conversationId,
        senderId: user._id,
        sender: {
          _id: user._id,
          name: user.name,
          imageUrl: user.imageUrl,
        },
        content,
        format: 'text',
        sentAt: Date.now(),
        ...(ephemeralFlag ? { isEphemeral: true } : {}),
        ...(invisibleInkFlag ? { isInvisibleInk: true } : {}),
        ...(replyToMessageId ? { replyToMessageId } : {}),
      }
      addPendingMessage(pendingMessage)
      setReplyingTo(null)
      setDraft('')

      void (async () => {
        try {
          const messageId = await sendMessage({
            conversationId,
            content,
            format: 'text',
            isEphemeral: ephemeralFlag,
            isInvisibleInk: invisibleInkFlag,
            replyToMessageId,
          })
          markPendingMessageResolved(optimisticKey, {
            optimisticStatus: 'sent',
            resolvedMessageId: messageId,
          })
        } catch {
          removePendingMessage(optimisticKey)
          Alert.alert('Send failed', 'Unable to send your message right now.')
        }
      })()
      return
    } catch {
      Alert.alert('Send failed', 'Unable to send your message right now.')
    } finally {
      setIsSending(false)
    }
  }

  const handlePickImage = async () => {
    if (isComposerBusy || isRecording || voiceDraft) return

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Enable photo library access to send images.',
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.88,
      allowsMultipleSelection: false,
    })

    if (!result.canceled && result.assets[0]) {
      setImageDraft(result.assets[0])
    }
  }

  const handleShareLocation = async () => {
    if (!conversationId || !user?._id || isComposerBusy || isRecording) return

    let currentLocation = location
    if (!currentLocation) {
      const granted = await requestPermission()
      if (!granted) {
        Alert.alert(
          'Location access needed',
          'Enable location access to share your location.',
        )
        return
      }
      const resolvedLocation = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      })
      currentLocation = {
        latitude: resolvedLocation.coords.latitude,
        longitude: resolvedLocation.coords.longitude,
      }
    }

    if (!currentLocation) {
      Alert.alert('Location unavailable', 'Try again after location resolves.')
      return
    }

    try {
      setIsSending(true)
      await sendMessage({
        conversationId,
        content: JSON.stringify({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          locationName: 'Shared Location',
          address: `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`,
          isExact: true,
        }),
        format: 'location',
        isEphemeral: isEphemeral || undefined,
        isInvisibleInk: isInvisibleInk || undefined,
        replyToMessageId: replyingTo?.messageId,
      })
      setReplyingTo(null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not share location'
      Alert.alert('Location failed', message)
    } finally {
      setIsSending(false)
    }
  }

  const handleSendGif = async (gifUrl: string) => {
    if (!conversationId || !user?._id || isComposerBusy || isRecording) return

    try {
      setIsSending(true)
      await sendMessage({
        conversationId,
        content: gifUrl,
        format: 'gif',
        isEphemeral: isEphemeral || undefined,
        isInvisibleInk: isInvisibleInk || undefined,
        replyToMessageId: replyingTo?.messageId,
      })
      setReplyingTo(null)
      setShowGifPicker(false)
      setGifSearch('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not send GIF'
      Alert.alert('GIF failed', message)
    } finally {
      setIsSending(false)
    }
  }

  const handleShareSpot = async (spot: {
    _id: Id<'spots'>
    name: string
    category: string
    address: string
    city?: string
  }) => {
    if (!conversationId || !user?._id || isComposerBusy || isRecording) return

    try {
      setIsSending(true)
      await sendMessage({
        conversationId,
        content: JSON.stringify({
          spotId: spot._id,
          name: spot.name,
          category: spot.category,
          address: spot.address,
          city: spot.city,
        }),
        format: 'spot_share',
        isEphemeral: isEphemeral || undefined,
        isInvisibleInk: isInvisibleInk || undefined,
      })
      setShowSharePicker(false)
      setShareSearch('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not share spot'
      Alert.alert('Share failed', message)
    } finally {
      setIsSending(false)
    }
  }

  const handleShareMember = async (member: ShareMember) => {
    if (!conversationId || !user?._id || isComposerBusy || isRecording) return

    const displayName = member.profile?.displayName ?? member.name
    const photoUrl =
      member.profile?.profilePhotoUrl ??
      member.profile?.profilePhotoUrls?.[0] ??
      member.imageUrl

    try {
      setIsSending(true)
      await sendMessage({
        conversationId,
        content: JSON.stringify({
          userId: member._id,
          displayName,
          photoUrl,
          age: member.profile?.age,
          distanceMiles: member.distanceMiles,
          statusEmoji: member.customStatusEmoji,
          statusLabel: member.customStatusText,
        }),
        format: 'member_share',
        isEphemeral: isEphemeral || undefined,
        isInvisibleInk: isInvisibleInk || undefined,
      })
      setShowSharePicker(false)
      setShareSearch('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not share member'
      Alert.alert('Share failed', message)
    } finally {
      setIsSending(false)
    }
  }

  const handleShareAlbum = async (album: ShareAlbum) => {
    if (
      !conversationId ||
      !user?._id ||
      !otherParticipantId ||
      isComposerBusy ||
      isRecording
    ) {
      return
    }

    try {
      setIsSending(true)
      await shareAlbum({
        albumId: album._id,
        ownerUserId: user._id,
        grantedUserId: otherParticipantId,
        conversationId,
      })
      await sendMessage({
        conversationId,
        content: JSON.stringify({
          albumId: album._id,
          albumName: album.name,
        }),
        format: 'album_share',
        isEphemeral: isEphemeral || undefined,
        isInvisibleInk: isInvisibleInk || undefined,
      })
      setShowSharePicker(false)
      setShareSearch('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not share album'
      Alert.alert('Share failed', message)
    } finally {
      setIsSending(false)
    }
  }

  const handleToggleSendOption = (option: 'ephemeral' | 'invisibleInk') => {
    if (!isUltra) {
      Alert.alert(
        'Pro or Ultra required',
        'Open Subscription from Settings to unlock disappearing messages and invisible ink.',
      )
      return
    }

    if (option === 'ephemeral') {
      setIsEphemeral((current) => !current)
    } else {
      setIsInvisibleInk((current) => !current)
    }
  }

  const handleSmartReply = async (suggestion: SmartReplySuggestion) => {
    if (!conversationId || !latestIncomingMessage?._id) return

    try {
      const usage = await incrementSmartReplyUsage({ conversationId })
      if (!usage.success) {
        Alert.alert(
          'Smart replies used',
          'Open Subscription from Settings for unlimited smart replies.',
        )
        return
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not use smart reply'
      Alert.alert('Smart reply failed', message)
      return
    }

    setSmartRepliesDismissedFor(latestIncomingMessage._id)

    switch (suggestion.type) {
      case 'text':
        setDraft(suggestion.content)
        return
      case 'take_photo':
        await handlePickImage()
        return
      case 'location':
        await handleShareLocation()
        return
      case 'unlock_album':
        router.push('/(tabs)/photos' as never)
        return
    }
  }

  const handleBlockConversationUser = () => {
    if (!user?._id || !otherParticipantId) return
    Alert.alert(
      'Block this user?',
      'They will no longer be able to find or message you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            blockUser({ blockedId: otherParticipantId })
              .then(() => router.replace('/(tabs)/messages' as never))
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

  const handleReportConversationUser = () => {
    if (!user?._id || !otherParticipantId) return
    Alert.alert('Report this user', 'Choose the closest reason.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Harassment',
        onPress: () =>
          void submitConversationUserReport({
            reporterId: user._id,
            reportedId: otherParticipantId,
            reason: 'harassment',
          }),
      },
      {
        text: 'Spam or scam',
        onPress: () =>
          void submitConversationUserReport({
            reporterId: user._id,
            reportedId: otherParticipantId,
            reason: 'scam',
          }),
      },
      {
        text: 'Underage',
        onPress: () =>
          void submitConversationUserReport({
            reporterId: user._id,
            reportedId: otherParticipantId,
            reason: 'underage',
          }),
      },
    ])
  }

  const submitConversationUserReport = async (args: {
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

  const openConversationOnWeb = useCallback(() => {
    if (!conversationId) return
    const encodedConversationId = encodeURIComponent(conversationId)
    void Linking.openURL(
      `${WEB_MESSAGES_URL}?conversation=${encodedConversationId}`,
    )
  }, [conversationId])

  const [callRoomToken, setCallRoomToken] = useState<{
    sessionId: Id<'callSessions'>
    token: string
    url: string
    callType: 'audio' | 'video'
  } | null>(null)
  const [isFetchingCallToken, setIsFetchingCallToken] = useState(false)
  const lastTokenSessionIdRef = useRef<Id<'callSessions'> | null>(null)

  const handleStartCall = useCallback(
    async (type: 'audio' | 'video') => {
      if (!conversationId) return

      if (callCredits && callCredits.remainingSec <= 0) {
        Alert.alert(
          'Call minutes exhausted',
          'Open Subscription to compare plans or manage call minute packs.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Subscription',
              onPress: () => router.push('/subscription' as never),
            },
          ],
        )
        return
      }

      try {
        const callSessionId = await startCall({ conversationId, type })
        if (user?._id) {
          setOptimisticOutgoingCall({
            _id: callSessionId,
            conversationId,
            initiatorId: user._id,
            status: 'ringing',
            type,
          })
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to start call'
        if (message.toLowerCase().includes('call minutes exhausted')) {
          Alert.alert(
            'Call minutes exhausted',
            'Open Subscription to compare plans or manage call minute packs.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Subscription',
                onPress: () => router.push('/subscription' as never),
              },
            ],
          )
          return
        }
        Alert.alert('Call failed', message)
      }
    },
    [callCredits, conversationId, router, startCall, user?._id],
  )

  const handleAnswerActiveCall = useCallback(async () => {
    if (!activeCall) return

    try {
      await answerCall({ callSessionId: activeCall._id })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to answer call'
      Alert.alert('Call failed', message)
    }
  }, [activeCall, answerCall])

  const handleDeclineActiveCall = useCallback(async () => {
    if (!activeCall) return
    try {
      await declineCall({ callSessionId: activeCall._id })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to decline call'
      Alert.alert('Call failed', message)
    }
  }, [activeCall, declineCall])

  const handleEndActiveCall = useCallback(async () => {
    const callToEnd = activeCall ?? optimisticOutgoingCall
    if (!callToEnd || !user?._id) return

    try {
      if (callToEnd.status === 'ringing') {
        if (callToEnd.initiatorId === user._id) {
          await endCall({ callSessionId: callToEnd._id })
        } else {
          await declineCall({ callSessionId: callToEnd._id })
        }
        return
      }

      await leaveCall({ callSessionId: callToEnd._id })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to end call'
      Alert.alert('Call failed', message)
    } finally {
      setCallRoomToken(null)
      setOptimisticOutgoingCall(null)
      lastTokenSessionIdRef.current = callToEnd._id
    }
  }, [
    activeCall,
    declineCall,
    endCall,
    leaveCall,
    optimisticOutgoingCall,
    user?._id,
  ])

  useEffect(() => {
    if (!optimisticOutgoingCall) return
    if (activeCall?._id === optimisticOutgoingCall._id) {
      setOptimisticOutgoingCall(null)
    }
  }, [activeCall?._id, optimisticOutgoingCall])

  // When a call in this conversation becomes active, mint a LiveKit token and
  // open the in-app call modal. Clear it when the call is no longer active.
  useEffect(() => {
    const isActiveHere =
      !!activeCall &&
      activeCall.conversationId === conversationId &&
      activeCall.status === 'active'

    if (!isActiveHere) {
      if (callRoomToken) setCallRoomToken(null)
      lastTokenSessionIdRef.current = null
      return
    }

    if (lastTokenSessionIdRef.current === activeCall._id) return
    lastTokenSessionIdRef.current = activeCall._id

    let cancelled = false
    setIsFetchingCallToken(true)
    void (async () => {
      try {
        const result = await mintCallToken({ callSessionId: activeCall._id })
        if (cancelled) return
        setCallRoomToken({
          sessionId: activeCall._id,
          token: result.token,
          url: result.url,
          callType: result.callType,
        })
      } catch (error) {
        if (cancelled) return
        const message =
          error instanceof Error ? error.message : 'Unable to join call'
        Alert.alert('Call failed', message)
        lastTokenSessionIdRef.current = null
      } finally {
        if (!cancelled) setIsFetchingCallToken(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeCall, callRoomToken, conversationId, mintCallToken])

  const handleRoomConnected = useCallback(async () => {
    if (!callRoomToken) return

    try {
      await markParticipantConnected({
        callSessionId: callRoomToken.sessionId,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to join call'
      Alert.alert('Call failed', message)
      setCallRoomToken(null)
      lastTokenSessionIdRef.current = null
    }
  }, [callRoomToken, markParticipantConnected])

  const handleRoomDisconnected = useCallback(
    async (reason?: string) => {
      if (!callRoomToken || !activeCall) return

      if (reason === 'DUPLICATE_IDENTITY') {
        setCallRoomToken(null)
        lastTokenSessionIdRef.current = callRoomToken.sessionId
        Alert.alert(
          'Call active elsewhere',
          'This call is active on another device.',
        )
        return
      }

      setCallRoomToken(null)
      lastTokenSessionIdRef.current = null

      try {
        await leaveCall({ callSessionId: callRoomToken.sessionId })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to leave call'
        Alert.alert('Call failed', message)
      }
    },
    [activeCall, callRoomToken, leaveCall],
  )

  const handleMessageReaction = async (
    messageId: Id<'messages'>,
    reactions: Array<MessageReaction> | undefined,
    emoji: string,
  ) => {
    if (!user?._id) return

    const hasReacted = reactions?.some(
      (reaction) => reaction.userId === user._id && reaction.emoji === emoji,
    )

    try {
      if (hasReacted) {
        await removeReaction({ messageId, emoji })
      } else {
        await addReaction({ messageId, emoji })
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not update reaction'
      Alert.alert('Reaction failed', message)
    }
  }

  const handleSaveEditedMessage = async () => {
    if (!editingMessageId || !user?._id || !editDraft.trim()) return

    try {
      setIsEditSaving(true)
      await editMessage({
        messageId: editingMessageId,
        content: editDraft.trim(),
      })
      setEditingMessageId(null)
      setEditDraft('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not edit message'
      Alert.alert('Edit failed', message)
    } finally {
      setIsEditSaving(false)
    }
  }

  const handleDeleteMessage = (messageId: Id<'messages'>) => {
    if (!user?._id) return
    Alert.alert(
      'Delete message?',
      'This removes the message from the thread.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMessage({ messageId }).catch((error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : 'Could not delete message'
              Alert.alert('Delete failed', message)
            })
          },
        },
      ],
    )
  }

  const handleReportMessage = (messageId: Id<'messages'>) => {
    if (!user?._id) return
    Alert.alert('Report message', 'Choose the closest reason.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Harassment',
        onPress: () => void submitMessageReport(messageId, 'harassment'),
      },
      {
        text: 'Spam',
        onPress: () => void submitMessageReport(messageId, 'spam'),
      },
      {
        text: 'Scam',
        onPress: () => void submitMessageReport(messageId, 'scam'),
      },
      {
        text: 'Underage',
        onPress: () => void submitMessageReport(messageId, 'underage'),
      },
    ])
  }

  const submitMessageReport = async (
    messageId: Id<'messages'>,
    reason: 'harassment' | 'spam' | 'scam' | 'underage',
  ) => {
    if (!user?._id) return
    try {
      await reportMessage({ messageId, reason })
      Alert.alert('Report submitted', 'Thanks. Our team will review it.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not report message'
      Alert.alert('Report failed', message)
    }
  }

  // Group messages by date — server results plus any in-flight optimistic ones.
  type Message = (typeof results)[number]
  type PendingTextMessage = {
    _id: Id<'messages'>
    optimisticKey: string
    optimisticStatus: 'sending' | 'sent'
    resolvedMessageId?: Id<'messages'>
    conversationId: Id<'conversations'>
    senderId: Id<'users'>
    sender: { _id: Id<'users'>; name: string; imageUrl?: string }
    content: string
    format: 'text'
    sentAt: number
    isEphemeral?: boolean
    isInvisibleInk?: boolean
    replyToMessageId?: Id<'messages'>
  }
  type RenderableMessage = Message | PendingTextMessage

  const {
    pendingItems: pendingMessages,
    addPendingItem: addPendingMessage,
    markPendingItemResolved: markPendingMessageResolved,
    removePendingItem: removePendingMessage,
    reconcilePendingItems: reconcilePendingMessages,
    clearPendingItems: clearPendingMessages,
  } = useOptimisticThreadMessages<PendingTextMessage>({
    resetKey: conversationId,
  })

  useEffect(() => {
    clearPendingMessages()
  }, [conversationId, clearPendingMessages])

  const serverMessageIds = useMemo(
    () => new Set(results.map((message) => String(message._id))),
    [results],
  )

  useEffect(() => {
    reconcilePendingMessages(serverMessageIds, {
      getResolvedId: (message) =>
        message.resolvedMessageId
          ? String(message.resolvedMessageId)
          : undefined,
    })
  }, [reconcilePendingMessages, serverMessageIds])

  const messageGroups = useMemo(() => {
    const groupedByDate = new Map<string, Array<RenderableMessage>>()
    const combined: Array<RenderableMessage> = [...pendingMessages, ...results]

    for (const message of combined) {
      const date = new Date(message.sentAt).toDateString()
      const existing = groupedByDate.get(date) ?? []
      existing.push(message)
      groupedByDate.set(date, existing)
    }

    return Array.from(groupedByDate.entries())
      .map(([date, messages]) => ({
        date,
        messages: [...messages].reverse(),
      }))
      .reverse()
  }, [pendingMessages, results])

  const handleAttachmentAction = (action: AttachmentAction) => {
    setShowAttachmentMenu(false)
    switch (action) {
      case 'photo':
        void handlePickImage()
        return
      case 'gif':
        setShowGifPicker(true)
        return
      case 'voice':
        Alert.alert(
          'Record a voice message',
          'Press and hold the microphone button to record.',
        )
        return
      case 'location':
        void handleShareLocation()
        return
      case 'distance':
        Alert.alert(
          'Send distance request?',
          'This asks both of you to share location privately so Civic Research Hub can calculate distance without showing exact locations.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send',
              onPress: () => {
                void handleMeetupDistanceCreate()
              },
            },
          ],
        )
        return
      case 'album':
        setShareMode('album')
        setShowSharePicker(true)
        return
      case 'spot':
        setShareMode('spot')
        setShowSharePicker(true)
        return
      case 'member':
        setShareMode('member')
        setShowSharePicker(true)
        return
      case 'ephemeral':
        handleToggleSendOption('ephemeral')
        return
      case 'invisibleInk':
        handleToggleSendOption('invisibleInk')
        return
    }
  }

  async function handleMeetupDistanceCreate() {
    if (!conversationId || isComposerBusy || isRecording) return

    try {
      setIsSending(true)
      await createMeetupDistance({ conversationId })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not create distance request'
      Alert.alert('Distance request failed', message)
    } finally {
      setIsSending(false)
    }
  }

  const handleScrollToMessage = useCallback((_messageId: Id<'messages'>) => {
    // Best-effort: ensure latest results contain the message; otherwise no-op.
  }, [])

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
        title="Conversation"
        description="Sign in to read and send messages."
      />
    )
  }

  if (!conversationId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-base font-normal text-muted-foreground">
          Conversation not found.
        </Text>
      </SafeAreaView>
    )
  }

  const renderDateDivider = (date: string) => (
    <View className="my-4 flex-row items-center gap-4 px-4">
      <View className="h-px flex-1 bg-border" />
      <Text className="text-xs font-medium text-muted-foreground">
        {formatDateDivider(new Date(date).getTime())}
      </Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  )

  const renderMessage = (
    message: RenderableMessage,
    index: number,
    dayMessages: Array<RenderableMessage>,
  ) => {
    const isMine = message.senderId === user._id
    const isPending = 'optimisticStatus' in message

    // System message (e.g. call events, group events) — center pill
    if (message.format === 'system') {
      const eventType =
        'systemEventType' in message
          ? (message.systemEventType as string | undefined)
          : undefined
      if (isCallEventType(eventType)) {
        return (
          <CallSystemMessage
            key={message._id}
            eventType={eventType}
            content={message.content}
          />
        )
      }
      return <SystemMessage key={message._id} content={message.content} />
    }

    const showAvatar =
      !isMine &&
      (index === 0 || dayMessages[index - 1]?.senderId !== message.senderId)
    const readAt = 'readAt' in message ? message.readAt : undefined
    const isRead =
      isMine && otherParticipantId && readAt?.[otherParticipantId] !== undefined
    const resolvedVoiceUrl =
      message.format === 'voice'
        ? (('voiceUrl' in message ? message.voiceUrl : undefined) ??
          message.r2Url)
        : undefined
    const resolvedMediaUrl =
      message.format === 'image'
        ? (('mediaUrl' in message ? message.mediaUrl : undefined) ??
          message.r2Url)
        : undefined
    const isVoiceMessage = message.format === 'voice'
    const isImageMessage = message.format === 'image' && resolvedMediaUrl
    const isGifMessage = message.format === 'gif'
    const isLocationMessage = message.format === 'location'
    const isAlbumShareMessage = message.format === 'album_share'
    const isFriendRequestMessage = message.format === 'friend_request'
    const isMeetupDistanceMessage = message.format === 'meetup_distance'
    const isSpotShareMessage = message.format === 'spot_share'
    const isMemberShareMessage = message.format === 'member_share'
    const reactions =
      'reactions' in message
        ? (message.reactions as Array<MessageReaction> | undefined)
        : undefined
    const replyTo =
      'replyTo' in message
        ? (message.replyTo as ReplyTo | null | undefined)
        : null
    const isInvisibleMessage =
      'isInvisibleInk' in message && message.isInvisibleInk === true
    const isEphemeralMessage =
      'isEphemeral' in message && message.isEphemeral === true
    const isHiddenInvisible =
      isInvisibleMessage && !isMine && !revealedMessageIds.has(message._id)

    return (
      <View
        key={message._id}
        className={`flex-row items-end gap-2 px-4 ${isMine ? 'justify-end' : ''}`}
      >
        {!isMine && (
          <View className="w-8">
            {showAvatar && (
              <Avatar
                imageUrl={message.sender.imageUrl}
                name={message.sender.name}
                size="sm"
              />
            )}
          </View>
        )}

        <Pressable
          className={
            isMine
              ? `max-w-[80%] rounded-2xl bg-primary px-3.5 py-2.5${isPending ? ' opacity-70' : ''}`
              : 'max-w-[80%] rounded-2xl border border-border bg-card px-3.5 py-2.5'
          }
          onLongPress={() => {
            if (isPending) return
            setActiveMessage({
              messageId: message._id,
              senderId: message.senderId,
              content: message.content,
              format: message.format,
              reactions,
              sentAt: message.sentAt,
              isOwn: isMine,
            })
          }}
          onPress={() => {
            if (isHiddenInvisible) {
              setRevealedMessageIds((current) => {
                const next = new Set(current)
                next.add(message._id)
                return next
              })
            }
          }}
        >
          {replyTo ? (
            <QuotedMessage
              messageId={replyTo._id}
              senderName={replyTo.senderName}
              content={replyTo.content}
              format={replyTo.format}
              isDeleted={replyTo.isDeleted}
              isOwn={isMine}
              onPress={handleScrollToMessage}
            />
          ) : null}

          {isHiddenInvisible ? (
            <View className="min-w-40 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-5">
              <EyeOff color="#c4b5fd" size={22} />
              <Text className="mt-2 text-sm font-semibold text-violet-200">
                Invisible Ink
              </Text>
              <Text className="mt-1 text-xs text-violet-200/70">
                Tap to reveal
              </Text>
            </View>
          ) : isVoiceMessage ? (
            <VoiceMessageBubble
              voiceUrl={resolvedVoiceUrl}
              duration={message.voiceDuration}
              isOwn={isMine}
            />
          ) : isImageMessage ? (
            <View>
              <ResolvedImage
                uri={resolvedMediaUrl}
                contentFit="cover"
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 14,
                  marginBottom: message.content === 'Photo' ? 0 : 8,
                }}
              />
              {message.content !== 'Photo' ? (
                <Text
                  className={
                    isMine
                      ? 'text-base font-normal text-primary-foreground'
                      : 'text-base font-normal text-foreground'
                  }
                >
                  {message.content}
                </Text>
              ) : null}
            </View>
          ) : isGifMessage ? (
            <ExpoImage
              source={{ uri: message.content }}
              contentFit="cover"
              style={{ width: 220, height: 220, borderRadius: 14 }}
            />
          ) : isLocationMessage ? (
            <LocationMessage content={message.content} isOwn={isMine} />
          ) : isAlbumShareMessage ? (
            <AlbumShareMessage content={message.content} isOwn={isMine} />
          ) : isFriendRequestMessage ? (
            <FriendRequestMessage
              requesterName={message.sender.name}
              isOwn={isMine}
            />
          ) : isMeetupDistanceMessage ? (
            <MeetupDistanceMessage content={message.content} isOwn={isMine} />
          ) : isSpotShareMessage ? (
            <SpotShareMessage content={message.content} />
          ) : isMemberShareMessage ? (
            <MemberShareMessage content={message.content} />
          ) : (
            <Text
              className={
                isMine
                  ? 'text-base font-normal text-primary-foreground'
                  : 'text-base font-normal text-foreground'
              }
            >
              {message.content}
            </Text>
          )}

          <View className="mt-1 flex-row items-center justify-end gap-1">
            {isEphemeralMessage ? (
              <Timer
                size={12}
                color={isMine ? 'rgba(255,255,255,0.72)' : '#f59e0b'}
              />
            ) : null}
            {isInvisibleMessage ? (
              <EyeOff
                size={12}
                color={isMine ? 'rgba(255,255,255,0.72)' : '#a78bfa'}
              />
            ) : null}
            <Text
              className={
                isMine
                  ? 'text-[11px] font-normal text-primary-foreground/70'
                  : 'text-[11px] font-normal text-muted-foreground'
              }
            >
              {isPending
                ? message.optimisticStatus === 'sent'
                  ? 'Sent'
                  : 'Sending…'
                : formatMessageTime(message.sentAt)}
            </Text>
            {isMine && !isPending && isUltra && isRead && (
              <CheckCheck size={14} color="rgba(255,255,255,0.7)" />
            )}
          </View>
          {reactions && reactions.length > 0 ? (
            <MessageReactionPills
              reactions={reactions}
              currentUserId={user._id}
              onPress={(emoji) =>
                void handleMessageReaction(message._id, reactions, emoji)
              }
              alignEnd
            />
          ) : null}
        </Pressable>
      </View>
    )
  }

  const renderEmptyState = () => {
    if (status === 'LoadingFirstPage') {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#F11A23" />
        </View>
      )
    }

    return (
      <View className="flex-1 items-center justify-center px-6">
        <Avatar
          imageUrl={conversation?.otherParticipant?.imageUrl}
          name={conversation?.otherParticipant?.name ?? 'User'}
          size="xl"
        />
        <Text className="mt-4 text-lg font-semibold text-foreground">
          {conversation?.otherParticipant?.name}
        </Text>
        <Text className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
          Start the conversation by sending a message
        </Text>
      </View>
    )
  }

  const typingNames =
    typingUsers?.map((typingUser: { name: string }) => typingUser.name) ?? []
  const hasText = draft.trim().length > 0
  const hasPendingVoice = voiceDraft !== null
  const hasPendingImage = imageDraft !== null
  const showSendButton = hasText || hasPendingVoice || hasPendingImage
  const visibleSmartReplies =
    smartReplyLimit?.canUse === false
      ? []
      : ((smartReplySuggestions ?? []) as Array<SmartReplySuggestion>)
  const isComposerBusy = isSending || isUploadingVoice
  const bottomTabHeight = isKeyboardVisible ? 0 : 48 + insets.bottom
  const composerBottomPadding = 0
  const voicePreviewProgress = voiceDraft
    ? Math.min(voicePreviewPositionMs / Math.max(voiceDraft.durationMs, 1), 1)
    : 0
  const activeConversationCall =
    activeCall && activeCall.conversationId === conversationId
      ? activeCall
      : optimisticOutgoingCall?.conversationId === conversationId
        ? optimisticOutgoingCall
        : null
  const isActiveCallInitiator =
    !!activeConversationCall && activeConversationCall.initiatorId === user._id
  const isIncomingRinging =
    !!activeConversationCall &&
    activeConversationCall.status === 'ringing' &&
    !isActiveCallInitiator &&
    dismissedIncomingCallId !== activeConversationCall._id
  const showCallStatusStrip =
    !!activeConversationCall &&
    !isIncomingRinging &&
    (activeConversationCall.status === 'ringing' || !callRoomToken)
  const shareSpots = shareSpotResults?.spots ?? []
  const shareMembers: Array<ShareMember> =
    deferredShareSearch.trim().length >= 2
      ? ((shareMemberSearchResults ?? []) as Array<ShareMember>)
      : ((shareNearbyMemberResults?.users ?? []) as Array<ShareMember>)
  const albumShareItems = ((shareAlbums ?? []) as Array<ShareAlbum>).filter(
    (album) =>
      album.name
        .toLowerCase()
        .includes(deferredShareSearch.trim().toLowerCase()),
  )
  const listContentContainerStyle = useMemo(
    () => ({
      flexGrow: 1,
      paddingTop: 12,
      paddingBottom: composerHeight + bottomTabHeight + 16,
    }),
    [bottomTabHeight, composerHeight],
  )

  const handleComposerLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const nextHeight = Math.ceil(event.nativeEvent.layout.height)
      setComposerHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      )
    },
    [],
  )

  const headerDisplayName = isGroup
    ? (conversation?.groupName ?? 'Group')
    : (conversation?.otherParticipant?.name ?? 'Conversation')
  const headerImageUrl = isGroup
    ? conversation?.groupAvatarUrl
    : conversation?.otherParticipant?.imageUrl
  const isOtherOnline = conversation?.otherParticipant?.isOnline
  const statusLine = (() => {
    if (isGroup) {
      const count = conversation?.memberCount
      return count ? `${count} members` : null
    }
    if (typingNames.length > 0) return 'Typing…'
    const parts = [isOtherOnline ? 'Online' : 'Offline']
    const distanceText = formatConversationDistance(
      conversation?.otherParticipant?.distance,
    )
    if (distanceText) {
      parts.push(distanceText)
    }
    return parts.join(' · ')
  })()

  const activeMessageIsEditable =
    !!activeMessage &&
    activeMessage.isOwn &&
    isUltra &&
    activeMessage.format === 'text' &&
    Date.now() - activeMessage.sentAt < 15 * 60 * 1000
  const activeMessageReactedEmojis = useMemo(() => {
    if (!activeMessage?.reactions || !user?._id) return new Set<string>()
    return new Set(
      activeMessage.reactions
        .filter((reaction) => reaction.userId === user._id)
        .map((reaction) => reaction.emoji),
    )
  }, [activeMessage, user?._id])

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top', 'left', 'right']}
    >
      <ChatHeader
        displayName={headerDisplayName}
        imageUrl={headerImageUrl}
        isGroup={isGroup}
        isOnline={isOtherOnline}
        statusLine={statusLine}
        isCallActive={!!activeConversationCall}
        hasIncomingCall={isIncomingRinging}
        onBack={() => router.back()}
        onPressTitle={() => {
          if (isGroup) {
            setShowGroupInfo(true)
          } else if (otherParticipantId) {
            router.push(`/user/${otherParticipantId}`)
          }
        }}
        onAudioCall={!isGroup ? () => void handleStartCall('audio') : undefined}
        onVideoCall={!isGroup ? () => void handleStartCall('video') : undefined}
        onOpenMenu={() => setShowHeaderMenu(true)}
        onOpenGroupInfo={isGroup ? () => setShowGroupInfo(true) : undefined}
      />

      {isIncomingRinging && activeConversationCall ? (
        <IncomingCallBanner
          callerName={headerDisplayName}
          callerImageUrl={headerImageUrl ?? null}
          callType={activeConversationCall.type}
          onAnswer={() => void handleAnswerActiveCall()}
          onDecline={() => void handleDeclineActiveCall()}
          onDismiss={() =>
            setDismissedIncomingCallId(activeConversationCall._id)
          }
        />
      ) : null}

      {showCallStatusStrip && activeConversationCall ? (
        <View className="mx-4 mt-2 rounded-2xl border border-primary/30 bg-primary/10 p-3">
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary">
              {activeConversationCall.type === 'video' ? (
                <Video color="#FAFAFA" size={16} />
              ) : (
                <Phone color="#FAFAFA" size={16} />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                {activeConversationCall.status === 'ringing'
                  ? isActiveCallInitiator
                    ? `Calling ${headerDisplayName}`
                    : `Incoming ${activeConversationCall.type} call`
                  : `${activeConversationCall.type === 'video' ? 'Video' : 'Audio'} call in progress`}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {activeConversationCall.status === 'ringing'
                  ? isActiveCallInitiator
                    ? 'Ringing...'
                    : 'Answer to join'
                  : isFetchingCallToken
                    ? 'Joining...'
                    : 'Tap to rejoin'}
              </Text>
            </View>
            {activeConversationCall.status === 'ringing' &&
            !isActiveCallInitiator ? (
              <Pressable
                onPress={() => void handleAnswerActiveCall()}
                className="rounded-full bg-primary px-3 py-1.5"
              >
                <Text className="text-xs font-semibold text-primary-foreground">
                  Answer
                </Text>
              </Pressable>
            ) : null}
            {activeConversationCall.status === 'active' ? (
              <Pressable
                onPress={() => {
                  if (!activeConversationCall) return
                  lastTokenSessionIdRef.current = null
                  setIsFetchingCallToken(true)
                  void (async () => {
                    try {
                      const result = await mintCallToken({
                        callSessionId: activeConversationCall._id,
                      })
                      lastTokenSessionIdRef.current = activeConversationCall._id
                      setCallRoomToken({
                        sessionId: activeConversationCall._id,
                        token: result.token,
                        url: result.url,
                        callType: result.callType,
                      })
                    } catch (error) {
                      const message =
                        error instanceof Error
                          ? error.message
                          : 'Unable to join call'
                      Alert.alert('Call failed', message)
                    } finally {
                      setIsFetchingCallToken(false)
                    }
                  })()
                }}
                className="rounded-full bg-primary px-3 py-1.5"
                disabled={isFetchingCallToken}
              >
                <Text className="text-xs font-semibold text-primary-foreground">
                  {isFetchingCallToken ? 'Joining...' : 'Rejoin'}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => void handleEndActiveCall()}
              className="h-8 w-8 items-center justify-center rounded-full bg-destructive"
            >
              <PhoneOff color="#FFFFFF" size={14} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <CallRoom
        visible={!!callRoomToken}
        token={callRoomToken?.token ?? null}
        serverUrl={callRoomToken?.url ?? null}
        callType={callRoomToken?.callType ?? 'audio'}
        remoteName={headerDisplayName}
        remoteImageUrl={headerImageUrl ?? null}
        isConnecting={isFetchingCallToken}
        onLeave={() => void handleEndActiveCall()}
        onRoomConnected={handleRoomConnected}
        onRoomDisconnected={handleRoomDisconnected}
      />

      <FlatList
        data={messageGroups}
        keyExtractor={(item) => item.date}
        className="flex-1"
        contentContainerStyle={listContentContainerStyle}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {status === 'CanLoadMore' ? (
              <Pressable
                className="mx-4 mb-4 items-center self-center rounded-full bg-card px-4 py-2"
                onPress={() => {
                  loadMore(40)
                }}
              >
                <Text className="text-xs font-semibold text-foreground">
                  Load older messages
                </Text>
              </Pressable>
            ) : null}

            {status === 'LoadingMore' ? (
              <View className="items-center py-4">
                <ActivityIndicator color="#F11A23" />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={renderEmptyState()}
        ListFooterComponent={
          typingNames.length > 0 ? (
            <View className="px-4 pb-3">
              <TypingIndicator names={typingNames} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="pb-3">
            {renderDateDivider(item.date)}
            <View className="gap-1">
              {item.messages.map((message, index) =>
                renderMessage(message, index, item.messages),
              )}
            </View>
          </View>
        )}
      />

      <KeyboardAvoidingView
        className="absolute inset-x-0 bottom-0"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <View
          className="bg-black px-4"
          style={{ paddingBottom: composerBottomPadding }}
          onLayout={handleComposerLayout}
        >
          {visibleSmartReplies.length > 0 ? (
            <View className="mb-3 rounded-2xl border border-primary/20 bg-primary/10 p-3">
              <View className="mb-2 flex-row items-center justify-between gap-3">
                <View className="flex-row items-center gap-2">
                  <Sparkles color="#F11A23" size={16} />
                  <Text className="text-xs font-semibold uppercase text-muted-foreground">
                    Smart Replies
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    if (latestIncomingMessage?._id) {
                      setSmartRepliesDismissedFor(latestIncomingMessage._id)
                    }
                  }}
                >
                  <X color="#999999" size={16} />
                </Pressable>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {visibleSmartReplies.map((suggestion, index) => (
                  <Pressable
                    key={`${suggestion.type}-${suggestion.content}-${index}`}
                    className="rounded-full border border-primary/30 bg-background px-3 py-2"
                    onPress={() => void handleSmartReply(suggestion)}
                  >
                    <Text className="text-sm font-semibold text-foreground">
                      {suggestion.content}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {replyingTo ? (
            <ReplyPreview
              senderName={replyingTo.senderName}
              content={replyingTo.content}
              format={replyingTo.format}
              onCancel={() => setReplyingTo(null)}
            />
          ) : null}

          {isRecording ? (
            <View className="mb-3 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2">
              <View className="mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full bg-red-500" />
                  <Text className="text-xs font-semibold text-foreground">
                    Recording...
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-foreground">
                  {formatDuration(recordingDurationMs / 1000)}
                </Text>
              </View>
              <AudioWaveform
                samples={recordingWaveform}
                progress={1}
                isPlaying
                playedColor="#F11A23"
                unplayedColor="rgba(241,26,35,0.35)"
              />
              <Text className="mt-2 text-xs text-muted-foreground">
                Release the button to preview and send
              </Text>
            </View>
          ) : null}

          {voiceDraft && !isRecording ? (
            <View className="mb-3 rounded-2xl border border-border bg-input px-3 py-2">
              <View className="flex-row items-center gap-3">
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-primary/20"
                  onPress={() => {
                    void toggleVoicePreviewPlayback()
                  }}
                >
                  {isPlayingVoiceDraft ? (
                    <Pause size={16} color="#F11A23" />
                  ) : (
                    <Play size={16} color="#F11A23" />
                  )}
                </Pressable>

                <View className="flex-1">
                  <AudioWaveform
                    samples={voiceDraft.waveform}
                    progress={voicePreviewProgress}
                    isPlaying={isPlayingVoiceDraft}
                    playedColor="#F11A23"
                    unplayedColor="rgba(255,255,255,0.28)"
                    onSeek={(progress) => {
                      void seekVoicePreview(progress)
                    }}
                  />
                  <Text className="mt-1 text-xs font-medium text-muted-foreground">
                    {formatDuration(voicePreviewPositionMs / 1000)} /{' '}
                    {formatDuration(voiceDraft.durationMs / 1000)}
                  </Text>
                </View>

                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-card"
                  onPress={() => {
                    void clearVoiceDraft()
                  }}
                >
                  <Trash2 size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ) : null}

          {imageDraft && !isRecording ? (
            <View className="mb-3 overflow-hidden rounded-2xl border border-border bg-input">
              <ExpoImage
                source={{ uri: imageDraft.uri }}
                contentFit="cover"
                style={{ width: '100%', height: 180 }}
              />
              <Pressable
                className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-background/80"
                onPress={() => setImageDraft(null)}
              >
                <X size={18} color="#FAFAFA" />
              </Pressable>
            </View>
          ) : null}

          {(isEphemeral || isInvisibleInk) && !isRecording ? (
            <View className="mb-3 flex-row flex-wrap gap-2">
              {isEphemeral ? (
                <Pressable
                  className="flex-row items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1"
                  onPress={() => setIsEphemeral(false)}
                >
                  <Timer size={13} color="#f59e0b" />
                  <Text className="text-xs font-semibold text-amber-400">
                    Disappearing
                  </Text>
                </Pressable>
              ) : null}
              {isInvisibleInk ? (
                <Pressable
                  className="flex-row items-center gap-1 rounded-full bg-violet-500/15 px-3 py-1"
                  onPress={() => setIsInvisibleInk(false)}
                >
                  <EyeOff size={13} color="#a78bfa" />
                  <Text className="text-xs font-semibold text-violet-300">
                    Invisible Ink
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <MessageComposer
            value={draft}
            onChangeText={handleTyping}
            onSend={() => void handleSend()}
            placeholder="Message"
            canSubmit={showSendButton}
            disabled={isComposerBusy || isRecording}
            onPressLeadingControl={() => setShowAttachmentMenu(true)}
            horizontalPadding={0}
            topPadding={8}
            bottomPadding={10}
            renderTrailingControl={() => (
              <Pressable
                className="h-10 w-10 items-center justify-center"
                disabled={isComposerBusy}
                onPress={() => {
                  if (showSendButton) {
                    void handleSend()
                  }
                }}
                onPressIn={() => {
                  if (!showSendButton && !isRecording && !isComposerBusy) {
                    isRecordButtonPressedRef.current = true
                    stopRecordingWhenReadyRef.current = false
                    void startRecording()
                  }
                }}
                onPressOut={() => {
                  if (!showSendButton) {
                    isRecordButtonPressedRef.current = false
                    if (isRecording) {
                      void stopRecording()
                    } else {
                      stopRecordingWhenReadyRef.current = true
                    }
                  }
                }}
              >
                {isComposerBusy ? (
                  <ActivityIndicator color="#F11A23" />
                ) : showSendButton ? (
                  <Send size={20} color="#F11A23" />
                ) : isRecording ? (
                  <AudioLines size={26} color="#ef4444" />
                ) : (
                  <AudioLines size={26} color="#FAFAFA" />
                )}
              </Pressable>
            )}
          />
        </View>
        {isKeyboardVisible ? null : (
          <View style={{ height: bottomTabHeight }} />
        )}
      </KeyboardAvoidingView>

      <MessageActionsSheet
        visible={!!activeMessage}
        onClose={() => setActiveMessage(null)}
        onSelectEmoji={(emoji) => {
          if (!activeMessage) return
          void handleMessageReaction(
            activeMessage.messageId,
            activeMessage.reactions,
            emoji,
          )
        }}
        reactedEmojis={activeMessageReactedEmojis}
        context={{
          canReply:
            !!activeMessage &&
            activeMessage.format !== 'system' &&
            activeMessage.format !== 'friend_request',
          canCopy: false,
          canEdit: activeMessageIsEditable,
          canDelete: !!activeMessage && activeMessage.isOwn,
          canReport: !!activeMessage && !activeMessage.isOwn,
        }}
        onReply={() => {
          if (!activeMessage) return
          const sender = results.find(
            (m) => m._id === activeMessage.messageId,
          )?.sender
          setReplyingTo({
            messageId: activeMessage.messageId,
            senderName: sender?.name ?? 'them',
            content: activeMessage.content,
            format: activeMessage.format,
          })
        }}
        onCopy={undefined}
        onEdit={() => {
          if (!activeMessage) return
          setEditingMessageId(activeMessage.messageId)
          setEditDraft(activeMessage.content)
        }}
        onDelete={() => {
          if (!activeMessage) return
          handleDeleteMessage(activeMessage.messageId)
        }}
        onReport={() => {
          if (!activeMessage) return
          handleReportMessage(activeMessage.messageId)
        }}
      />

      <HeaderMenuSheet
        visible={showHeaderMenu}
        onClose={() => setShowHeaderMenu(false)}
        isGroup={isGroup}
        onViewProfile={
          otherParticipantId
            ? () => router.push(`/user/${otherParticipantId}`)
            : undefined
        }
        onSearch={() => setShowSearch(true)}
        onOpenOnWeb={openConversationOnWeb}
        onReport={!isGroup ? handleReportConversationUser : undefined}
        onBlock={!isGroup ? handleBlockConversationUser : undefined}
        onGroupInfo={isGroup ? () => setShowGroupInfo(true) : undefined}
        onLeaveGroup={
          isGroup
            ? () => {
                Alert.alert(
                  'Leave group?',
                  'You will stop receiving messages.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Leave',
                      style: 'destructive',
                      onPress: () => {
                        setShowGroupInfo(false)
                        router.replace('/(tabs)/messages' as never)
                      },
                    },
                  ],
                )
              }
            : undefined
        }
      />

      {isGroup ? (
        <GroupInfoSheet
          visible={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          conversationId={conversationId}
          currentUserId={user._id}
          onLeft={() => router.replace('/(tabs)/messages' as never)}
        />
      ) : null}

      <AttachmentMenu
        visible={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onSelect={handleAttachmentAction}
        disableVoice={false}
        hideAlbum={isGroup}
        hideDistance={isGroup}
        isEphemeral={isEphemeral}
        isInvisibleInk={isInvisibleInk}
      />

      <Modal
        animationType="slide"
        transparent
        visible={editingMessageId !== null}
        onRequestClose={() => {
          setEditingMessageId(null)
          setEditDraft('')
        }}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl border border-border bg-card p-5">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-lg font-bold text-foreground">
                Edit Message
              </Text>
              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full bg-background"
                onPress={() => {
                  setEditingMessageId(null)
                  setEditDraft('')
                }}
              >
                <X color="#FAFAFA" size={20} />
              </Pressable>
            </View>
            <TextInput
              value={editDraft}
              onChangeText={setEditDraft}
              placeholder="Update your message"
              placeholderTextColor="#999999"
              multiline
              autoFocus
              className="mt-4 min-h-28 rounded-2xl border border-border bg-input px-4 py-3 text-base text-foreground"
            />
            <Pressable
              className="mt-4 items-center rounded-2xl bg-primary px-4 py-4"
              disabled={!editDraft.trim() || isEditSaving}
              onPress={() => void handleSaveEditedMessage()}
            >
              {isEditSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-base font-semibold text-primary-foreground">
                  Save Changes
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        visible={showSharePicker}
        onRequestClose={() => setShowSharePicker(false)}
      >
        <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
          <View className="border-b border-border px-4 py-3">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-xl font-bold text-foreground">Share</Text>
              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full bg-card"
                onPress={() => setShowSharePicker(false)}
              >
                <X color="#FAFAFA" size={20} />
              </Pressable>
            </View>
            <View className="mt-3 flex-row rounded-2xl border border-border bg-card p-1">
              {(['spot', 'member', 'album'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  className={`flex-1 rounded-xl px-4 py-2 ${
                    shareMode === mode ? 'bg-primary' : ''
                  }`}
                  onPress={() => {
                    setShareMode(mode)
                    setShareSearch('')
                  }}
                >
                  <Text
                    className={
                      shareMode === mode
                        ? 'text-center text-sm font-semibold text-primary-foreground'
                        : 'text-center text-sm font-semibold text-muted-foreground'
                    }
                  >
                    {mode === 'spot'
                      ? 'Spots'
                      : mode === 'member'
                        ? 'Members'
                        : 'Albums'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={shareSearch}
              onChangeText={setShareSearch}
              placeholder={
                shareMode === 'spot'
                  ? 'Search spots'
                  : shareMode === 'member'
                    ? 'Search members'
                    : 'Search albums'
              }
              placeholderTextColor="#999999"
              className="mt-3 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
            />
          </View>

          {shareMode === 'spot' ? (
            <FlatList
              data={shareSpots}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              ListEmptyComponent={
                shareSpotResults === undefined ? (
                  <View className="mt-8 items-center">
                    <ActivityIndicator color="#F11A23" />
                  </View>
                ) : (
                  <Text className="mt-8 text-center text-sm text-muted-foreground">
                    No spots found.
                  </Text>
                )
              }
              renderItem={({ item }) => (
                <Pressable
                  className="mb-3 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
                  onPress={() => void handleShareSpot(item)}
                >
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-orange-400/15">
                    <MapPin color="#fb923c" size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {item.name}
                    </Text>
                    <Text className="mt-1 text-xs text-muted-foreground">
                      {[
                        item.address,
                        item.city,
                        formatDistance(item.distanceMiles),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          ) : shareMode === 'member' ? (
            <FlatList
              data={shareMembers}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              ListEmptyComponent={
                (deferredShareSearch.trim().length >= 2
                  ? shareMemberSearchResults
                  : shareNearbyMemberResults) === undefined ? (
                  <View className="mt-8 items-center">
                    <ActivityIndicator color="#F11A23" />
                  </View>
                ) : (
                  <Text className="mt-8 text-center text-sm text-muted-foreground">
                    No members found.
                  </Text>
                )
              }
              renderItem={({ item }) => {
                const displayName = item.profile?.displayName ?? item.name
                const photoUrl =
                  item.profile?.profilePhotoUrl ??
                  item.profile?.profilePhotoUrls?.[0] ??
                  item.imageUrl

                return (
                  <Pressable
                    className="mb-3 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
                    onPress={() => void handleShareMember(item)}
                  >
                    <Avatar imageUrl={photoUrl} name={displayName} size="md" />
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {displayName}
                      </Text>
                      <Text className="mt-1 text-xs text-muted-foreground">
                        {[
                          item.profile?.age ? `${item.profile.age}` : null,
                          formatDistance(item.distanceMiles),
                          item.isOnline ? 'Online' : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Civic Research Hub member'}
                      </Text>
                    </View>
                  </Pressable>
                )
              }}
            />
          ) : (
            <FlatList
              data={albumShareItems}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              ListEmptyComponent={
                shareAlbums === undefined ? (
                  <View className="mt-8 items-center">
                    <ActivityIndicator color="#F11A23" />
                  </View>
                ) : otherParticipantId ? (
                  <Text className="mt-8 text-center text-sm text-muted-foreground">
                    No albums found.
                  </Text>
                ) : (
                  <Text className="mt-8 text-center text-sm text-muted-foreground">
                    Album sharing is available in direct conversations.
                  </Text>
                )
              }
              renderItem={({ item }) => (
                <Pressable
                  className="mb-3 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
                  disabled={!otherParticipantId}
                  onPress={() => void handleShareAlbum(item)}
                >
                  <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-amber-400/15">
                    {item.coverUrl ? (
                      <ResolvedImage
                        uri={item.coverUrl}
                        contentFit="cover"
                        style={{ height: 44, width: 44 }}
                      />
                    ) : (
                      <Album color="#f59e0b" size={20} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {item.name}
                    </Text>
                    <Text className="mt-1 text-xs text-muted-foreground">
                      {item.photoCount ?? 0} photos
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        animationType="slide"
        visible={showGifPicker}
        onRequestClose={() => setShowGifPicker(false)}
      >
        <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
          <View className="border-b border-border px-4 py-3">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-xl font-bold text-foreground">
                GIF Picker
              </Text>
              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full bg-card"
                onPress={() => setShowGifPicker(false)}
              >
                <X color="#FAFAFA" size={20} />
              </Pressable>
            </View>
            <TextInput
              value={gifSearch}
              onChangeText={setGifSearch}
              placeholder="Search GIFs"
              placeholderTextColor="#999999"
              className="mt-3 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
              autoFocus
            />
          </View>

          {!GIPHY_API_KEY ? (
            <View className="flex-1 items-center justify-center px-6">
              <ImageIcon color="#F11A23" size={32} />
              <Text className="mt-4 text-center text-base font-semibold text-foreground">
                GIFs need a GIPHY key
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-muted-foreground">
                Set EXPO_PUBLIC_GIPHY_API_KEY to enable mobile GIF search.
              </Text>
            </View>
          ) : isGifLoading && gifResults.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#F11A23" />
            </View>
          ) : (
            <FlatList
              data={gifResults}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
              columnWrapperStyle={{ gap: 12 }}
              ItemSeparatorComponent={() => <View className="h-12" />}
              ListEmptyComponent={
                <Text className="mt-8 text-center text-sm text-muted-foreground">
                  No GIFs found.
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  className="flex-1 overflow-hidden rounded-2xl border border-border bg-card"
                  onPress={() => void handleSendGif(item.originalUrl)}
                >
                  <ExpoImage
                    source={{ uri: item.previewUrl }}
                    contentFit="cover"
                    style={{ width: '100%', aspectRatio: 1 }}
                  />
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        animationType="slide"
        visible={showSearch}
        onRequestClose={() => setShowSearch(false)}
      >
        <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
          <View className="border-b border-border px-4 py-3">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-xl font-bold text-foreground">
                Search Messages
              </Text>
              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full bg-card"
                onPress={() => setShowSearch(false)}
              >
                <X color="#FAFAFA" size={20} />
              </Pressable>
            </View>
            <TextInput
              value={messageSearch}
              onChangeText={setMessageSearch}
              placeholder="Search this conversation"
              placeholderTextColor="#999999"
              className="mt-3 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
              autoFocus
            />
          </View>

          <FlatList
            data={messageSearchResults ?? []}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            ListEmptyComponent={
              deferredMessageSearch.trim().length < 2 ? (
                <Text className="mt-8 text-center text-sm text-muted-foreground">
                  Type at least two characters.
                </Text>
              ) : messageSearchResults === undefined ? (
                <View className="mt-8 items-center">
                  <ActivityIndicator color="#F11A23" />
                </View>
              ) : (
                <Text className="mt-8 text-center text-sm text-muted-foreground">
                  No matching messages.
                </Text>
              )
            }
            renderItem={({ item }) => (
              <View className="mb-3 rounded-2xl border border-border bg-card p-4">
                <Text className="text-sm font-semibold text-foreground">
                  {item.senderName}
                </Text>
                <Text className="mt-1 text-sm leading-5 text-muted-foreground">
                  {item.content}
                </Text>
                <Text className="mt-2 text-xs text-muted-foreground">
                  {formatMessageTime(item.sentAt)}
                </Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>

      <CreateGroupSheet
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(newConversationId) => {
          router.replace(`/(tabs)/messages/conversations/${newConversationId}`)
        }}
      />
    </SafeAreaView>
  )
}

function LocationMessage({
  content,
  isOwn,
}: {
  content: string
  isOwn: boolean
}) {
  const locationData = (() => {
    try {
      return JSON.parse(content) as {
        latitude?: number
        longitude?: number
        locationName: string
        address?: string
        isExact?: boolean
      }
    } catch {
      return null
    }
  })()

  if (!locationData) {
    return (
      <Text
        className={
          isOwn
            ? 'text-base font-normal text-primary-foreground'
            : 'text-base font-normal text-foreground'
        }
      >
        Location shared
      </Text>
    )
  }

  const hasCoordinates =
    locationData.latitude !== undefined && locationData.longitude !== undefined
  const displayAddress = locationData.address ?? locationData.locationName

  return (
    <View>
      <View className="flex-row items-start gap-2">
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${
            isOwn ? 'bg-primary-foreground/20' : 'bg-primary/15'
          }`}
        >
          <MapPin color={isOwn ? '#FAFAFA' : '#F11A23'} size={18} />
        </View>
        <View className="flex-1">
          <Text
            className={
              isOwn
                ? 'text-sm font-semibold text-primary-foreground'
                : 'text-sm font-semibold text-foreground'
            }
          >
            {locationData.locationName}
          </Text>
          {displayAddress !== locationData.locationName ? (
            <Text
              className={
                isOwn
                  ? 'mt-0.5 text-xs text-primary-foreground/75'
                  : 'mt-0.5 text-xs text-muted-foreground'
              }
            >
              {displayAddress}
            </Text>
          ) : null}
          {hasCoordinates && !locationData.isExact ? (
            <Text
              className={
                isOwn
                  ? 'mt-1 text-xs text-primary-foreground/60'
                  : 'mt-1 text-xs text-muted-foreground'
              }
            >
              Approximate location
            </Text>
          ) : null}
        </View>
      </View>
      <Pressable
        className={`mt-3 items-center rounded-xl px-3 py-2 ${
          isOwn ? 'bg-primary-foreground/15' : 'bg-background'
        }`}
        onPress={() => {
          if (hasCoordinates) {
            void openNativeMapSearch({
              latitude: locationData.latitude!,
              longitude: locationData.longitude!,
              label: locationData.locationName,
            })
            return
          }

          void Linking.openURL(
            `https://maps.apple.com/?q=${encodeURIComponent(displayAddress)}`,
          )
        }}
      >
        <Text
          className={
            isOwn
              ? 'text-xs font-semibold text-primary-foreground'
              : 'text-xs font-semibold text-foreground'
          }
        >
          Open in Maps
        </Text>
      </Pressable>
    </View>
  )
}

function AlbumShareMessage({
  content,
  isOwn,
}: {
  content: string
  isOwn: boolean
}) {
  const albumData = parseJsonContent<{
    albumId?: string
    albumName?: string
    expiresAt?: number
  }>(content)
  const isExpired =
    albumData?.expiresAt !== undefined && Date.now() > albumData.expiresAt

  if (!albumData) {
    return <Text className="text-sm text-foreground">{content}</Text>
  }

  return (
    <View className="min-w-52">
      <View className="flex-row items-start gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-amber-400/15">
          <Album color="#f59e0b" size={18} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">
            {isOwn ? 'You shared an album' : 'Album shared with you'}
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {albumData.albumName ?? 'Private album'}
          </Text>
          {albumData.expiresAt ? (
            <View className="mt-1 flex-row items-center gap-1">
              <Clock color={isExpired ? '#DC2626' : '#999999'} size={12} />
              <Text
                className={
                  isExpired
                    ? 'text-xs text-destructive'
                    : 'text-xs text-muted-foreground'
                }
              >
                {isExpired
                  ? 'Access expired'
                  : `Expires ${new Date(albumData.expiresAt).toLocaleDateString()}`}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {!isOwn && !isExpired ? (
        <Pressable
          className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-background px-3 py-2"
          onPress={() => void Linking.openURL('https://civicresearchhub.org/photos')}
        >
          <ExternalLink color="#FAFAFA" size={14} />
          <Text className="text-xs font-semibold text-foreground">
            Open Photos
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function FriendRequestMessage({
  requesterName,
  isOwn,
}: {
  requesterName: string
  isOwn: boolean
}) {
  return (
    <View className="min-w-52">
      <View className="flex-row items-start gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/15">
          <UserPlus color="#F11A23" size={18} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">
            {isOwn ? 'Friend request sent' : `${requesterName} added you`}
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            Friend status is synced on both profiles.
          </Text>
        </View>
      </View>
    </View>
  )
}

function MeetupDistanceMessage({
  content,
  isOwn,
}: {
  content: string
  isOwn: boolean
}) {
  return (
    <View className="min-w-52">
      <View className="flex-row items-start gap-2">
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${
            isOwn ? 'bg-primary-foreground/20' : 'bg-teal-400/15'
          }`}
        >
          <MapPin color={isOwn ? '#FAFAFA' : '#2dd4bf'} size={18} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">
            Meetup distance request
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {content || 'Shared meetup distance details'}
          </Text>
        </View>
      </View>
    </View>
  )
}

function SpotShareMessage({ content }: { content: string }) {
  const router = useRouter()
  const spotData = parseJsonContent<{
    spotId?: string
    name?: string
    category?: string
    address?: string
    city?: string
  }>(content)

  if (!spotData?.spotId) {
    return (
      <Text className="text-sm font-semibold text-foreground">Spot shared</Text>
    )
  }

  const locationText = [spotData.address, spotData.city]
    .filter(Boolean)
    .join(', ')

  return (
    <View className="min-w-52">
      <View className="flex-row items-start gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-orange-400/15">
          <MapPin color="#fb923c" size={18} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">
            {spotData.name ?? 'Shared spot'}
          </Text>
          {locationText ? (
            <Text className="mt-0.5 text-xs text-muted-foreground">
              {locationText}
            </Text>
          ) : null}
          {spotData.category ? (
            <Text className="mt-0.5 text-xs text-muted-foreground">
              {spotData.category.replaceAll('_', ' ')}
            </Text>
          ) : null}
        </View>
      </View>
      <Pressable
        className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-background px-3 py-2"
        onPress={() =>
          router.push(`/(tabs)/map/spots/${spotData.spotId}` as never)
        }
      >
        <ExternalLink color="#FAFAFA" size={14} />
        <Text className="text-xs font-semibold text-foreground">View Spot</Text>
      </Pressable>
    </View>
  )
}

function MemberShareMessage({ content }: { content: string }) {
  const memberData = parseJsonContent<{
    userId?: string
    displayName?: string
    photoUrl?: string
    age?: number
    distanceMiles?: number
    statusLabel?: string
    statusEmoji?: string
  }>(content)

  if (!memberData?.userId) {
    return (
      <Text className="text-sm font-semibold text-foreground">
        Member shared
      </Text>
    )
  }

  const distanceText =
    memberData.distanceMiles !== undefined
      ? memberData.distanceMiles < 0.5
        ? 'Nearby'
        : memberData.distanceMiles < 1
          ? '< 1 mi'
          : `~${Math.round(memberData.distanceMiles)} mi`
      : null

  return (
    <View className="min-w-52">
      <View className="flex-row items-start gap-2">
        <Avatar
          imageUrl={memberData.photoUrl}
          name={memberData.displayName ?? 'Member'}
          size="sm"
        />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">
            {memberData.displayName ?? 'Shared member'}
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {[memberData.age ? `${memberData.age}` : null, distanceText]
              .filter(Boolean)
              .join(' · ') || 'Civic Research Hub member'}
          </Text>
          {memberData.statusLabel ? (
            <Text className="mt-0.5 text-xs text-muted-foreground">
              {memberData.statusEmoji ? `${memberData.statusEmoji} ` : ''}
              {memberData.statusLabel}
            </Text>
          ) : null}
        </View>
      </View>
      <Pressable
        className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-background px-3 py-2"
        onPress={() =>
          void Linking.openURL(`https://civicresearchhub.org/member/${memberData.userId}`)
        }
      >
        <ExternalLink color="#FAFAFA" size={14} />
        <Text className="text-xs font-semibold text-foreground">
          View Profile
        </Text>
      </Pressable>
    </View>
  )
}

// Re-export to keep imports tidy for downstream users of REACTION_EMOJIS
export { REACTION_EMOJIS }
