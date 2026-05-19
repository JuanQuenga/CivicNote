import { Copy, Edit3, Flag, Reply, Trash2 } from 'lucide-react-native'
import { Modal, Pressable, Text, View } from 'react-native'

export const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥'] as const

export interface MessageActionsContext {
  canReply?: boolean
  canCopy?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canReport?: boolean
}

interface MessageActionsSheetProps {
  visible: boolean
  onClose: () => void
  onSelectEmoji: (emoji: string) => void
  onReply?: () => void
  onCopy?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onReport?: () => void
  context: MessageActionsContext
  reactedEmojis?: Set<string>
}

export function MessageActionsSheet({
  visible,
  onClose,
  onSelectEmoji,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  onReport,
  context,
  reactedEmojis,
}: MessageActionsSheetProps) {
  const handleEmoji = (emoji: string) => {
    onSelectEmoji(emoji)
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
          className="rounded-t-3xl border-t border-border bg-card px-4 pb-8 pt-4"
        >
          <View className="mb-3 self-center h-1.5 w-10 rounded-full bg-muted-foreground/30" />

          <View className="mb-3 flex-row items-center justify-between rounded-full border border-border bg-background px-2 py-1">
            {REACTION_EMOJIS.map((emoji) => {
              const isActive = reactedEmojis?.has(emoji)
              return (
                <Pressable
                  key={emoji}
                  onPress={() => handleEmoji(emoji)}
                  className={
                    isActive
                      ? 'h-10 w-10 items-center justify-center rounded-full bg-primary/20'
                      : 'h-10 w-10 items-center justify-center rounded-full'
                  }
                >
                  <Text className="text-xl">{emoji}</Text>
                </Pressable>
              )
            })}
          </View>

          <View className="rounded-2xl border border-border bg-background">
            {context.canReply && onReply ? (
              <ActionRow
                Icon={Reply}
                label="Reply"
                onPress={() => {
                  onReply()
                  onClose()
                }}
              />
            ) : null}
            {context.canCopy && onCopy ? (
              <ActionRow
                Icon={Copy}
                label="Copy"
                onPress={() => {
                  onCopy()
                  onClose()
                }}
              />
            ) : null}
            {context.canEdit && onEdit ? (
              <ActionRow
                Icon={Edit3}
                label="Edit"
                onPress={() => {
                  onEdit()
                  onClose()
                }}
              />
            ) : null}
            {context.canDelete && onDelete ? (
              <ActionRow
                Icon={Trash2}
                label="Delete"
                destructive
                onPress={() => {
                  onDelete()
                  onClose()
                }}
              />
            ) : null}
            {context.canReport && onReport ? (
              <ActionRow
                Icon={Flag}
                label="Report"
                destructive
                onPress={() => {
                  onReport()
                  onClose()
                }}
              />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function ActionRow({
  Icon,
  label,
  destructive,
  onPress,
}: {
  Icon: typeof Copy
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
