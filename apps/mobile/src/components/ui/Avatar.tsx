import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useResolvedMediaUrl } from '../../hooks/useResolvedMediaUrl'

type AvatarSize = 'sm' | 'md' | 'lg' | 'list' | 'xl' | 'portrait'

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  list: 56,
  xl: 80,
  portrait: 112,
}

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
  list: 18,
  xl: 28,
  portrait: 30,
}

interface AvatarProps {
  imageUrl?: string | null
  name: string
  size?: AvatarSize
  showOnlineIndicator?: boolean
  isOnline?: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const Avatar = memo(function Avatar({
  imageUrl,
  name,
  size = 'md',
  showOnlineIndicator = false,
  isOnline = false,
}: AvatarProps) {
  const dimension = SIZE_MAP[size]
  const fontSize = FONT_SIZE_MAP[size]
  const initials = getInitials(name)
  const isPortrait = size === 'portrait'
  const width = isPortrait ? dimension * 0.72 : dimension
  const height = dimension
  const borderRadius = isPortrait ? 18 : dimension / 2
  const resolvedImageUrl = useResolvedMediaUrl(imageUrl)

  // Online indicator sizing based on avatar size
  const indicatorSize =
    size === 'sm'
      ? 10
      : size === 'md'
        ? 12
        : size === 'lg'
          ? 14
          : size === 'list'
            ? 16
            : 18
  const indicatorBorderWidth = size === 'sm' ? 1.5 : 2

  return (
    <View style={styles.container}>
      {resolvedImageUrl ? (
        <Image
          source={{ uri: resolvedImageUrl }}
          style={[styles.image, { width, height, borderRadius }]}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.placeholder, { width, height, borderRadius }]}>
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}
      {showOnlineIndicator && isOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              borderWidth: indicatorBorderWidth,
            },
          ]}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: '#2A2A2A',
  },
  placeholder: {
    backgroundColor: 'rgba(241, 26, 35, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
    color: '#F11A23',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#22c55e',
    borderColor: '#1A1A1A',
  },
})
