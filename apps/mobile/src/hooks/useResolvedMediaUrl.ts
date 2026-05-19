import { useAction } from 'convex/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/src/lib/convexApi'

const AUTHORIZED_MEDIA_URL_TTL_MS = 4 * 60 * 1000
const authorizedMediaUrlCache = new Map<
  string,
  { url: string; expiresAt: number }
>()

function extractMediaKey(url: string): string | null {
  if (url.startsWith('/api/media')) {
    const query = url.split('?')[1] ?? ''
    return new URLSearchParams(query).get('key')
  }

  try {
    const parsed = new URL(url)
    if (parsed.pathname !== '/api/media') return null
    return parsed.searchParams.get('key')
  } catch {
    return null
  }
}

export function useResolvedMediaUrl(url?: string | null) {
  const getAuthorizedDownloadUrl = useAction(api.r2.getAuthorizedDownloadUrl)
  const mediaKey = useMemo(() => (url ? extractMediaKey(url) : null), [url])
  const activeMediaKeyRef = useRef<string | null>(null)
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(() => {
    if (!url) return null
    if (!mediaKey) return url

    const cached = authorizedMediaUrlCache.get(mediaKey)
    if (cached && cached.expiresAt > Date.now()) return cached.url

    return null
  })

  useEffect(() => {
    let cancelled = false
    const previousMediaKey = activeMediaKeyRef.current
    activeMediaKeyRef.current = mediaKey

    if (!url) {
      setResolvedUrl(null)
      return
    }

    if (!mediaKey) {
      setResolvedUrl(url)
      return
    }

    const cached = authorizedMediaUrlCache.get(mediaKey)
    if (cached && cached.expiresAt > Date.now()) {
      setResolvedUrl(cached.url)
      return
    }

    setResolvedUrl((currentUrl) =>
      previousMediaKey === mediaKey ? currentUrl : null,
    )
    void getAuthorizedDownloadUrl({ key: mediaKey, expiresIn: 300 })
      .then((downloadUrl) => {
        authorizedMediaUrlCache.set(mediaKey, {
          url: downloadUrl,
          expiresAt: Date.now() + AUTHORIZED_MEDIA_URL_TTL_MS,
        })
        if (!cancelled) setResolvedUrl(downloadUrl)
      })
      .catch(() => {
        if (!cancelled) setResolvedUrl(null)
      })

    return () => {
      cancelled = true
    }
  }, [getAuthorizedDownloadUrl, mediaKey, url])

  return resolvedUrl
}
