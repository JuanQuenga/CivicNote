import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as AuthSession from 'expo-auth-session'
import * as SecureStore from 'expo-secure-store'
import * as WebBrowser from 'expo-web-browser'
import { api } from '@/src/lib/convexApi'
import { convex } from './convexClient'
import {
  WORKOS_API_BASE_URL,
  WORKOS_CLIENT_ID,
  WORKOS_REDIRECT_URI,
} from './env'
import {
  clearStoredReferralCode,
  getStoredReferralCode,
} from './referralStorage'
import type { ReactNode } from 'react'

WebBrowser.maybeCompleteAuthSession()

const SESSION_STORAGE_KEY = 'civic-research-hub.mobile.workos.session.v1'
const AUTHORIZATION_ENDPOINT = `${WORKOS_API_BASE_URL}/user_management/authorize`
const AUTHENTICATE_ENDPOINT = `${WORKOS_API_BASE_URL}/user_management/authenticate`
const LOGOUT_ENDPOINT = `${WORKOS_API_BASE_URL}/user_management/sessions/logout`
const TOKEN_REFRESH_WINDOW_MS = 60_000

type WorkOSUser = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  profilePictureUrl: string | null
}

type AuthSessionData = {
  accessToken: string
  refreshToken: string | null
  user: WorkOSUser
  expiresAt: number | null
  sessionId: string | null
}

type WorkOSAuthContextValue = {
  error: string | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  signUp: () => Promise<void>
  user: WorkOSUser | null
  getAccessToken: () => Promise<string | null>
}

type WorkOSTokenResponse = {
  access_token?: string
  accessToken?: string
  refresh_token?: string
  refreshToken?: string
  user?: {
    id: string
    email: string
    first_name?: string | null
    firstName?: string | null
    last_name?: string | null
    lastName?: string | null
    profile_picture_url?: string | null
    profilePictureUrl?: string | null
  }
}

const WorkOSAuthContext = createContext<WorkOSAuthContextValue | null>(null)

const getDefaultRedirectUri = () =>
  AuthSession.makeRedirectUri({
    native: 'civicresearchhub://auth/callback',
    scheme: 'civicresearchhub',
    path: 'auth/callback',
  })

const decodeJwtClaims = (
  token: string,
): { exp?: number; sid?: string } | null => {
  const parts = token.split('.')
  if (parts.length < 2) return null

  const payload = parts[1]
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  const base64 = `${normalized}${padding}`

  if (typeof globalThis.atob !== 'function') return null

  try {
    return JSON.parse(globalThis.atob(base64)) as { exp?: number; sid?: string }
  } catch {
    return null
  }
}

const toAuthSession = (
  response: WorkOSTokenResponse,
  previousUser: WorkOSUser | null = null,
): AuthSessionData => {
  const accessToken = response.access_token ?? response.accessToken
  if (!accessToken) {
    throw new Error('WorkOS response did not include an access token')
  }

  const user = response.user
    ? {
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.first_name ?? response.user.firstName ?? null,
        lastName: response.user.last_name ?? response.user.lastName ?? null,
        profilePictureUrl:
          response.user.profile_picture_url ??
          response.user.profilePictureUrl ??
          null,
      }
    : previousUser

  if (!user) {
    throw new Error('WorkOS response did not include user data')
  }

  const claims = decodeJwtClaims(accessToken)

  return {
    accessToken,
    refreshToken: response.refresh_token ?? response.refreshToken ?? null,
    user,
    expiresAt: claims?.exp ? claims.exp * 1000 : null,
    sessionId: claims?.sid ?? null,
  }
}

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as {
      message?: string
      error?: string
    }
    return payload.message ?? payload.error ?? response.statusText
  } catch {
    return response.statusText
  }
}

const saveSession = async (session: AuthSessionData | null) => {
  if (session) {
    await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session))
    return
  }
  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY)
}

const loadSession = async (): Promise<AuthSessionData | null> => {
  const raw = await SecureStore.getItemAsync(SESSION_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSessionData
  } catch {
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY)
    return null
  }
}

