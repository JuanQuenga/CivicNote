import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react-native'
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av'
import { Pressable, Text, View } from 'react-native'
import { AudioWaveform, createSeededWaveform } from './AudioWaveform'
import type { AVPlaybackStatus } from 'expo-av'

function formatDuration(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0
  const mins = Math.floor(safe / 60)
  const secs = Math.floor(safe % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getAudioModeForPlayback() {
  return {
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  }
}

interface VoiceMessageBubbleProps {
  voiceUrl?: string
  duration?: number
  isOwn: boolean
}

export function VoiceMessageBubble({
  voiceUrl,
  duration,
  isOwn,
}: VoiceMessageBubbleProps) {
  const resolvedUrl = voiceUrl || null
  const soundRef = useRef<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [positionMillis, setPositionMillis] = useState(0)
  const [durationMillis, setDurationMillis] = useState(
    duration ? Math.round(duration * 1000) : 0,
  )
  const [playbackError, setPlaybackError] = useState<string | null>(null)

  const waveform = useMemo(
    () =>
      createSeededWaveform(
        resolvedUrl || `voice-${duration ?? 0}-${isOwn ? 1 : 0}`,
      ),
    [duration, isOwn, resolvedUrl],
  )

  const cleanupSound = useCallback(async () => {
    const sound = soundRef.current
    soundRef.current = null
    if (sound) {
      try {
        await sound.unloadAsync()
      } catch {
        // Ignore unload errors.
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      void cleanupSound()
    }
  }, [cleanupSound])

  useEffect(() => {
    setPlaybackError(null)
  }, [resolvedUrl])

  const handlePlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setIsPlaying(false)
      return
    }

    setIsPlaying(status.isPlaying)
    setPositionMillis(status.positionMillis)
    if (status.durationMillis) {
      setDurationMillis(status.durationMillis)
    }
  }, [])

  const ensureSound = useCallback(async () => {
    if (!resolvedUrl) return null
    if (soundRef.current) return soundRef.current

    try {
      await Audio.setAudioModeAsync(getAudioModeForPlayback())
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: resolvedUrl },
        { shouldPlay: false, progressUpdateIntervalMillis: 90 },
        handlePlaybackStatus,
      )
      soundRef.current = sound

      if (status.isLoaded && status.durationMillis) {
        setDurationMillis(status.durationMillis)
      }

      return sound
    } catch {
      setPlaybackError(
        'Unable to play this voice message on your device right now.',
      )
      return null
    }
  }, [handlePlaybackStatus, resolvedUrl])

  const togglePlayback = useCallback(async () => {
    const sound = await ensureSound()
    if (!sound) return

    const status = await sound.getStatusAsync()
    if (!status.isLoaded) return

    if (status.isPlaying) {
      await sound.pauseAsync()
      return
    }

    if (
      status.didJustFinish ||
      (status.durationMillis &&
        status.positionMillis >= status.durationMillis - 120)
    ) {
      await sound.setPositionAsync(0)
    }

    await sound.playAsync()
  }, [ensureSound])

  const handleSeek = useCallback(
    async (progress: number) => {
      const sound = await ensureSound()
      if (!sound) return

      const status = await sound.getStatusAsync()
      if (!status.isLoaded) return
      const total = status.durationMillis ?? durationMillis
      if (!total) return

      const nextPosition = Math.round(total * progress)
      await sound.setPositionAsync(nextPosition)
      setPositionMillis(nextPosition)
    },
    [durationMillis, ensureSound],
  )

  const totalMillis = durationMillis || (duration ? duration * 1000 : 0)
  const progress = totalMillis > 0 ? positionMillis / totalMillis : 0
  const durationLabel = formatDuration(totalMillis / 1000)
  const currentLabel = formatDuration(positionMillis / 1000)

  const playedColor = isOwn ? '#FFFFFF' : '#F11A23'
  const unplayedColor = isOwn
    ? 'rgba(255,255,255,0.45)'
    : 'rgba(255,255,255,0.36)'
  const iconColor = isOwn ? '#FFFFFF' : '#F11A23'
  const textColor = isOwn ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.76)'

  return (
    <View className="min-w-[210px] flex-row items-center gap-3">
      <Pressable
        className={`h-8 w-8 items-center justify-center rounded-full ${
          isOwn ? 'bg-white/20' : 'bg-black/25'
        }`}
        disabled={!resolvedUrl}
        onPress={() => {
          void togglePlayback()
        }}
      >
        {isPlaying ? (
          <Pause size={16} color={iconColor} />
        ) : (
          <Play size={16} color={iconColor} />
        )}
      </Pressable>

      <View className="flex-1">
        <AudioWaveform
          samples={waveform}
          progress={progress}
          isPlaying={isPlaying}
          playedColor={playedColor}
          unplayedColor={unplayedColor}
          onSeek={handleSeek}
        />
        <Text className="mt-1 text-xs font-medium" style={{ color: textColor }}>
          {currentLabel} / {durationLabel}
        </Text>
        {playbackError && (
          <Text className="mt-1 text-xs font-medium text-red-300">
            {playbackError}
          </Text>
        )}
      </View>
    </View>
  )
}
