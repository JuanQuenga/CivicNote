import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Marker } from 'react-native-maps'
import { Image } from 'expo-image'
import { Clock } from 'lucide-react-native'
import { useResolvedMediaUrl } from '../../hooks/useResolvedMediaUrl'
import type { Id } from '@/src/lib/convexApi'

const OFFLINE_MARKER_RETENTION_MS = 3 * 60 * 60 * 1000

interface MemberMarkerProps {
  member: {
    _id: Id<'users'>
    name: string
    imageUrl?: string
    isOnline?: boolean
    lastActive?: number
    latitude: number
    longitude: number
  }
  isSelected: boolean
  onPress: () => void
}

export const MemberMarker = memo(function MemberMarker({
  member,
  isSelected,
  onPress,
}: MemberMarkerProps) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const resolvedImageUrl = useResolvedMediaUrl(member.imageUrl)
  const isRecentlyOffline =
    member.isOnline !== true &&
    typeof member.lastActive === 'number' &&
    Date.now() - member.lastActive <= OFFLINE_MARKER_RETENTION_MS

  return (
    <Marker
      coordinate={{
        latitude: member.latitude,
        longitude: member.longitude,
      }}
      onPress={(event) => {
        event.stopPropagation()
        onPress()
      }}
      tracksViewChanges={false}
    >
      <View style={[styles.container, isSelected && styles.selectedContainer]}>
        {resolvedImageUrl ? (
          <Image
            source={{ uri: resolvedImageUrl }}
            style={[
              styles.image,
              isRecentlyOffline && styles.offlineImage,
              isSelected && styles.selectedImage,
            ]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.initialsContainer,
              isRecentlyOffline && styles.offlineInitialsContainer,
              isSelected && styles.selectedImage,
            ]}
          >
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        {member.isOnline ? (
          <View style={styles.onlineIndicator} />
        ) : isRecentlyOffline ? (
          <View style={styles.offlineIndicator}>
            <Clock color="#FAFAFA" size={8} />
          </View>
        ) : null}
      </View>
    </Marker>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  selectedContainer: {
    zIndex: 100,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  selectedImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#F11A23',
  },
  offlineImage: {
    opacity: 0.54,
    borderColor: 'rgba(156, 163, 175, 0.65)',
  },
  initialsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(241, 26, 35, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  offlineInitialsContainer: {
    opacity: 0.54,
    borderColor: 'rgba(156, 163, 175, 0.65)',
    backgroundColor: 'rgba(156, 163, 175, 0.18)',
  },
  initials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F11A23',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#000000',
  },
  offlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#6b7280',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
