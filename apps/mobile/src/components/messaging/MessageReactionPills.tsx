import { Pressable, Text, View } from 'react-native'
import type { Id } from '@/src/lib/convexApi'

interface Reaction {
  emoji: string
  userId: Id<'users'>
  reactedAt: number
}

interface MessageReactionPillsProps {
  reactions: Array<Reaction>
  currentUserId: Id<'users'>
  onPress: (emoji: string) => void
  alignEnd?: boolean
}

export function MessageReactionPills({
  reactions,
  currentUserId,
  onPress,
  alignEnd = true,
}: MessageReactionPillsProps) {
  const grouped = reactions.reduce<
    Map<string, { count: number; reactedByMe: boolean }>
  >((acc, reaction) => {
    const existing = acc.get(reaction.emoji) ?? {
      count: 0,
      reactedByMe: false,
    }
    acc.set(reaction.emoji, {
      count: existing.count + 1,
      reactedByMe: existing.reactedByMe || reaction.userId === currentUserId,
    })
    return acc
  }, new Map())

  return (
    <View
      className={`mt-2 flex-row flex-wrap gap-1 ${alignEnd ? 'justify-end' : ''}`}
    >
      {Array.from(grouped.entries()).map(([emoji, value]) => (
        <Pressable
          key={emoji}
          onPress={() => onPress(emoji)}
          className={
            value.reactedByMe
              ? 'flex-row items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5'
              : 'flex-row items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5'
          }
        >
          <Text className="text-xs">{emoji}</Text>
          {value.count > 1 ? (
            <Text className="text-[11px] font-semibold text-foreground">
              {value.count}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  )
}
