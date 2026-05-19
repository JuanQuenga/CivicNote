import { useState } from 'react'
import { useMutation } from 'convex/react'
import { Alert, Pressable, Text, View } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { Flag, Trash2 } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { Avatar } from '../ui/Avatar'
import { formatTimeAgo } from '../../lib/format'
import { useResolvedMediaUrl } from '../../hooks/useResolvedMediaUrl'
import type { Id } from '@/src/lib/convexApi'

export interface SpotChatMessageData {
  _id: Id<'spotMessages'>
  content: string
  format: 'text' | 'image'
  mediaUrl?: string
  isNsfw?: boolean
  sentAt: number
  isAnonymous?: boolean
  optimisticStatus?: 'sending' | 'sent'
  sender: {
    _id: Id<'users'>
    name: string
    imageUrl?: string
  }
}

interface Props {
  message: SpotChatMessageData
  currentUserId?: Id<'users'>
  isOwn: boolean
}

export function SpotChatMessage({ message, currentUserId, isOwn }: Props) {
  const deleteMessage = useMutation(api.spotChat.deleteSpotMessage)
  const reportMessage = useMutation(api.spotChat.reportSpotMessage)
  const resolvedMediaUrl = useResolvedMediaUrl(message.mediaUrl)
  const [busy, setBusy] = useState(false)

  const isPending = Boolean(message.optimisticStatus)

  const handleLongPress = () => {
    if (!currentUserId || isPending) return
    if (isOwn) {
      Alert.alert('Message options', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void handleDelete(),
        },
      ])
    } else {
      Alert.alert('Report message', 'Choose a reason.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Inappropriate',
          onPress: () => void handleReport('inappropriate'),
        },
        { text: 'Spam', onPress: () => void handleReport('spam') },
        { text: 'Other', onPress: () => void handleReport('other') },
      ])
    }
  }

  const handleDelete = async () => {
    try {
      setBusy(true)
      await deleteMessage({ messageId: message._id })
    } catch (error) {
      Alert.alert(
        'Delete failed',
        error instanceof Error ? error.message : 'Could not delete message',
      )
    } finally {
      setBusy(false)
    }
  }

  const handleReport = async (reason: 'inappropriate' | 'spam' | 'other') => {
    try {
      setBusy(true)
      await reportMessage({ messageId: message._id, reason })
      Alert.alert('Message reported', 'Thanks. Our team will review it.')
    } catch (error) {
      Alert.alert(
        'Report failed',
        error instanceof Error ? error.message : 'Could not report',
      )
    } finally {
      setBusy(false)
    }
  }

  const showAvatar = !isOwn
  const displayName = message.isAnonymous ? 'Anonymous' : message.sender.name

  return (
    <View
      style={{
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 3,
        gap: 8,
      }}
    >
      {showAvatar ? (
        <View style={{ marginBottom: 2 }}>
          <Avatar
            imageUrl={message.isAnonymous ? null : message.sender.imageUrl}
            name={displayName}
            size="sm"
          />
        </View>
      ) : null}

      <View
        style={{
          maxWidth: '75%',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
        }}
      >
        {!isOwn ? (
          <Text
            style={{
              color: '#71767B',
              fontSize: 10,
              fontWeight: '600',
              fontStyle: message.isAnonymous ? 'italic' : 'normal',
              marginBottom: 2,
              paddingHorizontal: 4,
            }}
          >
            {displayName}
          </Text>
        ) : null}

        <Pressable
          onLongPress={handleLongPress}
          disabled={busy || isPending}
          style={{
            borderTopLeftRadius: isOwn ? 16 : 4,
            borderTopRightRadius: isOwn ? 4 : 16,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: isOwn ? '#F11A23' : '#1F1F1F',
            borderWidth: isOwn ? 0 : 1,
            borderColor: '#2F3336',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {message.format === 'image' && resolvedMediaUrl ? (
            <ExpoImage
              source={{ uri: resolvedMediaUrl }}
              contentFit="cover"
              style={{
                width: 200,
                height: 200,
                borderRadius: 10,
              }}
            />
          ) : (
            <Text
              style={{
                color: isOwn ? '#FAFAFA' : '#E7E9EA',
                fontSize: 14,
                lineHeight: 19,
              }}
            >
              {message.content}
            </Text>
          )}
        </Pressable>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 2,
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: '#71767B', fontSize: 10 }}>
            {message.optimisticStatus === 'sending'
              ? 'Sending…'
              : message.optimisticStatus === 'sent'
                ? 'Sent'
                : formatTimeAgo(message.sentAt)}
          </Text>
          {isOwn && message.isAnonymous ? (
            <Text
              style={{
                color: '#71767B',
                fontSize: 9,
                fontStyle: 'italic',
              }}
            >
              anon
            </Text>
          ) : null}
          {!isPending && currentUserId ? (
            <Pressable
              onPress={handleLongPress}
              hitSlop={6}
              style={{ marginLeft: 4 }}
            >
              {isOwn ? (
                <Trash2 color="#71767B" size={11} />
              ) : (
                <Flag color="#71767B" size={11} />
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  )
}
