const readEnv = (value: string | undefined) =>
  typeof value === 'string' && value.length > 0 ? value : null

const convexUrl = readEnv(process.env.EXPO_PUBLIC_CONVEX_URL)
const workosClientId = readEnv(process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID)
const workosApiHostname =
  readEnv(process.env.EXPO_PUBLIC_WORKOS_API_HOSTNAME) ?? 'api.workos.com'
const workosRedirectUri = readEnv(process.env.EXPO_PUBLIC_WORKOS_REDIRECT_URI)

export const CONVEX_URL = convexUrl
export const WORKOS_CLIENT_ID = workosClientId
export const WORKOS_REDIRECT_URI = workosRedirectUri
export const WORKOS_API_BASE_URL = workosApiHostname.startsWith('http')
  ? workosApiHostname
  : `https://${workosApiHostname}`
