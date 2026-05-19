import { useCallback, useRef, useState } from 'react'
import { useAction } from 'convex/react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { api } from '@/src/lib/convexApi'
import { useR2Upload } from '../../hooks/useR2Upload'
import { MessageComposer } from '../messaging/MessageComposer'
import type { TextInput } from 'react-native'
import type { Id } from '@/src/lib/convexApi'

interface PendingMedia {
  uri: string
  mimeType?: string
}

interface OptimisticPayload {
  content: string
  format: 'text' | 'image'
  mediaUrl?: string
  isAnonymous?: boolean
}

interface Props {
  spotId: Id<'spots'>
  currentUserId: Id<'users'>
  isAnonymous?: boolean
  onOptimisticSendStart?: (payload: OptimisticPayload) => string
  onOptimisticSendSuccess?: (
    optimisticKey: string,
    messageId: Id<'spotMessages'>,
  ) => void
  onOptimisticSendError?: (optimisticKey: string) => void
}

export function SpotChatComposer({
  spotId,
  currentUserId,
  isAnonymous,
  onOptimisticSendStart,
  onOptimisticSendSuccess,
  onOptimisticSendError,
}: Props) {
  const [message, setMessage] = useState('')
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null)
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const sendSpotMessage = useAction(api.spotChat.sendSpotMessage)
  const { upload, isUploading } = useR2Upload(currentUserId)

  const disabled = isSending || isUploading
  const canSubmit = Boolean(message.trim() || pendingMedia) && !disabled

  const pickPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Enable photo library access to attach a photo.',
      )
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.88,
      allowsMultipleSelection: false,
    })
    if (!result.canceled && result.assets[0]) {
      setPendingMedia({
        uri: result.assets[0].uri,
        mimeType: result.assets[0].mimeType,
      })
    }
  }, [])

  const handleSend = useCallback(async () => {
    if (!canSubmit) return

    if (pendingMedia) {
      let optimisticKey: string | null = null
      try {
        setIsSending(true)
        optimisticKey =
          onOptimisticSendStart?.({
            content: '[Photo]',
            format: 'image',
            mediaUrl: pendingMedia.uri,
            ...(isAnonymous ? { isAnonymous: true } : {}),
          }) ?? null

        const response = await fetch(pendingMedia.uri)
        const blob = await response.blob()
        const typedBlob =
          blob.type && blob.type !== 'application/octet-stream'
            ? blob
            : new Blob([blob], {
                type: pendingMedia.mimeType ?? 'image/jpeg',
              })
        const uploaded = await upload(typedBlob, 'spots')

        const messageId = await sendSpotMessage({
          spotId,
          content: '[Photo]',
          format: 'image',
          mediaUrl: uploaded.url,
          r2Key: uploaded.key,
          cleanupOnFailure: true,
          ...(isAnonymous ? { isAnonymous: true } : {}),
        })

        if (optimisticKey) onOptimisticSendSuccess?.(optimisticKey, messageId)
        setPendingMedia(null)
        setMessage('')
      } catch (error) {
        if (optimisticKey) onOptimisticSendError?.(optimisticKey)
        Alert.alert(
          'Send failed',
          error instanceof Error ? error.message : 'Could not send photo',
        )
      } finally {
        setIsSending(false)
      }
      return
    }

    const content = message.trim()
    if (!content) return

    const optimisticKey =
      onOptimisticSendStart?.({
        content,
        format: 'text',
        ...(isAnonymous ? { isAnonymous: true } : {}),
      }) ?? null

    try {
      setIsSending(true)
      const messageId = await sendSpotMessage({
        spotId,
        content,
        format: 'text',
        ...(isAnonymous ? { isAnonymous: true } : {}),
      })
      if (optimisticKey) onOptimisticSendSuccess?.(optimisticKey, messageId)
      setMessage('')
      inputRef.current?.focus()
    } catch (error) {
      if (optimisticKey) onOptimisticSendError?.(optimisticKey)
      Alert.alert(
        'Send failed',
        error instanceof Error ? error.message : 'Could not send message',
      )
    } finally {
      setIsSending(false)
    }
  }, [
    canSubmit,
    pendingMedia,
    message,
    isAnonymous,
    onOptimisticSendStart,
    onOptimisticSendSuccess,
    onOptimisticSendError,
    sendSpotMessage,
    spotId,
    upload,
  ])

  return (
    <MessageComposer
      value={message}
      onChangeText={setMessage}
      onSend={() => void handleSend()}
      placeholder="Message..."
      canSubmit={canSubmit}
      disabled={disabled}
      inputRef={inputRef}
      pendingMedia={pendingMedia}
      onPressLeadingControl={() => void pickPhoto()}
      onRemoveMedia={() => setPendingMedia(null)}
      anonymous={isAnonymous}
    />
  )
}
