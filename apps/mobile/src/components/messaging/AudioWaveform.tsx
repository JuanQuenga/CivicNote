import { memo, useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import type { GestureResponderEvent } from 'react-native'

const DEFAULT_BAR_COUNT = 36

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

export function createSeededWaveform(
  seed: string,
  barCount = DEFAULT_BAR_COUNT,
): Array<number> {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  const values: Array<number> = []
  let state = hash >>> 0
  for (let i = 0; i < barCount; i += 1) {
    state = Math.imul(state ^ (state >>> 15), 2246822519) >>> 0
    const normalized = (state % 1000) / 1000
    values.push(0.2 + normalized * 0.8)
  }

  return smoothWaveform(values)
}

export function normalizeWaveform(
  source: Array<number>,
  barCount = DEFAULT_BAR_COUNT,
): Array<number> {
  if (source.length === 0) {
    return createSeededWaveform('fallback', barCount)
  }

  const values: Array<number> = []
  const blockSize = source.length / barCount

  for (let i = 0; i < barCount; i += 1) {
    const start = Math.floor(i * blockSize)
    const end = Math.floor((i + 1) * blockSize) || start + 1
    let sum = 0
    let count = 0

    for (let j = start; j < end && j < source.length; j += 1) {
      sum += clamp(source[j])
      count += 1
    }

    values.push(count > 0 ? sum / count : 0.15)
  }

  const maxValue = Math.max(...values, 0.01)
  const normalized = values.map((value) => Math.max(0.15, value / maxValue))
  return smoothWaveform(normalized)
}

function smoothWaveform(values: Array<number>): Array<number> {
  return values.map((value, index) => {
    const prev = values[index - 1] ?? value
    const next = values[index + 1] ?? value
    return clamp((prev + value * 2 + next) / 4)
  })
}

interface AudioWaveformProps {
  samples: Array<number>
  progress: number
  isPlaying?: boolean
  height?: number
  playedColor: string
  unplayedColor: string
  onSeek?: (progress: number) => void
}

export const AudioWaveform = memo(function AudioWaveformImpl({
  samples,
  progress,
  isPlaying = false,
  height = 34,
  playedColor,
  unplayedColor,
  onSeek,
}: AudioWaveformProps) {
  const [width, setWidth] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isPlaying) return undefined
    const intervalId = setInterval(() => {
      setTick((prev) => prev + 1)
    }, 120)
    return () => clearInterval(intervalId)
  }, [isPlaying])

  const bars = useMemo(
    () => normalizeWaveform(samples, DEFAULT_BAR_COUNT),
    [samples],
  )

  const playedIndex = Math.floor(clamp(progress) * bars.length)
  const minBarHeight = 5
  const gap = 2
  const barWidth =
    width > 0 ? Math.max((width - gap * (bars.length - 1)) / bars.length, 2) : 3

  const handlePress = (event: GestureResponderEvent) => {
    if (!onSeek || width === 0) return
    const nextProgress = clamp(event.nativeEvent.locationX / width)
    onSeek(nextProgress)
  }

  return (
    <Pressable
      disabled={!onSeek}
      className="justify-center"
      onPress={handlePress}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height }}
    >
      <View className="flex-row items-center">
        {bars.map((barValue, index) => {
          const isPlayed = index <= playedIndex
          const animatedScale =
            isPlaying && isPlayed
              ? 1 + 0.12 * Math.sin((tick + index) * 0.65)
              : 1
          const barHeight = Math.max(
            minBarHeight,
            barValue * height * 0.9 * animatedScale,
          )

          return (
            <View
              key={`${index}-${barValue.toFixed(3)}`}
              style={{
                width: barWidth,
                height: barHeight,
                borderRadius: 999,
                marginRight: index === bars.length - 1 ? 0 : gap,
                backgroundColor: isPlayed ? playedColor : unplayedColor,
              }}
            />
          )
        })}
      </View>
    </Pressable>
  )
})