async function authenticateWithCode(code: string, codeVerifier: string) {
  if (!WORKOS_CLIENT_ID) {
    throw new Error('Missing EXPO_PUBLIC_WORKOS_CLIENT_ID')
  }

  const response = await fetch(AUTHENTICATE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: WORKOS_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return (await response.json()) as WorkOSTokenResponse
}

async function refreshWithToken(refreshToken: string) {
  if (!WORKOS_CLIENT_ID) {
    throw new Error('Missing EXPO_PUBLIC_WORKOS_CLIENT_ID')
  }

  const response = await fetch(AUTHENTICATE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: WORKOS_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return (await response.json()) as WorkOSTokenResponse
}

async function syncConvexUser(session: AuthSessionData) {
  if (!convex) return

  const fullName =
    `${session.user.firstName ?? ''} ${session.user.lastName ?? ''}`.trim()
  const name = fullName.length > 0 ? fullName : session.user.email
  const referralCode = await getStoredReferralCode()

  await convex.mutation(api.members.syncUser, {
    email: session.user.email,
    name,
    imageUrl: session.user.profilePictureUrl ?? undefined,
    referralCode: referralCode ?? undefined,
  })
  if (referralCode) {
    await clearStoredReferralCode()
  }
}

function isSessionExpiring(session: AuthSessionData) {
  if (!session.expiresAt) return false
  return session.expiresAt - Date.now() < TOKEN_REFRESH_WINDOW_MS
}

export function WorkOSAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refreshPromiseRef = useRef<Promise<AuthSessionData | null> | null>(null)
  const syncedUsersRef = useRef<Set<string>>(new Set())

  const setSessionAndPersist = useCallback(
    async (nextSession: AuthSessionData | null) => {
      setSession(nextSession)
      await saveSession(nextSession)
    },
    [],
  )

  const refreshSession = useCallback(async () => {
    if (!session?.refreshToken) return session
    if (refreshPromiseRef.current) return refreshPromiseRef.current

    refreshPromiseRef.current = (async () => {
      const refreshed = await refreshWithToken(session.refreshToken!)
      const merged = toAuthSession(refreshed, session.user)
      await setSessionAndPersist(merged)
      return merged
    })()
      .catch(async (refreshError: unknown) => {
        await setSessionAndPersist(null)
        throw refreshError
      })
      .finally(() => {
        refreshPromiseRef.current = null
      })

    return refreshPromiseRef.current
  }, [session, setSessionAndPersist])

  const getAccessToken = useCallback(async () => {
    if (!session) return null
    if (isSessionExpiring(session) && session.refreshToken) {
      try {
        const refreshed = await refreshSession()
        return refreshed?.accessToken ?? null
      } catch {
        return null
      }
    }
    return session.accessToken
  }, [refreshSession, session])

  const runAuthFlow = useCallback(
    async (screenHint: 'sign-in' | 'sign-up') => {
      if (!WORKOS_CLIENT_ID) {
        throw new Error('Missing EXPO_PUBLIC_WORKOS_CLIENT_ID')
      }

      const request = new AuthSession.AuthRequest({
        clientId: WORKOS_CLIENT_ID,
        redirectUri: WORKOS_REDIRECT_URI ?? getDefaultRedirectUri(),
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: {
          provider: 'authkit',
          screen_hint: screenHint,
        },
      })

      const result = await request.promptAsync({
        authorizationEndpoint: AUTHORIZATION_ENDPOINT,
      })

      if (result.type !== 'success') {
        throw new Error('Authentication was canceled')
      }

      const code = result.params.code
      const codeVerifier = request.codeVerifier

      if (!code || !codeVerifier) {
        throw new Error('Missing authorization code or PKCE verifier')
      }

      const authenticated = await authenticateWithCode(code, codeVerifier)
      const nextSession = toAuthSession(authenticated)
      await setSessionAndPersist(nextSession)
      await syncConvexUser(nextSession)
      syncedUsersRef.current.add(nextSession.user.id)
    },
    [setSessionAndPersist],
  )

  const signIn = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      await runAuthFlow('sign-in')
    } catch (authError) {
      const message =
        authError instanceof Error ? authError.message : 'Sign in failed'
      setError(message)
      throw authError
    } finally {
      setIsLoading(false)
    }
  }, [runAuthFlow])

  const signUp = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      await runAuthFlow('sign-up')
    } catch (authError) {
      const message =
        authError instanceof Error ? authError.message : 'Sign up failed'
      setError(message)
      throw authError
    } finally {
      setIsLoading(false)
    }
  }, [runAuthFlow])

  const signOut = useCallback(async () => {
    setError(null)
    if (session?.sessionId) {
      const returnTo = WORKOS_REDIRECT_URI ?? getDefaultRedirectUri()
      const url = `${LOGOUT_ENDPOINT}?session_id=${encodeURIComponent(session.sessionId)}&return_to=${encodeURIComponent(returnTo)}`
      try {
        await WebBrowser.openAuthSessionAsync(url, returnTo)
      } catch {
        // Best effort only: always clear local session.
      }
    }
    await setSessionAndPersist(null)
  }, [session?.sessionId, setSessionAndPersist])

  useEffect(() => {
    let canceled = false

    const bootstrap = async () => {
      try {
        const storedSession = await loadSession()
        if (canceled) return

        if (!storedSession) {
          setSession(null)
          return
        }

        setSession(storedSession)

        if (isSessionExpiring(storedSession) && storedSession.refreshToken) {
          try {
            const refreshed = await refreshWithToken(storedSession.refreshToken)
            const merged = toAuthSession(refreshed, storedSession.user)
            await setSessionAndPersist(merged)
          } catch {
            await setSessionAndPersist(null)
          }
        }
      } finally {
        if (!canceled) setIsLoading(false)
      }
    }

    void bootstrap()

    return () => {
      canceled = true
    }
  }, [setSessionAndPersist])

  useEffect(() => {
    if (!session || !convex) return
    if (syncedUsersRef.current.has(session.user.id)) return

    void syncConvexUser(session)
      .then(() => {
        syncedUsersRef.current.add(session.user.id)
      })
      .catch(() => {
        // If sync fails, we'll retry on next app start/sign-in.
      })
  }, [session])

  const value = useMemo<WorkOSAuthContextValue>(
    () => ({
      error,
      isAuthenticated: !!session,
      isLoading,
      signIn,
      signOut,
      signUp,
      user: session?.user ?? null,
      getAccessToken,
    }),
    [error, getAccessToken, isLoading, session, signIn, signOut, signUp],
  )

  return (
    <WorkOSAuthContext.Provider value={value}>
      {children}
    </WorkOSAuthContext.Provider>
  )
}

export function useWorkOSAuth() {
  const context = useContext(WorkOSAuthContext)
  if (!context) {
    throw new Error('useWorkOSAuth must be used within WorkOSAuthProvider')
  }
  return context
}

export function useWorkOSAuthForConvex() {
  const auth = useWorkOSAuth()
  const fetchAccessToken = useCallback(
    async () => auth.getAccessToken(),
    [auth.getAccessToken],
  )

  return useMemo(
    () => ({
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
      fetchAccessToken,
    }),
    [auth.isAuthenticated, auth.isLoading, fetchAccessToken],
  )
}
