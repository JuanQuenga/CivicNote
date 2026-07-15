import Constants from "expo-constants"
import * as Device from "expo-device"
import * as Crypto from "expo-crypto"
import * as Notifications from "expo-notifications"
import * as SecureStore from "expo-secure-store"
import { router } from "expo-router"
import { Platform } from "react-native"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { ReactNode } from "react"
import { useCivicPreferences } from "@/src/lib/CivicPreferencesContext"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

type NotificationState = {
  status: Notifications.PermissionStatus | "undetermined"
  expoPushToken: string | null
  isRegistered: boolean
  isRegistering: boolean
  message: string | null
  enableNotifications: () => Promise<boolean>
  disableNotifications: () => Promise<boolean>
}

const NotificationContext = createContext<NotificationState | null>(null)

function routeFromResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data
  const url = typeof data.url === "string" ? data.url : null
  const path = typeof data.path === "string" ? data.path : null
  const eventKey = typeof data.eventKey === "string" ? data.eventKey : null

  if (url?.startsWith("civicnote://")) {
    const path = url.replace("civicnote://", "/")
    router.push(path as never)
  } else if (path?.startsWith("/")) {
    router.push(path as never)
  } else if (eventKey) {
    router.push(`/alerts/${eventKey}` as never)
  }
}

const INSTALLATION_ID_KEY = "civicnote:installation-id"
const PUSH_PAUSED_KEY = "civicnote:push-paused"

function registrationUrl(path: "register" | "unregister") {
  const configured = process.env.EXPO_PUBLIC_PUSH_REGISTRATION_URL
  if (configured) {
    return configured.replace(/\/(register|unregister)\/?$/, `/${path}`)
  }
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL
  if (!convexUrl?.endsWith(".convex.cloud")) return null
  return `${convexUrl.replace(/\.convex\.cloud$/, ".convex.site")}/api/push/${path}`
}

async function getInstallationId() {
  const stored = await SecureStore.getItemAsync(INSTALLATION_ID_KEY)
  if (stored) return stored
  const created = Crypto.randomUUID()
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, created)
  return created
}

async function syncPushToken(
  token: string,
  preferences: ReturnType<typeof useCivicPreferences>["preferences"]
) {
  const url = registrationUrl("register")
  if (!url) return false

  const installationId = await getInstallationId()
  const cadence =
    preferences.cadence === "urgent" ? "instant" : preferences.cadence

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      installationId,
      platform: Platform.OS,
      appVersion: Constants.expoConfig?.version,
      deviceLabel: Device.modelName ?? undefined,
      topicSlugs: preferences.followedTopicSlugs,
      cadence,
      position: preferences.position,
      locationLabel: preferences.locationLabel,
      regionCode: preferences.regionCode,
      homeJurisdictionKeys: preferences.regionCode
        ? [preferences.regionCode]
        : [],
      notificationPermission: "granted",
      notificationsEnabled: true,
    }),
  })
  if (!response.ok) throw new Error("Push registration failed")
  return true
}

