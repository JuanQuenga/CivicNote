import { useMemo, useState } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, ImagePlus, Lock, Plus, Trash2 } from 'lucide-react-native'
import { api } from '@/src/lib/convexApi'
import { AuthGate } from '../../src/components/auth/AuthGate'
import { MobileTabbedPager } from '../../src/components/navigation/MobileTabbedPager'
import { Avatar } from '../../src/components/ui/Avatar'
import { ResolvedImage } from '../../src/components/ui/ResolvedImage'
import { useCurrentUser } from '../../src/hooks/useCurrentUser'
import { useR2Upload } from '../../src/hooks/useR2Upload'
import type { Id } from '@/src/lib/convexApi'

type PhotosTab = 'received' | 'uploads' | 'albums'

type Album = {
  _id: Id<'albums'>
  name: string
  visibility?: 'public' | 'private'
  isDefault?: boolean
  photoCount?: number
  coverUrl?: string | null
  shareCount?: number
}

type AlbumPhoto = {
  _id: Id<'photos'>
  url: string | null
  caption?: string
  r2Key?: string
  r2Url?: string
  isNsfw?: boolean
}

type SharedAlbum = {
  albumId: Id<'albums'>
  albumName: string
  photoCount: number
  previewUrl: string | null
  owner: {
    _id: Id<'users'>
    name: string
    imageUrl?: string
  }
}

const TABS: Array<{ value: PhotosTab; label: string }> = [
  { value: 'received', label: 'Received' },
  { value: 'uploads', label: 'Uploads' },
  { value: 'albums', label: 'Albums' },
]

function getPhotoColumns<T>(items: Array<T>) {
  return items.map((item, index) => ({ item, index }))
}

