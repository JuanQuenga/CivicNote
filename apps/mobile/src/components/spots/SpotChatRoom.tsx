import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from 'convex/react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native'
import { Lock, MessageCircle } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { useOptimisticThreadMessages } from '../../hooks/useOptimisticThreadMessages'
import { SpotChatComposer } from './SpotChatComposer'
import { SpotChatMessage } from './SpotChatMessage'
import type { Id } from '@/src/lib/convexApi'
import type { SpotChatMessageData } from './SpotChatMessage'

interface Props {
  spotId: Id<'spots'>
  currentUserId: Id<'users'>
}

interface PendingSpotMessage extends SpotChatMessageData {
  optimisticKey: string
  resolvedMessageId?: Id<'spotMessages'>
  isOwnMessage: boolean
}

export function SpotChatRoom({ spotId, currentUserId }: Props) {
  const listRef =
    useRef<FlatList<SpotChatMessageData & { isOwn: boolean }>>(null)

  const myActiveCheckIn = useQuery(api.spotCheckIns.getMyActiveCheckIn, {})
  const isCheckInLoading = myActiveCheckIn === undefined
  const isCheckedInHere = myActiveCheckIn?.spotId === spotId
  const isAnonymousAtSpot =
    myActiveCheckIn?.spotId === spotId && myActiveCheckIn.isAnonymous === true

  const result = useQuery(
    api.spotChat.getSpotMessages,
    isCheckedInHere ? { spotId, limit: 50 } : 'skip',
  )

  const {
    pendingItems,
    addPendingItem,
    markPendingItemResolved,
    removePendingItem,
    reconcilePendingItems,
  } = useOptimisticThreadMessages<PendingSpotMessage>({ resetKey: spotId })

  // Server messages come newest-first (order desc). Render oldest-first for display.
  const serverMessages = useMemo(() => {
    const messages = result?.messages ?? []
    return [...messages].reverse()
  }, [result?.messages])

  const serverMessageIds = useMemo(
    () => new Set(serverMessages.map((m) => String(m._id))),
    [serverMessages],
  )

  useEffect(() => {
    reconcilePendingItems(serverMessageIds, {
      getResolvedId: (item) =>
        item.resolvedMessageId ? String(item.resolvedMessageId) : undefined,
    })
  }, [serverMessageIds, reconcilePendingItems])

  const displayed = useMemo<
    Array<SpotChatMessageData & { isOwn: boolean }>
  >(() => {
    const fromServer = serverMessages.map((msg) => ({
      ...msg,
      isOwn: Boolean((msg as { isOwnMessage?: boolean }).isOwnMessage),
    }))
    const fromPending = pendingItems.map((msg) => ({
      ...msg,
      isOwn: true,
    }))
    return [...fromServer, ...fromPending]
  }, [serverMessages, pendingItems])

  useEffect(() => {
    if (displayed.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true })
      })
    }
  }, [displayed.length])

  if (isCheckInLoading || (isCheckedInHere && result === undefined)) {
    return (
      <View
        style={{
          minHeight: 220,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color="#F11A23" />
      </View>
    )
  }

  if (!isCheckedInHere) {
    return (
      <View
        style={{
          minHeight: 220,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 8,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 22,
            backgroundColor: '#1F1F1F',
          }}
        >
          <Lock color="#8B98A5" size={18} />
        </View>
        <Text
          style={{
            color: '#E7E9EA',
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          Check in to join this spot chat
        </Text>
        <Text
          style={{
            color: '#8B98A5',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          Spot chat is only available while you're actively checked in.
        </Text>
      </View>
    )
  }

  const handleOptimisticSendStart = (payload: {
    content: string
    format: 'text' | 'image'
    mediaUrl?: string
    isAnonymous?: boolean
  }) => {
    const optimisticKey = `spot:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2, 8)}`
    addPendingItem(
      {
        optimisticKey,
        _id: optimisticKey as unknown as Id<'spotMessages'>,
        content: payload.content,
        format: payload.format,
        mediaUrl: payload.mediaUrl,
        sentAt: Date.now(),
        isAnonymous: payload.isAnonymous,
        isOwnMessage: true,
        sender: {
          _id: currentUserId,
          name: 'You',
        },
        optimisticStatus: 'sending',
      },
      'append',
    )
    return optimisticKey
  }

  const handleOptimisticSendSuccess = (
    optimisticKey: string,
    messageId: Id<'spotMessages'>,
  ) => {
    markPendingItemResolved(optimisticKey, {
      resolvedMessageId: messageId,
      optimisticStatus: 'sent',
    })
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, minHeight: 340 }}
    >
      <FlatList
        ref={listRef}
        data={displayed}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <SpotChatMessage
            message={item}
            currentUserId={currentUserId}
            isOwn={item.isOwn}
          />
        )}
        ListEmptyComponent={
          <View
            style={{
              minHeight: 180,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <MessageCircle color="#71767B" size={28} />
            <Text style={{ color: '#E7E9EA', fontSize: 13 }}>
              No messages yet
            </Text>
            <Text style={{ color: '#71767B', fontSize: 11 }}>
              Be the first to chat about this spot!
            </Text>
          </View>
        }
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: false })
        }
        keyboardShouldPersistTaps="handled"
      />
      <SpotChatComposer
        spotId={spotId}
        currentUserId={currentUserId}
        isAnonymous={isAnonymousAtSpot}
        onOptimisticSendStart={handleOptimisticSendStart}
        onOptimisticSendSuccess={handleOptimisticSendSuccess}
        onOptimisticSendError={removePendingItem}
      />
    </KeyboardAvoidingView>
  )
}