async function unregisterPushToken(token: string) {
  const url = registrationUrl("unregister")
  if (!url) return false
  const installationId = await getInstallationId()
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ installationId, token }),
  })
  if (!response.ok) throw new Error("Push unregistration failed")
  return true
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { preferences, hydrated } = useCivicPreferences()
  const [status, setStatus] =
    useState<NotificationState["status"]>("undetermined")
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [registrationPaused, setRegistrationPaused] = useState<boolean | null>(
    null
  )
  const lastSyncFingerprint = useRef<string | null>(null)

  useEffect(() => {
    SecureStore.getItemAsync(PUSH_PAUSED_KEY)
      .then((value) => setRegistrationPaused(value === "true"))
      .catch(() => setRegistrationPaused(false))

    Notifications.getPermissionsAsync()
      .then((permissions) => setStatus(permissions.status))
      .catch(() => {})

    const response =
      Notifications.addNotificationResponseReceivedListener(routeFromResponse)
    const tokenRoll = Notifications.addPushTokenListener((devicePushToken) => {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId
      if (typeof projectId !== "string" || !projectId) return
      Notifications.getExpoPushTokenAsync({ projectId, devicePushToken })
        .then((token) => {
          lastSyncFingerprint.current = null
          setExpoPushToken(token.data)
        })
        .catch(() => {})
    })

    Notifications.getLastNotificationResponseAsync()
      .then(async (lastResponse) => {
        if (!lastResponse) return
        routeFromResponse(lastResponse)
        await Notifications.clearLastNotificationResponseAsync()
      })
      .catch(() => {})

    return () => {
      response.remove()
      tokenRoll.remove()
    }
  }, [])

  useEffect(() => {
    if (
      !hydrated ||
      registrationPaused !== false ||
      status !== "granted" ||
      expoPushToken ||
      !Device.isDevice
    ) {
      return
    }

    let active = true
    const restoreRegistration = async () => {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId
      if (typeof projectId !== "string" || !projectId) return
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("civic-alerts", {
          name: "Civic alerts",
          importance: Notifications.AndroidImportance.HIGH,
        })
      }
      const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
        .data
      if (active) setExpoPushToken(token)
    }

    restoreRegistration().catch(() => {
      if (active) setIsRegistered(false)
    })
    return () => {
      active = false
    }
  }, [expoPushToken, hydrated, registrationPaused, status])

  useEffect(() => {
    if (!expoPushToken || registrationPaused !== false || !hydrated) return
    const fingerprint = JSON.stringify([expoPushToken, preferences])
    if (lastSyncFingerprint.current === fingerprint) return
    syncPushToken(expoPushToken, preferences)
      .then((registered) => {
        setIsRegistered(registered)
        if (registered) lastSyncFingerprint.current = fingerprint
      })
      .catch(() => setIsRegistered(false))
  }, [expoPushToken, hydrated, preferences, registrationPaused])

  const enableNotifications = useCallback(async () => {
    setIsRegistering(true)
    setMessage(null)
    try {
      if (!Device.isDevice) {
        setMessage("Push alerts require a physical device.")
        return false
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("civic-alerts", {
          name: "Civic alerts",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 180, 100, 180],
          lightColor: "#D9151E",
        })
      }

      const current = await Notifications.getPermissionsAsync()
      const permission =
        current.status === "granted"
          ? current
          : await Notifications.requestPermissionsAsync()
      setStatus(permission.status)
      if (permission.status !== "granted") {
        setMessage("Notifications are off. You can enable them in Settings.")
        return false
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId
      if (typeof projectId !== "string" || !projectId) {
        setMessage("This build is missing its EAS project ID.")
        return false
      }

      const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
        .data
      await SecureStore.setItemAsync(PUSH_PAUSED_KEY, "false")
      setRegistrationPaused(false)
      const registered = await syncPushToken(token, preferences)
      if (registered) {
        lastSyncFingerprint.current = JSON.stringify([token, preferences])
      }
      setExpoPushToken(token)
      setIsRegistered(registered)
      setMessage(
        registered
          ? "Civic alerts are on for this device."
          : "Notification permission is on, but this build has no alert registration endpoint configured."
      )
      return registered
    } catch {
      setMessage("We couldn’t finish push setup. Please try again.")
      return false
    } finally {
      setIsRegistering(false)
    }
  }, [preferences])

  const disableNotifications = useCallback(async () => {
    setIsRegistering(true)
    setMessage(null)
    try {
      if (expoPushToken) await unregisterPushToken(expoPushToken)
      await SecureStore.setItemAsync(PUSH_PAUSED_KEY, "true")
      setRegistrationPaused(true)
      setExpoPushToken(null)
      setIsRegistered(false)
      lastSyncFingerprint.current = null
      setMessage(
        "Civic alerts are paused. Device permission remains unchanged."
      )
      return true
    } catch {
      setMessage("We couldn’t pause server alerts. Please try again.")
      return false
    } finally {
      setIsRegistering(false)
    }
  }, [expoPushToken])

  const value = useMemo<NotificationState>(
    () => ({
      status,
      expoPushToken,
      isRegistered,
      isRegistering,
      message,
      enableNotifications,
      disableNotifications,
    }),
    [
      disableNotifications,
      enableNotifications,
      expoPushToken,
      isRegistered,
      isRegistering,
      message,
      status,
    ]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const value = useContext(NotificationContext)
  if (!value) {
    throw new Error("useNotifications must be used within its provider")
  }
  return value
}
