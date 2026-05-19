import {
  ImageIcon,
  MapPin,
  Mic,
  Share2,
  UserPlus,
  Video,
} from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import type { Id } from '@/src/lib/convexApi'

interface QuotedMessageProps {
  messageId: Id<'messages'>
  senderName: string
  content: string
  format: string
  isDeleted?: boolean
  isOwn: boolean
  onPress?: (messageId: Id<'messages'>) => void
}

function getFormatLabel(format: string, content: string) {
  switch (format) {
    case 'image':
      return 'Photo'
    case 'video':
      return 'Video'
    case 'gif':
      return 'GIF'
    case 'voice':
      return 'Voice message'
    case 'location':
      return 'Location'
    case 'album_share':
      return 'Album shared'
    case 'friend_request':
      return 'Friend request'
    case 'spot_share':
      return 'Spot shared'
    case 'member_share':
      return 'Member shared'
    default:
      return content.length > 60 ? `${content.slice(0, 60)}…` : content
  }
}

function FormatIcon({ format, color }: { format: string; color: string }) {
  switch (format) {
    case 'image':
      return <ImageIcon size={11} color={color} />
    case 'video':
      return <Video size={11} color={color} />
    case 'voice':
      return <Mic size={11} color={color} />
    case 'location':
      return <MapPin size={11} color={color} />
    case 'album_share':
      return <Share2 size={11} color={color} />
    case 'friend_request':
      return <UserPlus size={11} color={color} />
    default:
      return null
  }
}

export function QuotedMessage({
  messageId,
  senderName,
  content,
  format,
  isDeleted,
  isOwn,
  onPress,
}: QuotedMessageProps) {
  const displayContent = isDeleted
    ? 'This message was deleted'
    : getFormatLabel(format, content)
  const iconColor = isOwn ? 'rgba(255,255,255,0.7)' : '#999999'

  return (
    <Pressable
      onPress={() => onPress?.(messageId)}
      className={
        isOwn
          ? 'mb-1.5 rounded-lg border-l-2 border-white/40 bg-white/10 px-2 py-1.5'
          : 'mb-1.5 rounded-lg border-l-2 border-muted-foreground/40 bg-card/80 px-2 py-1.5'
      }
    >
      <Text
        className={
          isOwn
            ? 'text-[11px] font-semibold text-primary-foreground/80'
            : 'text-[11px] font-semibold text-muted-foreground'
        }
        numberOfLines={1}
      >
        {senderName}
      </Text>
      <View className="mt-0.5 flex-row items-center gap-1">
        <FormatIcon format={format} color={iconColor} />
        <Text
          className={
            isOwn
              ? 'flex-1 text-[12px] text-primary-foreground/70'
              : 'flex-1 text-[12px] text-muted-foreground'
          }
          style={isDeleted ? { fontStyle: 'italic' } : undefined}
          numberOfLines={1}
        >
          {displayContent}
        </Text>
      </View>
    </Pressable>
  )
}
