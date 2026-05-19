import { Phone, PhoneOff, Video, X } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { Avatar } from '../ui/Avatar'

interface IncomingCallBannerProps {
  callerName: string
  callerImageUrl?: string | null
  callType: 'audio' | 'video'
  onAnswer: () => void
  onDecline: () => void
  onDismiss?: () => void
}

export function IncomingCallBanner({
  callerName,
  callerImageUrl,
  callType,
  onAnswer,
  onDecline,
  onDismiss,
}: IncomingCallBannerProps) {
  return (
    <View
      className="w-full flex-row items-center gap-3 border-b border-border bg-background/95 px-4 py-2"
      style={{ minHeight: 56 }}
    >
      <Avatar imageUrl={callerImageUrl} name={callerName} size="sm" />

      <View className="min-w-0 flex-1">
        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
          {callerName}
        </Text>
        <Text className="text-xs text-muted-foreground">
          Incoming {callType} call...
        </Text>
      </View>

      <View className="shrink-0 flex-row items-center gap-1.5">
        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            className="h-8 w-8 items-center justify-center rounded-full"
          >
            <X size={16} color="#999999" />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onDecline}
          className="h-9 w-9 items-center justify-center rounded-full bg-destructive"
        >
          <PhoneOff size={16} color="#FFFFFF" />
        </Pressable>
        <Pressable
          onPress={onAnswer}
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: '#22c55e' }}
        >
          {callType === 'video' ? (
            <Video size={16} color="#FFFFFF" />
          ) : (
            <Phone size={16} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </View>
  )
}
