import {
  Ban,
  BellOff,
  ExternalLink,
  Flag,
  Info,
  LogOut,
  Search,
  User,
} from 'lucide-react-native'
import { Modal, Pressable, Text, View } from 'react-native'

interface HeaderMenuSheetProps {
  visible: boolean
  onClose: () => void
  isGroup?: boolean
  isGroupMuted?: boolean
  onViewProfile?: () => void
  onSearch?: () => void
  onOpenOnWeb?: () => void
  onReport?: () => void
  onBlock?: () => void
  onGroupInfo?: () => void
  onToggleMute?: () => void
  onLeaveGroup?: () => void
}

export function HeaderMenuSheet({
  visible,
  onClose,
  isGroup,
  isGroupMuted,
  onViewProfile,
  onSearch,
  onOpenOnWeb,
  onReport,
  onBlock,
  onGroupInfo,
  onToggleMute,
  onLeaveGroup,
}: HeaderMenuSheetProps) {
  const wrap = (handler?: () => void) => () => {
    if (!handler) return
    handler()
    onClose()
  }

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

          <View className="rounded-2xl border border-border bg-background">
            {!isGroup && onViewProfile ? (
              <Row
                Icon={User}
                label="View profile"
                onPress={wrap(onViewProfile)}
              />
            ) : null}
            {isGroup && onGroupInfo ? (
              <Row Icon={Info} label="Group info" onPress={wrap(onGroupInfo)} />
            ) : null}
            {onSearch ? (
              <Row
                Icon={Search}
                label="Search messages"
                onPress={wrap(onSearch)}
              />
            ) : null}
            {onOpenOnWeb ? (
              <Row
                Icon={ExternalLink}
                label="Open on web"
                onPress={wrap(onOpenOnWeb)}
              />
            ) : null}
            {isGroup && onToggleMute ? (
              <Row
                Icon={BellOff}
                label={isGroupMuted ? 'Unmute' : 'Mute notifications'}
                onPress={wrap(onToggleMute)}
              />
            ) : null}
            {onReport ? (
              <Row
                Icon={Flag}
                label="Report user"
                destructive
                onPress={wrap(onReport)}
              />
            ) : null}
            {onBlock ? (
              <Row
                Icon={Ban}
                label="Block user"
                destructive
                onPress={wrap(onBlock)}
              />
            ) : null}
            {isGroup && onLeaveGroup ? (
              <Row
                Icon={LogOut}
                label="Leave group"
                destructive
                onPress={wrap(onLeaveGroup)}
              />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Row({
  Icon,
  label,
  destructive,
  onPress,
}: {
  Icon: typeof User
  label: string
  destructive?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5"
    >
      <Icon size={18} color={destructive ? '#DC2626' : '#FAFAFA'} />
      <Text
        className={
          destructive
            ? 'text-base font-medium text-destructive'
            : 'text-base font-medium text-foreground'
        }
      >
        {label}
      </Text>
    </Pressable>
  )
}
