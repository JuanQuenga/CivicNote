import {
  Album,
  Camera,
  EyeOff,
  Image as ImageIcon,
  MapPin,
  Mic,
  Route,
  Timer,
  User,
} from 'lucide-react-native'
import { Modal, Pressable, Text, View } from 'react-native'

export type AttachmentAction =
  | 'photo'
  | 'gif'
  | 'voice'
  | 'location'
  | 'distance'
  | 'album'
  | 'spot'
  | 'member'
  | 'ephemeral'
  | 'invisibleInk'

interface AttachmentMenuProps {
  visible: boolean
  onClose: () => void
  onSelect: (action: AttachmentAction) => void
  disableVoice?: boolean
  hideAlbum?: boolean
  hideDistance?: boolean
  isEphemeral?: boolean
  isInvisibleInk?: boolean
}

const ITEMS: Array<{
  action: AttachmentAction
  label: string
  Icon: typeof Camera
  color: string
  bg: string
}> = [
  {
    action: 'photo',
    label: 'Photo',
    Icon: Camera,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
  },
  {
    action: 'gif',
    label: 'GIF',
    Icon: ImageIcon,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.15)',
  },
  {
    action: 'voice',
    label: 'Voice',
    Icon: Mic,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.15)',
  },
  {
    action: 'location',
    label: 'Location',
    Icon: MapPin,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
  },
  {
    action: 'distance',
    label: 'Distance',
    Icon: Route,
    color: '#2dd4bf',
    bg: 'rgba(45,212,191,0.15)',
  },
  {
    action: 'album',
    label: 'Album',
    Icon: Album,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
  },
  {
    action: 'spot',
    label: 'Spot',
    Icon: MapPin,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.15)',
  },
  {
    action: 'member',
    label: 'Member',
    Icon: User,
    color: '#F11A23',
    bg: 'rgba(241,26,35,0.15)',
  },
  {
    action: 'ephemeral',
    label: 'Disappearing',
    Icon: Timer,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
  },
  {
    action: 'invisibleInk',
    label: 'Invisible Ink',
    Icon: EyeOff,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.15)',
  },
]

export function AttachmentMenu({
  visible,
  onClose,
  onSelect,
  disableVoice,
  hideAlbum,
  hideDistance,
  isEphemeral,
  isInvisibleInk,
}: AttachmentMenuProps) {
  const items = ITEMS.filter(
    (item) =>
      !(hideAlbum && item.action === 'album') &&
      !(hideDistance && item.action === 'distance'),
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/60" onPress={onClose}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="rounded-t-3xl border-t border-border bg-card px-4 pb-10 pt-4"
        >
          <View className="mb-4 self-center h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          <Text className="mb-3 text-base font-semibold text-foreground">
            Send attachment
          </Text>
          <View className="flex-row flex-wrap">
            {items.map((item) => {
              const isDisabled = disableVoice && item.action === 'voice'
              const isActive =
                (item.action === 'ephemeral' && isEphemeral) ||
                (item.action === 'invisibleInk' && isInvisibleInk)
              return (
                <Pressable
                  key={item.action}
                  onPress={() => {
                    if (isDisabled) return
                    onSelect(item.action)
                    onClose()
                  }}
                  className="mb-3 items-center"
                  style={{ width: '25%', opacity: isDisabled ? 0.4 : 1 }}
                  disabled={isDisabled}
                >
                  <View
                    className="h-14 w-14 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: item.bg,
                      borderWidth: isActive ? 2 : 0,
                      borderColor: item.color,
                    }}
                  >
                    <item.Icon size={22} color={item.color} />
                  </View>
                  <Text className="mt-2 text-xs font-medium text-foreground">
                    {item.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export const ATTACHMENT_ITEMS = ITEMS
