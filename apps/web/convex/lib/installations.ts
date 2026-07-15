export type ReconcilePushTarget =
  | {
      provider: "apns"
      token: string
      environment: "development" | "production"
    }
  | {
      provider: "webpush"
      endpoint: string
      keys: { p256dh: string; auth: string }
    }
  | { provider: "expo"; token: string }

export type ReconcilePreferences = {
  topicSlugs: Array<string>
  cadence: "instant" | "daily" | "weekly"
  position: "oppose" | "support" | "monitor"
  regionCode?: string
  notificationsEnabled: boolean
  notificationPermission: "unknown" | "granted" | "denied"
}

export type ReconcileArgs = {
  installationId: string
  platform: "ios" | "android" | "web"
  appVersion?: string
  preferences: ReconcilePreferences
  pushTarget?: ReconcilePushTarget
}

const STATE_DETAILS: Partial<
  Record<string, { name: string; timezone: string }>
> = {
  AK: { name: "Alaska", timezone: "America/Anchorage" },
  AL: { name: "Alabama", timezone: "America/Chicago" },
  AR: { name: "Arkansas", timezone: "America/Chicago" },
  AZ: { name: "Arizona", timezone: "America/Phoenix" },
  CA: { name: "California", timezone: "America/Los_Angeles" },
  CO: { name: "Colorado", timezone: "America/Denver" },
  CT: { name: "Connecticut", timezone: "America/New_York" },
  DC: { name: "District of Columbia", timezone: "America/New_York" },
  DE: { name: "Delaware", timezone: "America/New_York" },
  FL: { name: "Florida", timezone: "America/New_York" },
  GA: { name: "Georgia", timezone: "America/New_York" },
  HI: { name: "Hawaii", timezone: "Pacific/Honolulu" },
  IA: { name: "Iowa", timezone: "America/Chicago" },
  ID: { name: "Idaho", timezone: "America/Boise" },
  IL: { name: "Illinois", timezone: "America/Chicago" },
  IN: { name: "Indiana", timezone: "America/Indiana/Indianapolis" },
  KS: { name: "Kansas", timezone: "America/Chicago" },
  KY: { name: "Kentucky", timezone: "America/New_York" },
  LA: { name: "Louisiana", timezone: "America/Chicago" },
  MA: { name: "Massachusetts", timezone: "America/New_York" },
  MD: { name: "Maryland", timezone: "America/New_York" },
  ME: { name: "Maine", timezone: "America/New_York" },
  MI: { name: "Michigan", timezone: "America/Detroit" },
  MN: { name: "Minnesota", timezone: "America/Chicago" },
  MO: { name: "Missouri", timezone: "America/Chicago" },
  MS: { name: "Mississippi", timezone: "America/Chicago" },
  MT: { name: "Montana", timezone: "America/Denver" },
  NC: { name: "North Carolina", timezone: "America/New_York" },
  ND: { name: "North Dakota", timezone: "America/Chicago" },
  NE: { name: "Nebraska", timezone: "America/Chicago" },
  NH: { name: "New Hampshire", timezone: "America/New_York" },
  NJ: { name: "New Jersey", timezone: "America/New_York" },
  NM: { name: "New Mexico", timezone: "America/Denver" },
  NV: { name: "Nevada", timezone: "America/Los_Angeles" },
  NY: { name: "New York", timezone: "America/New_York" },
  OH: { name: "Ohio", timezone: "America/New_York" },
  OK: { name: "Oklahoma", timezone: "America/Chicago" },
  OR: { name: "Oregon", timezone: "America/Los_Angeles" },
  PA: { name: "Pennsylvania", timezone: "America/New_York" },
  RI: { name: "Rhode Island", timezone: "America/New_York" },
  SC: { name: "South Carolina", timezone: "America/New_York" },
  SD: { name: "South Dakota", timezone: "America/Chicago" },
  TN: { name: "Tennessee", timezone: "America/Chicago" },
  TX: { name: "Texas", timezone: "America/Chicago" },
  UT: { name: "Utah", timezone: "America/Denver" },
  VA: { name: "Virginia", timezone: "America/New_York" },
  VT: { name: "Vermont", timezone: "America/New_York" },
  WA: { name: "Washington", timezone: "America/Los_Angeles" },
  WI: { name: "Wisconsin", timezone: "America/Chicago" },
  WV: { name: "West Virginia", timezone: "America/New_York" },
  WY: { name: "Wyoming", timezone: "America/Denver" },
}

export function normalizeRegionCode(value: string | undefined) {
  const code = value?.trim().toUpperCase()
  return code && /^[A-Z]{2}$/.test(code) ? code : undefined
}

export function jurisdictionForRegion(code: string) {
  const details = STATE_DETAILS[code]
  return {
    key: `us-${code.toLowerCase()}`,
    name: details?.name ?? code,
    timezone: details?.timezone ?? "UTC",
  }
}

export function desiredSubscriptionDiff(
  existingSlugs: Array<string>,
  desiredSlugs: Array<string>
) {
  const desired = new Set(desiredSlugs)
  return {
    deactivate: existingSlugs.filter((slug) => !desired.has(slug)),
    activate: [...desired],
  }
}
