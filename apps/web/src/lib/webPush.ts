const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined

export function isWebPushConfigured() {
  return Boolean(vapidPublicKey)
}

export function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

export async function getWebPushSubscription(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function subscribeToWebPush(): Promise<PushSubscription> {
  if (!vapidPublicKey) {
    throw new Error("Web push is not configured.")
  }
  if (!isWebPushSupported()) {
    throw new Error("Web push is not supported in this browser.")
  }

  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.")
  }

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  if (existing) return existing

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeVapidKey(vapidPublicKey),
  })
}

export async function unsubscribeFromWebPush(): Promise<boolean> {
  const subscription = await getWebPushSubscription()
  if (!subscription) return true
  return subscription.unsubscribe()
}

function decodeVapidKey(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/")
  const decoded = window.atob(base64)
  const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0))
  return bytes.buffer
}
