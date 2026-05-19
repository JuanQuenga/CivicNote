import {
  ChevronLeft,
  Info,
  MoreVertical,
  Phone,
  Users,
  Video,
} from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { Avatar } from '../ui/Avatar'

interface ChatHeaderProps {
  displayName: string
  imageUrl?: string | null
  isGroup?: boolean
  isOnline?: boolean
  statusLine?: string | null
  isCallActive?: boolean
  hasIncomingCall?: boolean
  onBack: () => void
  onPressTitle: () => void
  onAudioCall?: () => void
  onVideoCall?: () => void
  onOpenMenu: () => void
  onOpenGroupInfo?: () => void
}

export function ChatHeader({
  displayName,
  imageUrl,
  isGroup,
  isOnline,
  statusLine,
  isCallActive,
  hasIncomingCall,
  onBack,
  onPressTitle,
  onAudioCall,
  onVideoCall,
  onOpenMenu,
  onOpenGroupInfo,
}: ChatHeaderProps) {
  return (
    <View
      className="z-10 flex-row items-center gap-2 border-b border-white/10 bg-black px-2"
      style={{ minHeight: 56 }}
    >
      <Pressable
        onPress={onBack}
        className="h-9 w-9 items-center justify-center rounded-full"
      >
        <ChevronLeft size={22} color="#FAFAFA" />
      </Pressable>

      <Pressable
        onPress={onPressTitle}
        className="flex-1 flex-row items-center gap-2.5"
      >
        {isGroup && !imageUrl ? (
          <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/15">
            <Users size={18} color="#F11A23" />
          </View>
        ) : (
          <Avatar
            imageUrl={imageUrl ?? undefined}
            name={displayName}
            size="sm"
            showOnlineIndicator={!isGroup}
            isOnline={isOnline}
          />
        )}
        <View className="min-w-0 flex-1">
          <Text
            className="text-[15px] font-semibold text-foreground"
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {statusLine ? (
            <Text
              className="text-[11px] text-muted-foreground"
              numberOfLines={1}
            >
              {statusLine}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View className="shrink-0 flex-row items-center">
        {onAudioCall ? (
          <Pressable
            onPress={onAudioCall}
            disabled={isCallActive}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ opacity: isCallActive ? 0.4 : 1 }}
          >
            <Phone size={18} color="#FAFAFA" />
          </Pressable>
        ) : null}
        {onVideoCall ? (
          <Pressable
            onPress={onVideoCall}
            disabled={isCallActive}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ opacity: isCallActive ? 0.4 : 1 }}
          >
            <Video size={18} color="#FAFAFA" />
          </Pressable>
        ) : null}
        {isGroup && onOpenGroupInfo ? (
          <Pressable
            onPress={onOpenGroupInfo}
            className="h-9 w-9 items-center justify-center rounded-full"
          >
            <Info size={18} color="#FAFAFA" />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onOpenMenu}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <MoreVertical size={18} color="#FAFAFA" />
        </Pressable>
      </View>

      {hasIncomingCall ? (
        <View className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-green-500" />
      ) : null}
    </View>
  )
}
