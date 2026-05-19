import { Image } from 'expo-image'
import { useResolvedMediaUrl } from '../../hooks/useResolvedMediaUrl'
import type { ImageProps } from 'expo-image'

type ResolvedImageProps = Omit<ImageProps, 'source'> & {
  uri?: string | null
}

export function ResolvedImage({ uri, ...props }: ResolvedImageProps) {
  const resolvedUri = useResolvedMediaUrl(uri)

  if (!resolvedUri) return null

  return <Image {...props} source={{ uri: resolvedUri }} />
}
