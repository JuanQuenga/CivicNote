import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { ChevronRight, MapPin } from 'lucide-react-native'
import { useResolvedMediaUrl } from '../../hooks/useResolvedMediaUrl'
import type { Id } from '@/src/lib/convexApi'

interface MemberListItemProps {
  member: {
    _id: Id<'users'>
    name: string
    imageUrl?: string
    isOnline?: boolean
    distanceMiles?: number
    profile?: {
      displayName?: string
      age?: number
    } | null
  }
  onPress: () => void
}

function formatDistance(miles?: number): string {
  if (miles === undefined) return ''
  if (miles < 0.1) return 'Nearby'
  if (miles < 1) return `${(miles * 5280).toFixed(0)} ft`
  return `${miles.toFixed(1)} mi`
}

export const MemberListItem = memo(function MemberListItem({
  member,
  onPress,
}: MemberListItemProps) {
  const displayName = member.profile?.displayName ?? member.name
  const age = member.profile?.age
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const resolvedImageUrl = useResolvedMediaUrl(member.imageUrl)

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        {resolvedImageUrl ? (
          <Image
            source={{ uri: resolvedImageUrl }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        {member.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {age && <Text style={styles.age}>{age}</Text>}
        </View>
        {member.distanceMiles !== undefined && (
          <View style={styles.locationRow}>
            <MapPin color="#999999" size={12} />
            <Text style={styles.distance}>
              {formatDistance(member.distanceMiles)}
            </Text>
          </View>
        )}
      </View>

      <ChevronRight color="#666666" size={20} />
    </Pressable>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(241, 26, 35, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F11A23',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  age: {
    fontSize: 13,
    color: '#999999',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 12,
    color: '#999999',
  },
})
