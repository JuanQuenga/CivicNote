import type { ReconcileArgs, ReconcilePushTarget } from "./installations"

export function readEventListParams(url: URL) {
  const topic = readOptionalQuery(url, "topic", 100)
  const jurisdiction = readOptionalQuery(url, "jurisdiction", 100)
  const rawLimit = url.searchParams.get("limit")
  let limit = 50
  if (rawLimit !== null) {
    if (!/^-?\d+$/.test(rawLimit)) return null
    limit = Math.min(Math.max(Number(rawLimit), 1), 100)
  }
  return { topic, jurisdiction, limit }
}

export function readReconcileArgs(value: unknown): ReconcileArgs | null {
  if (!isRecord(value) || !isRecord(value.preferences)) return null
  const { installationId, platform, appVersion, preferences } = value
  if (
    !isBoundedString(installationId, 16, 200) ||
    (platform !== "ios" && platform !== "android" && platform !== "web") ||
    !isOptionalBoundedString(appVersion, 1, 50) ||
    !Array.isArray(preferences.topicSlugs) ||
    preferences.topicSlugs.length > 50 ||
    !preferences.topicSlugs.every((slug) => isBoundedString(slug, 1, 100)) ||
    (preferences.cadence !== "instant" &&
      preferences.cadence !== "daily" &&
      preferences.cadence !== "weekly") ||
    (preferences.position !== "oppose" &&
      preferences.position !== "support" &&
      preferences.position !== "monitor") ||
    !isOptionalRegionCode(preferences.regionCode) ||
    typeof preferences.notificationsEnabled !== "boolean" ||
    (preferences.notificationPermission !== "unknown" &&
      preferences.notificationPermission !== "granted" &&
      preferences.notificationPermission !== "denied")
  ) {
    return null
  }

  const pushTarget = readPushTarget(value.pushTarget)
  if (value.pushTarget !== undefined && !pushTarget) return null

  return {
    installationId,
    platform,
    appVersion:
      typeof appVersion === "string" ? cleanOptional(appVersion) : undefined,
    preferences: {
      topicSlugs: [...new Set(preferences.topicSlugs)],
      cadence: preferences.cadence,
      position: preferences.position,
      regionCode:
        typeof preferences.regionCode === "string"
          ? cleanOptional(preferences.regionCode)?.toUpperCase()
          : undefined,
      notificationsEnabled: preferences.notificationsEnabled,
      notificationPermission: preferences.notificationPermission,
    },
    pushTarget,
  }
}

export function readPauseArgs(value: unknown) {
  if (
    !isRecord(value) ||
    !isBoundedString(value.installationId, 16, 200)
  ) {
    return null
  }
  return { installationId: value.installationId }
}

export function readTopicRequestArgs(value: unknown) {
  if (
    !isRecord(value) ||
    !isBoundedString(value.installationId, 16, 200) ||
    !isBoundedString(value.subject, 8, 200)
  ) {
    return null
  }
  return {
    installationId: value.installationId,
    subject: value.subject,
    reason: isBoundedString(value.reason, 1, 400) ? value.reason : undefined,
    regionHint: isBoundedString(value.regionHint, 1, 80)
      ? value.regionHint
      : undefined,
  }
}

function readPushTarget(value: unknown): ReconcilePushTarget | undefined {
  if (value === undefined || !isRecord(value)) return undefined
  if (value.provider === "apns") {
    if (
      typeof value.token !== "string" ||
      !/^[0-9a-f]{64}$/i.test(value.token) ||
      (value.environment !== "development" && value.environment !== "production")
    ) {
      return undefined
    }
    return {
      provider: "apns",
      token: value.token.toLowerCase(),
      environment: value.environment,
    }
  }
  if (value.provider === "webpush") {
    if (
      !isBoundedString(value.endpoint, 1, 2_000) ||
      !isRecord(value.keys) ||
      !isBoundedString(value.keys.p256dh, 1, 500) ||
      !isBoundedString(value.keys.auth, 1, 500)
    ) {
      return undefined
    }
    return {
      provider: "webpush",
      endpoint: value.endpoint,
      keys: { p256dh: value.keys.p256dh, auth: value.keys.auth },
    }
  }
  if (value.provider === "expo") {
    if (
      typeof value.token !== "string" ||
      !/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9._~+-]+\]$/.test(
        value.token
      )
    ) {
      return undefined
    }
    return { provider: "expo", token: value.token }
  }
  return undefined
}

function readOptionalQuery(url: URL, key: string, maxLength: number) {
  const value = url.searchParams.get(key)?.trim()
  return value ? value.slice(0, maxLength) : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isBoundedString(
  value: unknown,
  minimumLength: number,
  maximumLength: number
): value is string {
  return (
    typeof value === "string" &&
    value.length >= minimumLength &&
    value.length <= maximumLength
  )
}

function isOptionalBoundedString(
  value: unknown,
  minimumLength: number,
  maximumLength: number
) {
  return (
    value === undefined || isBoundedString(value, minimumLength, maximumLength)
  )
}

function isOptionalRegionCode(value: unknown) {
  return value === undefined || (typeof value === "string" && /^[A-Za-z]{2}$/.test(value.trim()))
}

function cleanOptional(value: string | undefined) {
  const cleaned = value?.trim()
  return cleaned || undefined
}
