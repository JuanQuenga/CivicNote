import { useAction } from 'convex/react'
import { useCallback, useState } from 'react'
import { api } from '@/src/lib/convexApi'
import type { Id } from '@/src/lib/convexApi'

type Folder = 'messages' | 'feed' | 'profiles' | 'albums' | 'voice' | 'spots'

interface UploadResult {
  key: string
  url: string
}

interface UseR2UploadReturn {
  upload: (file: Blob, folder: Folder) => Promise<UploadResult>
  isUploading: boolean
  error: string | null
}

const CONTENT_TYPE_OVERRIDES: Record<string, string> = {
  'audio/x-m4a': 'audio/mp4',
  'audio/m4a': 'audio/mp4',
  'audio/x-mp4': 'audio/mp4',
}

function normalizeContentType(rawType: string | undefined): string {
  const baseType = (rawType || 'application/octet-stream')
    .split(';')[0]
    .trim()
    .toLowerCase()

  return CONTENT_TYPE_OVERRIDES[baseType] ?? baseType
}

export function useR2Upload(userId?: Id<'users'>): UseR2UploadReturn {
  const getUploadUrl = useAction(api.r2.getUploadUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (file: Blob, folder: Folder): Promise<UploadResult> => {
      if (!userId) {
        throw new Error('User must be authenticated to upload files')
      }

      setIsUploading(true)
      setError(null)

      try {
        const contentType = normalizeContentType(file.type)

        const { uploadUrl, key, publicUrl } = await getUploadUrl({
          contentType,
          fileSize: file.size,
          folder,
        })

        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': contentType,
          },
        })

        if (!response.ok) {
          throw new Error(
            `Upload failed: ${response.status} ${response.statusText}`,
          )
        }

        return { key, url: publicUrl }
      } catch (uploadError) {
        const message =
          uploadError instanceof Error ? uploadError.message : 'Upload failed'
        setError(message)
        throw uploadError
      } finally {
        setIsUploading(false)
      }
    },
    [getUploadUrl, userId],
  )

  return {
    upload,
    isUploading,
    error,
  }
}
