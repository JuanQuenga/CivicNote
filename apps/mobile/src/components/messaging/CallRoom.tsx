import { useEffect, useMemo, useState } from 'react'
import Constants from 'expo-constants'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Mic,
  MicOff,
  PhoneOff,
  SwitchCamera,
  Video as VideoIcon,
  VideoOff,
} from 'lucide-react-native'
import { Avatar } from '../ui/Avatar'
import type * as LiveKitReactNative from '@livekit/react-native'
import type { TrackReference } from '@livekit/react-native'
import type { Track } from 'livekit-client'

type CallRoomProps = {
  visible: boolean
  token: string | null
  serverUrl: string | null
  callType: 'audio' | 'video'
  remoteName: string
  remoteImageUrl?: string | null
  isConnecting: boolean
  onLeave: () => void
  onRoomConnected: () => Promise<void> | void
  onRoomDisconnected: (reason?: string) => Promise<void> | void
}

const ROOM_OPTIONS = {
  adaptiveStream: { pixelDensity: 'screen' as const },
}
const CAMERA_SOURCE = 'camera' as Track.Source.Camera
const DISCONNECT_REASON_NAMES: Record<number, string> = {
  0: 'UNKNOWN_REASON',
  1: 'CLIENT_INITIATED',
  2: 'DUPLICATE_IDENTITY',
  3: 'SERVER_SHUTDOWN',
  4: 'PARTICIPANT_REMOVED',
  5: 'ROOM_DELETED',
  6: 'STATE_MISMATCH',
  7: 'JOIN_FAILURE',
  8: 'MIGRATION',
  9: 'SIGNAL_CLOSE',
  10: 'ROOM_CLOSED',
  11: 'USER_UNAVAILABLE',
  12: 'USER_REJECTED',
  13: 'SIP_TRUNK_FAILURE',
  14: 'CONNECTION_TIMEOUT',
  15: 'MEDIA_FAILURE',
  16: 'AGENT_ERROR',
}

type LiveKitReactNativeModule = typeof LiveKitReactNative

let liveKitReactNative: LiveKitReactNativeModule | null = null

function getLiveKitReactNative() {
  if (Constants.appOwnership === 'expo') return null
  liveKitReactNative ??=
    require('@livekit/react-native') as LiveKitReactNativeModule
  return liveKitReactNative
}

function isTrackReference(
  track: LiveKitReactNative.TrackReferenceOrPlaceholder,
): track is TrackReference {
  return track.publication !== undefined
}

function getDisconnectReasonName(reason: unknown) {
  if (typeof reason === 'number') {
    return DISCONNECT_REASON_NAMES[reason] ?? reason.toString()
  }
  if (typeof reason === 'string') return reason
  return undefined
}

function CallStage({
  callType,
  remoteName,
  remoteImageUrl,
  onLeave,
}: {
  callType: 'audio' | 'video'
  remoteName: string
  remoteImageUrl?: string | null
  onLeave: () => void
}) {
  const liveKit = getLiveKitReactNative()
  if (!liveKit) {
    return (
      <UnsupportedCallRuntime
        remoteName={remoteName}
        remoteImageUrl={remoteImageUrl}
        onLeave={onLeave}
      />
    )
  }

  const { VideoTrack, useLocalParticipant, useParticipants, useTracks } =
    liveKit
  const insets = useSafeAreaInsets()
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(callType === 'video')

  const cameraTracks = useTracks([CAMERA_SOURCE], {
    onlySubscribed: false,
  })
  const remoteVideoTrack = useMemo<TrackReference | undefined>(() => {
    return cameraTracks.find(
      (track): track is TrackReference =>
        isTrackReference(track) &&
        track.participant.identity !== localParticipant.identity &&
        track.publication.isSubscribed,
    )
  }, [cameraTracks, localParticipant.identity])
  const localVideoTrack = useMemo<TrackReference | undefined>(() => {
    return cameraTracks.find(
      (track): track is TrackReference =>
        isTrackReference(track) &&
        track.participant.identity === localParticipant.identity,
    )
  }, [cameraTracks, localParticipant.identity])

  useEffect(() => {
    void localParticipant.setMicrophoneEnabled(true)
    if (callType === 'video') {
      void localParticipant.setCameraEnabled(true)
    }
  }, [callType, localParticipant])

  const toggleMic = async () => {
    const next = !micEnabled
    setMicEnabled(next)
    try {
      await localParticipant.setMicrophoneEnabled(next)
    } catch {
      setMicEnabled(!next)
    }
  }

  const toggleCamera = async () => {
    if (callType !== 'video') return
    const next = !cameraEnabled
    setCameraEnabled(next)
    try {
      await localParticipant.setCameraEnabled(next)
    } catch {
      setCameraEnabled(!next)
    }
  }

  const switchCamera = async () => {
    if (callType !== 'video' || !cameraEnabled) return
    try {
      const publication = localParticipant.getTrackPublication(CAMERA_SOURCE)
      const track = publication?.track as
        | {
            getCapabilities?: () => unknown
            switchCamera?: () => Promise<void>
          }
        | undefined
      if (track?.switchCamera) {
        await track.switchCamera()
      }
    } catch {
      // best-effort
    }
  }

  const remoteParticipantCount = participants.length - 1
  const isOnlyParticipant = remoteParticipantCount <= 0

  return (
    <View className="flex-1 bg-black">
      {callType === 'video' && remoteVideoTrack ? (
        <VideoTrack
          trackRef={remoteVideoTrack}
          style={{ flex: 1, backgroundColor: '#000' }}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-black">
          <Avatar
            imageUrl={remoteImageUrl ?? undefined}
            name={remoteName}
            size="xl"
          />
          <Text className="mt-4 text-2xl font-semibold text-white">
            {remoteName}
          </Text>
          <Text className="mt-1 text-sm text-white/70">
            {isOnlyParticipant
              ? 'Waiting for the other side…'
              : callType === 'audio'
                ? 'Audio call in progress'
                : 'Camera off'}
          </Text>
        </View>
      )}

      {callType === 'video' && localVideoTrack && cameraEnabled ? (
        <View
          className="absolute right-4 overflow-hidden rounded-2xl border border-white/20"
          style={{
            top: insets.top + 16,
            width: 96,
            height: 128,
            backgroundColor: '#111',
          }}
        >
          <VideoTrack
            trackRef={localVideoTrack}
            style={{ flex: 1, backgroundColor: '#111' }}
          />
        </View>
      ) : null}

      <View
        className="absolute inset-x-0 bottom-0 items-center px-6"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <View className="flex-row items-center gap-4 rounded-full bg-black/60 px-4 py-3">
          <Pressable
            accessibilityLabel={
              micEnabled ? 'Mute microphone' : 'Unmute microphone'
            }
            onPress={() => void toggleMic()}
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor: micEnabled
                ? 'rgba(255,255,255,0.18)'
                : '#FAFAFA',
            }}
          >
            {micEnabled ? (
              <Mic color="#FAFAFA" size={20} />
            ) : (
              <MicOff color="#0A0A0A" size={20} />
            )}
          </Pressable>

          {callType === 'video' ? (
            <>
              <Pressable
                accessibilityLabel={
                  cameraEnabled ? 'Turn camera off' : 'Turn camera on'
                }
                onPress={() => void toggleCamera()}
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{
                  backgroundColor: cameraEnabled
                    ? 'rgba(255,255,255,0.18)'
                    : '#FAFAFA',
                }}
              >
                {cameraEnabled ? (
                  <VideoIcon color="#FAFAFA" size={20} />
                ) : (
                  <VideoOff color="#0A0A0A" size={20} />
                )}
              </Pressable>

              <Pressable
                accessibilityLabel="Switch camera"
                onPress={() => void switchCamera()}
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
              >
                <SwitchCamera color="#FAFAFA" size={20} />
              </Pressable>
            </>
          ) : null}

          <Pressable
            accessibilityLabel="End call"
            onPress={onLeave}
            className="h-12 w-12 items-center justify-center rounded-full bg-destructive"
          >
            <PhoneOff color="#FFFFFF" size={20} />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

