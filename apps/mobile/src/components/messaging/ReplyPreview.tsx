import {
  ImageIcon,
  MapPin,
  Mic,
  Reply,
  Share2,
  User,
  UserPlus,
  Video,
  X,
} from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

interface ReplyPreviewProps {
  senderName: string
  content: string
  format: string
  isDeleted?: boolean
  onCancel: () => void
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
      return content
  }
}

function FormatIcon({ format }: { format: string }) {
  const color = '#999999'
  switch (format) {
    case 'image':
      return <ImageIcon size={12} color={color} />
    case 'video':
      return <Video size={12} color={color} />
    case 'voice':
      return <Mic size={12} color={color} />
    case 'location':
      return <MapPin size={12} color={color} />
    case 'album_share':
      return <Share2 size={12} color={color} />
    case 'friend_request':
      return <UserPlus size={12} color={color} />
    case 'spot_share':
      return <MapPin size={12} color={color} />
    case 'member_share':
      return <User size={12} color={color} />
    default:
      return null
  }
}

export function ReplyPreview({
  senderName,
  content,
  format,
  isDeleted,
  onCancel,
}: ReplyPreviewProps) {
  const displayContent = isDeleted
    ? 'This message was deleted'
    : getFormatLabel(format, content)

  return (
    <View className="mb-2 flex-row items-center gap-2 rounded-r-lg border-l-2 border-primary bg-card px-3 py-2">
      <Reply size={16} color="#999999" />
      <View className="min-w-0 flex-1">
        <Text className="text-xs font-medium text-primary" numberOfLines={1}>
          Replying to {senderName}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-1">
          <FormatIcon format={format} />
          <Text
            className="flex-1 text-xs text-muted-foreground"
            style={isDeleted ? { fontStyle: 'italic' } : undefined}
            numberOfLines={1}
          >
            {displayContent}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onCancel}
        className="h-6 w-6 items-center justify-center rounded-full"
      >
        <X size={14} color="#999999" />
      </Pressable>
    </View>
  )
}
