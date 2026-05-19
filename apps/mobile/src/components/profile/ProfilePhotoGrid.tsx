import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from 'react-native'
import { useAction, useMutation, useQuery } from 'convex/react'
import * as ImagePicker from 'expo-image-picker'
import {
  ArrowRightLeft,
  ImagePlus,
  SquareUserRound,
  Trash2,
} from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import type { Id } from '@/src/lib/convexApi'
import { ResolvedImage } from '../ui/ResolvedImage'
import { useR2Upload } from '../../hooks/useR2Upload'

const MAX_PHOTOS = 6
const FREE_LIMIT = 10 * 1024 * 1024 // 10MB
const ULTRA_LIMIT = 50 * 1024 * 1024 // 50MB

interface ProfilePhotoGridProps {
  userId: Id<'users'>
  isUltra: boolean
}

interface PhotoMeta {
  url: string | null
  r2Key: string
  isPrimary?: boolean
  isNsfw?: boolean
}

export function ProfilePhotoGrid({ userId, isUltra }: ProfilePhotoGridProps) {
  const profilePhotos = useQuery(
    api.members.getMyProfilePhotos,
    userId ? {} : 'skip',
  ) as Array<PhotoMeta> | undefined
  const { upload, isUploading } = useR2Upload(userId)
  const addProfilePhoto = useAction(api.members.addProfilePhoto)
  const removeProfilePhoto = useMutation(api.members.removeProfilePhoto)
  const reorderProfilePhotos = useMutation(api.members.reorderProfilePhotos)

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isMutating, setIsMutating] = useState(false)

  const photoCount = profilePhotos?.length ?? 0
  const canAddMore = photoCount < MAX_PHOTOS
  const maxSize = isUltra ? ULTRA_LIMIT : FREE_LIMIT
  const maxSizeMB = isUltra ? 50 : 10

  const handleAddPhoto = useCallback(async () => {
    if (!canAddMore || isUploading || isMutating) return

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Enable photo library access to upload profile photos.',
      )
      return
    }

    const remainingSlots = MAX_PHOTOS - photoCount
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsMultipleSelection: remainingSlots > 1,
      selectionLimit: remainingSlots,
    })

    if (result.canceled || !result.assets.length) return

    setIsMutating(true)
    try {
      for (const asset of result.assets.slice(0, remainingSlots)) {
        if (asset.fileSize && asset.fileSize > maxSize) {
          Alert.alert(
            'Photo too large',
            `Max size is ${maxSizeMB}MB.${isUltra ? '' : ' Upgrade to Ultra for 50MB uploads!'}`,
          )
          continue
        }
        const response = await fetch(asset.uri)
        const blob = await response.blob()
        const typedBlob =
          blob.type && blob.type !== 'application/octet-stream'
            ? blob
            : new Blob([blob], { type: asset.mimeType ?? 'image/jpeg' })
        const uploaded = await upload(typedBlob, 'profiles')
        await addProfilePhoto({ r2Key: uploaded.key, r2Url: uploaded.url })
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not upload photo'
      Alert.alert('Upload failed', message)
    } finally {
      setIsMutating(false)
    }
  }, [
    addProfilePhoto,
    canAddMore,
    isMutating,
    isUltra,
    isUploading,
    maxSize,
    maxSizeMB,
    photoCount,
    upload,
  ])

  const handleDeletePhoto = useCallback(
    (r2Key: string) => {
      Alert.alert(
        'Delete photo?',
        'This will remove this photo from your profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              setIsMutating(true)
              removeProfilePhoto({ r2Key })
                .then(() => setSelectedIndex(null))
                .catch((error) => {
                  const message =
                    error instanceof Error
                      ? error.message
                      : 'Could not delete photo'
                  Alert.alert('Delete failed', message)
                })
                .finally(() => setIsMutating(false))
            },
          },
        ],
      )
    },
    [removeProfilePhoto],
  )

  const handleSwap = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!profilePhotos || fromIndex === toIndex) return

      const photoIdentifiers = profilePhotos.map((p) => ({ r2Key: p.r2Key }))
      const temp = photoIdentifiers[fromIndex]
      photoIdentifiers[fromIndex] = photoIdentifiers[toIndex]
      photoIdentifiers[toIndex] = temp

      try {
        await reorderProfilePhotos({ photoIdentifiers })
      } catch {
        Alert.alert('Reorder failed', 'Could not reorder photos.')
      }
    },
    [profilePhotos, reorderProfilePhotos],
  )

  const handlePhotoTap = (index: number) => {
    const photo = profilePhotos?.[index]
    if (!photo) return

    if (selectedIndex === null) {
      setSelectedIndex(index)
    } else if (selectedIndex === index) {
      setSelectedIndex(null)
    } else {
      void handleSwap(selectedIndex, index)
      setSelectedIndex(null)
    }
  }

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => ({
    index: i,
    photo: profilePhotos?.[i],
  }))

  return (
    <View className="gap-2">
      <View className="h-7 flex-row items-center justify-between px-1">
        {selectedIndex !== null ? (
          <>
            <Text className="text-xs font-medium text-primary">
              Tap another photo to swap
            </Text>
            <Pressable onPress={() => setSelectedIndex(null)} hitSlop={8}>
              <Text className="text-xs font-medium text-muted-foreground">
                Cancel
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <View className="flex-row items-center gap-1">
              <SquareUserRound color="#F11A23" size={14} />
              <Text className="text-xs font-medium text-primary">
                Main Photo
              </Text>
            </View>
            {photoCount > 1 ? (
              <Text className="text-xs text-muted-foreground">
                Tap to reorder
              </Text>
            ) : null}
          </>
        )}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {slots.map(({ index, photo }) => {
          const isSelected = selectedIndex === index
          const isSwapTarget = selectedIndex !== null && selectedIndex !== index
          const isMainPhoto = photo?.isPrimary

          return (
            <View
              key={index}
              className="basis-[31.5%]"
              style={{ aspectRatio: 3 / 4 }}
            >
              {photo ? (
                <Pressable
                  onPress={() => handlePhotoTap(index)}
                  className="relative h-full w-full overflow-hidden rounded-xl bg-muted"
                  style={
                    isMainPhoto
                      ? {
                          borderWidth: 2,
                          borderColor: '#F11A23',
                        }
                      : isSelected
                        ? {
                            borderWidth: 2,
                            borderColor: '#FFFFFF',
                          }
                        : undefined
                  }
                >
                  {photo.url ? (
                    <ResolvedImage
                      uri={photo.url}
                      contentFit="cover"
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <View className="h-full w-full items-center justify-center">
                      <ImagePlus color="#999999" size={22} />
                    </View>
                  )}

                  {photo.isNsfw ? (
                    <View className="absolute inset-0 items-center justify-center bg-black/40">
                      <View className="rounded-full bg-black/70 px-2.5 py-1">
                        <Text className="text-[11px] font-semibold text-white">
                          NSFW blurred
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {isSelected ? (
                    <View className="absolute inset-0 items-center justify-center bg-black/40">
                      <View className="rounded-full bg-white px-3 py-1.5">
                        <Text className="text-xs font-semibold text-black">
                          Selected
                        </Text>
                      </View>
                      <Pressable
                        className="mt-2 flex-row items-center gap-1 rounded-full bg-destructive px-3 py-1.5"
                        onPress={() => handleDeletePhoto(photo.r2Key)}
                      >
                        <Trash2 color="#ffffff" size={13} />
                        <Text className="text-xs font-semibold text-white">
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {isSwapTarget ? (
                    <View className="absolute inset-0 items-center justify-center bg-black/40">
                      <ArrowRightLeft color="#ffffff" size={20} />
                      <Text className="mt-1 text-xs font-medium text-white">
                        Tap to swap
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              ) : (
                <Pressable
                  onPress={canAddMore ? () => void handleAddPhoto() : undefined}
                  disabled={!canAddMore || isUploading || isMutating}
                  className="h-full w-full items-center justify-center rounded-xl bg-card"
                  style={{
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderStyle: 'dashed',
                  }}
                >
                  <ImagePlus color="#999999" size={26} />
                  <Text className="mt-1 text-xs font-medium text-muted-foreground">
                    Add Photo
                  </Text>
                </Pressable>
              )}
            </View>
          )
        })}
      </View>

      {isUploading || isMutating ? (
        <View className="flex-row items-center justify-center gap-2 pt-2">
          <ActivityIndicator color="#F11A23" size="small" />
          <Text className="text-xs text-muted-foreground">Updating photos…</Text>
        </View>
      ) : null}
    </View>
  )
}