export function CallRoom({
  visible,
  token,
  serverUrl,
  callType,
  remoteName,
  remoteImageUrl,
  isConnecting,
  onLeave,
  onRoomConnected,
  onRoomDisconnected,
}: CallRoomProps) {
  const liveKit = getLiveKitReactNative()

  useEffect(() => {
    if (!visible || !liveKit) return
    let active = true
    void liveKit.AudioSession.startAudioSession()
    return () => {
      active = false
      void liveKit.AudioSession.stopAudioSession()
      void active
    }
  }, [liveKit, visible])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onLeave}
    >
      {!liveKit ? (
        <UnsupportedCallRuntime
          remoteName={remoteName}
          remoteImageUrl={remoteImageUrl}
          onLeave={onLeave}
        />
      ) : token && serverUrl ? (
        <liveKit.LiveKitRoom
          serverUrl={serverUrl}
          token={token}
          connect
          audio
          video={callType === 'video'}
          options={ROOM_OPTIONS}
          onError={(error: Error) => {
            Alert.alert('Call error', error.message)
            onLeave()
          }}
          onConnected={() => {
            void onRoomConnected()
          }}
          onDisconnected={(reason?: unknown) => {
            void onRoomDisconnected(getDisconnectReasonName(reason))
          }}
        >
          <CallStage
            callType={callType}
            remoteName={remoteName}
            remoteImageUrl={remoteImageUrl}
            onLeave={onLeave}
          />
        </liveKit.LiveKitRoom>
      ) : (
        <View className="flex-1 items-center justify-center bg-black">
          <ActivityIndicator color="#FAFAFA" size="large" />
          <Text className="mt-4 text-base text-white">
            {isConnecting ? 'Connecting…' : 'Waiting for token…'}
          </Text>
          <Pressable
            onPress={onLeave}
            className="mt-8 rounded-full bg-destructive px-5 py-2"
          >
            <Text className="text-sm font-semibold text-white">Cancel</Text>
          </Pressable>
        </View>
      )}
    </Modal>
  )
}

function UnsupportedCallRuntime({
  remoteName,
  remoteImageUrl,
  onLeave,
}: {
  remoteName: string
  remoteImageUrl?: string | null
  onLeave: () => void
}) {
  return (
    <View className="flex-1 items-center justify-center bg-black px-8">
      <Avatar
        imageUrl={remoteImageUrl ?? undefined}
        name={remoteName}
        size="xl"
      />
      <Text className="mt-4 text-center text-xl font-semibold text-white">
        Calls need a development build
      </Text>
      <Text className="mt-2 text-center text-sm text-white/70">
        Expo Go can preview the app UI, but LiveKit calls require the Civic Research Hub
        native build.
      </Text>
      <Pressable
        onPress={onLeave}
        className="mt-8 rounded-full bg-destructive px-5 py-2"
      >
        <Text className="text-sm font-semibold text-white">Close</Text>
      </Pressable>
    </View>
  )
}
