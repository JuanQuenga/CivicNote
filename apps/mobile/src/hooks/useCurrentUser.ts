import { useMutation, useQuery } from 'convex/react'
import { useEffect } from 'react'
import { api } from '@/src/lib/convexApi'
import {
  clearStoredReferralCode,
  getStoredReferralCode,
} from '../lib/referralStorage'
import { useWorkOSAuth } from '../lib/workosAuth'

const syncedWorkosIds = new Set<string>()
const syncingWorkosIds = new Set<string>()
const syncFailState = new Map<string, { count: number; lastFailedAt: number }>()
const MAX_SYNC_RETRIES = 3
const SYNC_RETRY_COOLDOWN_MS = 15_000

export function useCurrentUser() {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    user: workosUser,
  } = useWorkOSAuth()
  const syncUser = useMutation(api.members.syncUser)
  const convexUser = useQuery(
    api.members.getCurrentUser,
    workosUser?.id ? {} : 'skip',
  )

  useEffect(() => {
    if (!isAuthenticated || !workosUser) return
    if (convexUser) return

    const workosId = workosUser.id
    if (syncedWorkosIds.has(workosId) || syncingWorkosIds.has(workosId)) {
      return
    }

    const failState = syncFailState.get(workosId)
    const failCount = failState?.count ?? 0
    const lastFailedAt = failState?.lastFailedAt ?? 0
    const isCooldownElapsed =
      Date.now() - lastFailedAt >= SYNC_RETRY_COOLDOWN_MS

    if (failCount >= MAX_SYNC_RETRIES && !isCooldownElapsed) return
    if (failCount >= MAX_SYNC_RETRIES && isCooldownElapsed) {
      syncFailState.delete(workosId)
    }

    syncingWorkosIds.add(workosId)

    void getStoredReferralCode()
      .then((referralCode) =>
        syncUser({
          email: workosUser.email,
          name:
            `${workosUser.firstName ?? ''} ${workosUser.lastName ?? ''}`.trim() ||
            workosUser.email,
          imageUrl: workosUser.profilePictureUrl ?? undefined,
          referralCode: referralCode ?? undefined,
        }).then(() => referralCode),
      )
      .then(() => {
        syncedWorkosIds.add(workosId)
        syncFailState.delete(workosId)
        void clearStoredReferralCode()
      })
      .catch(() => {
        const prev = syncFailState.get(workosId)
        syncFailState.set(workosId, {
          count: (prev?.count ?? 0) + 1,
          lastFailedAt: Date.now(),
        })
      })
      .finally(() => {
        syncingWorkosIds.delete(workosId)
      })
  }, [convexUser, isAuthenticated, syncUser, workosUser])

  const isLoading =
    isAuthLoading || (isAuthenticated && convexUser === undefined)

  return {
    isAuthenticated,
    isLoading,
    user: convexUser ?? null,
    workosUser,
  }
}
