import { useCallback, useEffect, useState } from 'react'

interface OptimisticItem {
  optimisticKey: string
}

interface UseOptimisticThreadMessagesOptions<TItem> {
  initialItems?: Array<TItem>
  resetKey?: unknown
}

interface ReconcileOptions<TItem> {
  getResolvedId: (item: TItem) => string | undefined
}

const EMPTY_ITEMS: Array<never> = []

export function useOptimisticThreadMessages<TItem extends OptimisticItem>({
  initialItems,
  resetKey,
}: UseOptimisticThreadMessagesOptions<TItem> = {}) {
  const items = initialItems ?? (EMPTY_ITEMS as Array<TItem>)
  const [pendingItems, setPendingItems] = useState<Array<TItem>>(items)

  useEffect(() => {
    if (resetKey === undefined) return
    setPendingItems(items)
  }, [items, resetKey])

  const addPendingItem = useCallback(
    (item: TItem, placement: 'prepend' | 'append' = 'prepend') => {
      setPendingItems((current) =>
        placement === 'append' ? [...current, item] : [item, ...current],
      )
      return item.optimisticKey
    },
    [],
  )

  const markPendingItemResolved = useCallback(
    (optimisticKey: string, updates: Partial<TItem>) => {
      setPendingItems((current) =>
        current.map((item) =>
          item.optimisticKey === optimisticKey ? { ...item, ...updates } : item,
        ),
      )
    },
    [],
  )

  const removePendingItem = useCallback((optimisticKey: string) => {
    setPendingItems((current) =>
      current.filter((item) => item.optimisticKey !== optimisticKey),
    )
  }, [])

  const reconcilePendingItems = useCallback(
    (serverIds: Set<string>, { getResolvedId }: ReconcileOptions<TItem>) => {
      setPendingItems((current) => {
        const next = current.filter((item) => {
          const resolvedId = getResolvedId(item)
          return !resolvedId || !serverIds.has(resolvedId)
        })

        return next.length === current.length ? current : next
      })
    },
    [],
  )

  const clearPendingItems = useCallback(() => {
    setPendingItems([])
  }, [])

  return {
    pendingItems,
    setPendingItems,
    addPendingItem,
    markPendingItemResolved,
    removePendingItem,
    reconcilePendingItems,
    clearPendingItems,
  }
}