export default function PhotosScreen() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useCurrentUser()
  const { upload, isUploading } = useR2Upload(user?._id)

  const [activeTab, setActiveTab] = useState<PhotosTab>('received')
  const [selectedAlbumId, setSelectedAlbumId] = useState<Id<'albums'> | null>(
    null,
  )
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null)
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false)
  const [isMutatingPhoto, setIsMutatingPhoto] = useState(false)

  const albums = useQuery(api.albums.listMyAlbums, user?._id ? {} : 'skip') as
    | Array<Album>
    | undefined

  const uploadedPhotos = useQuery(
    api.albums.getMyAlbumPhotos,
    user?._id ? {} : 'skip',
  ) as Array<AlbumPhoto> | undefined

  const sharedAlbums = useQuery(
    api.albums.getAlbumsSharedWithMe,
    user?._id ? {} : 'skip',
  ) as Array<SharedAlbum> | undefined

  const selectedAlbum = useMemo(
    () => albums?.find((album) => album._id === selectedAlbumId) ?? null,
    [albums, selectedAlbumId],
  )

  const albumPhotos = useQuery(
    api.albums.getAlbumPhotos,
    selectedAlbumId && user?._id ? { albumId: selectedAlbumId } : 'skip',
  ) as Array<AlbumPhoto> | null | undefined

  const albumStatus = useQuery(
    api.albums.getAlbumStatus,
    user?._id && selectedAlbumId
      ? { albumId: selectedAlbumId }
      : user?._id
        ? {}
        : 'skip',
  )

  const createDefaultAlbum = useMutation(api.albums.getOrCreateDefaultAlbum)
  const createAlbum = useAction(api.albums.createAlbum)
  const addPhotoToAlbum = useAction(api.albums.addPhotoToAlbum)
  const removePhoto = useMutation(api.albums.removePhotoFromAlbum)
  const deleteAlbum = useMutation(api.albums.deleteAlbum)

  const defaultAlbum = useMemo(
    () => albums?.find((album) => album.isDefault) ?? albums?.[0] ?? null,
    [albums],
  )

  const uploadTargetAlbumId = selectedAlbumId ?? defaultAlbum?._id ?? null
  const isAtPhotoLimit = albumStatus?.isAtPhotoLimit === true
  const canCreateAlbums = albumStatus?.canCreateAlbums !== false

  const handleEnsureDefaultAlbum = async () => {
    if (!user?._id) return null
    if (defaultAlbum?._id) return defaultAlbum._id
    return await createDefaultAlbum({})
  }

  const handleUploadPhoto = async () => {
    if (!user?._id || isUploading || isMutatingPhoto || isAtPhotoLimit) return

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Enable photo library access to upload album photos.',
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.88,
      allowsMultipleSelection: false,
    })

    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    const albumId = uploadTargetAlbumId ?? (await handleEnsureDefaultAlbum())
    if (!albumId) return

    try {
      setIsMutatingPhoto(true)
      const response = await fetch(asset.uri)
      const blob = await response.blob()
      const typedBlob =
        blob.type && blob.type !== 'application/octet-stream'
          ? blob
          : new Blob([blob], { type: asset.mimeType ?? 'image/jpeg' })
      const uploaded = await upload(typedBlob, 'albums')

      await addPhotoToAlbum({
        albumId,
        r2Key: uploaded.key,
        r2Url: uploaded.url,
        mediaType: 'image',
        mimeType: asset.mimeType,
        sizeBytes: asset.fileSize,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not upload photo'
      Alert.alert('Upload failed', message)
    } finally {
      setIsMutatingPhoto(false)
    }
  }

  const handleCreateAlbum = async () => {
    if (!user?._id || !newAlbumName.trim() || isCreatingAlbum) return
    try {
      setIsCreatingAlbum(true)
      const albumId = await createAlbum({
        name: newAlbumName.trim(),
        visibility: 'private',
      })
      setNewAlbumName('')
      setShowCreateAlbum(false)
      setActiveTab('albums')
      setSelectedAlbumId(albumId)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not create album'
      Alert.alert('Album failed', message)
    } finally {
      setIsCreatingAlbum(false)
    }
  }

  const handleDeletePhoto = (photoId: Id<'photos'>) => {
    if (!user?._id || isMutatingPhoto) return
    Alert.alert('Delete photo?', 'This removes the photo from your album.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setIsMutatingPhoto(true)
          removePhoto({ photoId })
            .catch((error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : 'Could not delete photo'
              Alert.alert('Delete failed', message)
            })
            .finally(() => setIsMutatingPhoto(false))
        },
      },
    ])
  }

  const handleDeleteAlbum = () => {
    if (!user?._id || !selectedAlbum || selectedAlbum.isDefault) return
    Alert.alert('Delete album?', 'Photos in this album will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAlbum({ albumId: selectedAlbum._id })
            .then(() => setSelectedAlbumId(null))
            .catch((error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : 'Could not delete album'
              Alert.alert('Delete failed', message)
            })
        },
      },
    ])
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F11A23" />
      </SafeAreaView>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthGate title="Photos" description="Sign in to manage your albums." />
    )
  }

  const renderPhotoGrid = (
    photos: Array<AlbumPhoto> | null | undefined,
    canManage: boolean,
  ) => {
    if (photos === undefined) {
      return (
        <View className="items-center py-12">
          <ActivityIndicator color="#F11A23" />
        </View>
      )
    }

    if (!photos || photos.length === 0) {
      return (
        <View className="mx-4 mt-4 items-center rounded-2xl border border-border bg-card p-6">
          <ImagePlus color="#F11A23" size={32} />
          <Text className="mt-3 text-base font-semibold text-foreground">
            No photos yet
          </Text>
          <Text className="mt-1 text-center text-sm text-muted-foreground">
            Add photos to your private albums or open received albums here.
          </Text>
          {canManage ? (
            <Pressable
              className="mt-4 rounded-xl bg-primary px-4 py-3"
              disabled={isAtPhotoLimit}
              onPress={() => void handleUploadPhoto()}
            >
              <Text className="text-sm font-semibold text-primary-foreground">
                Add Photo
              </Text>
            </Pressable>
          ) : null}
        </View>
      )
    }

    return (
      <View className="mx-4 mt-4 flex-row flex-wrap gap-2">
        {canManage && !isAtPhotoLimit ? (
          <Pressable
            className="aspect-square flex-1 basis-[31%] items-center justify-center rounded-xl border border-dashed border-muted-foreground/40 bg-card"
            onPress={() => void handleUploadPhoto()}
          >
            <Plus color="#999999" size={24} />
            <Text className="mt-1 text-xs text-muted-foreground">Add</Text>
          </Pressable>
        ) : null}
        {getPhotoColumns(photos).map(({ item: photo }) => (
          <Pressable
            key={photo._id}
            className="aspect-square flex-1 basis-[31%] overflow-hidden rounded-xl bg-card"
            onPress={() => photo.url && setSelectedPhotoUrl(photo.url)}
          >
            {photo.url ? (
              <ResolvedImage
                uri={photo.url}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <View className="h-full w-full items-center justify-center bg-muted">
                <ImagePlus color="#999999" size={22} />
              </View>
            )}
            {photo.isNsfw ? (
              <View className="absolute inset-0 items-center justify-center bg-black/55">
                <Text className="rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                  NSFW
                </Text>
              </View>
            ) : null}
            {canManage ? (
              <Pressable
                className="absolute right-1.5 top-1.5 h-8 w-8 items-center justify-center rounded-full bg-black/70"
                onPress={() => handleDeletePhoto(photo._id)}
              >
                <Trash2 color="#FAFAFA" size={15} />
              </Pressable>
            ) : null}
          </Pressable>
        ))}
      </View>
    )
  }

  const renderReceived = () => {
    if (sharedAlbums === undefined) {
      return (
        <View className="items-center py-12">
          <ActivityIndicator color="#F11A23" />
        </View>
      )
    }

    if (sharedAlbums.length === 0) {
      return (
        <View className="mx-4 mt-4 rounded-2xl border border-border bg-card p-5">
          <Text className="text-base font-semibold text-foreground">
            No received albums yet
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Albums shared with you by other members will appear here.
          </Text>
        </View>
      )
    }

    return (
      <View className="mt-4 gap-3 px-4">
        {sharedAlbums.map((album) => (
          <Pressable
            key={album.albumId}
            className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3"
            onPress={() => setSelectedAlbumId(album.albumId)}
          >
            <View className="h-16 w-16 overflow-hidden rounded-xl bg-muted">
              {album.previewUrl ? (
                <ResolvedImage
                  uri={album.previewUrl}
                  contentFit="cover"
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Lock color="#999999" size={22} />
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                {album.albumName}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <Avatar
                  imageUrl={album.owner.imageUrl}
                  name={album.owner.name}
                  size="sm"
                />
                <Text className="text-sm text-muted-foreground">
                  {album.owner.name} · {album.photoCount} photos
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    )
  }

  const renderAlbums = () => {
    if (albums === undefined) {
      return (
        <View className="items-center py-12">
          <ActivityIndicator color="#F11A23" />
        </View>
      )
    }

    return (
      <View className="mt-4 px-4">
        <View className="mb-3 flex-row gap-3">
          <Pressable
            className={`flex-1 items-center rounded-xl px-4 py-3 ${
              canCreateAlbums ? 'bg-primary' : 'bg-primary/40'
            }`}
            disabled={!canCreateAlbums}
            onPress={() => setShowCreateAlbum(true)}
          >
            <Text className="text-sm font-semibold text-primary-foreground">
              New Album
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 items-center rounded-xl px-4 py-3 ${
              isAtPhotoLimit ? 'bg-primary/40' : 'bg-primary'
            }`}
            disabled={isAtPhotoLimit}
            onPress={() => void handleUploadPhoto()}
          >
            <Text className="text-sm font-semibold text-primary-foreground">
              Add Photo
            </Text>
          </Pressable>
        </View>

        <View className="gap-3">
          {albums.map((album) => (
            <Pressable
              key={album._id}
              className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3"
              onPress={() => setSelectedAlbumId(album._id)}
            >
              <View className="h-16 w-16 overflow-hidden rounded-xl bg-muted">
                {album.coverUrl ? (
                  <ResolvedImage
                    uri={album.coverUrl}
                    contentFit="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <ImagePlus color="#999999" size={22} />
                  </View>
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-semibold text-foreground">
                    {album.name}
                  </Text>
                  {album.visibility === 'private' ? (
                    <Lock color="#999999" size={14} />
                  ) : null}
                </View>
                <Text className="mt-1 text-sm text-muted-foreground">
                  {album.photoCount ?? 0} photos
                  {album.shareCount ? ` · ${album.shareCount} shared` : ''}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    )
  }

  const renderAlbumDetail = () => {
    const isOwned = albums?.some((album) => album._id === selectedAlbumId)
    const title = selectedAlbum?.name ?? 'Shared Album'

    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="flex-row items-center justify-between px-4 pt-3">
          <Pressable
            className="flex-row items-center gap-2"
            onPress={() => setSelectedAlbumId(null)}
          >
            <ArrowLeft color="#FAFAFA" size={20} />
            <Text className="text-base font-semibold text-foreground">
              {title}
            </Text>
          </Pressable>
          {isOwned && selectedAlbum && !selectedAlbum.isDefault ? (
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
              onPress={handleDeleteAlbum}
            >
              <Trash2 color="#FAFAFA" size={18} />
            </Pressable>
          ) : null}
        </View>
        {renderPhotoGrid(albumPhotos, isOwned === true)}
      </ScrollView>
    )
  }

  if (selectedAlbumId) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        {renderAlbumDetail()}
        <PhotoModal
          photoUrl={selectedPhotoUrl}
          onClose={() => setSelectedPhotoUrl(null)}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <MobileTabbedPager
        tabs={TABS}
        value={activeTab}
        onChange={(tab) => {
          setActiveTab(tab)
          setSelectedAlbumId(null)
        }}
        renderScene={(tab) => (
          <FlatList
            data={[tab]}
            keyExtractor={(item) => item}
            renderItem={() => {
              if (tab === 'received') return renderReceived()
              if (tab === 'uploads') {
                return renderPhotoGrid(uploadedPhotos, true)
              }
              return renderAlbums()
            }}
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      />

      {(isUploading || isMutatingPhoto) && (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <View className="rounded-2xl border border-border bg-card p-4">
            <ActivityIndicator color="#F11A23" />
            <Text className="mt-3 text-sm font-semibold text-foreground">
              Updating photos...
            </Text>
          </View>
        </View>
      )}

      <Modal
        visible={showCreateAlbum}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateAlbum(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl bg-background p-4">
            <Text className="text-lg font-semibold text-foreground">
              New Album
            </Text>
            <TextInput
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              placeholder="Album name"
              placeholderTextColor="#999999"
              className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
              maxLength={50}
              autoFocus
            />
            <View className="mt-4 flex-row gap-3">
              <Pressable
                className="flex-1 items-center rounded-xl border border-border bg-card px-4 py-3"
                onPress={() => setShowCreateAlbum(false)}
              >
                <Text className="text-sm font-semibold text-foreground">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 items-center rounded-xl px-4 py-3 ${
                  newAlbumName.trim() && !isCreatingAlbum
                    ? 'bg-primary'
                    : 'bg-primary/40'
                }`}
                disabled={!newAlbumName.trim() || isCreatingAlbum}
                onPress={() => void handleCreateAlbum()}
              >
                <Text className="text-sm font-semibold text-primary-foreground">
                  {isCreatingAlbum ? 'Creating...' : 'Create'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <PhotoModal
        photoUrl={selectedPhotoUrl}
        onClose={() => setSelectedPhotoUrl(null)}
      />
    </SafeAreaView>
  )
}

function PhotoModal({
  photoUrl,
  onClose,
}: {
  photoUrl: string | null
  onClose: () => void
}) {
  return (
    <Modal
      visible={!!photoUrl}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/95" onPress={onClose}>
        {photoUrl ? (
          <ResolvedImage
            uri={photoUrl}
            contentFit="contain"
            style={{ width: '100%', height: '100%' }}
          />
        ) : null}
      </Pressable>
    </Modal>
  )
}
