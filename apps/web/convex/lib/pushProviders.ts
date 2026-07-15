export type PushProvider = "expo" | "apns" | "webpush"

export type ApnsFailure = {
  errorCode: string
  retryable: boolean
  disableDevice: boolean
}

export function deviceProvider(device: {
  provider?: PushProvider
}): PushProvider {
  return device.provider ?? "expo"
}

export function classifyApnsResponse(
  status: number,
  reason: string | undefined
): ApnsFailure | null {
  if (status === 200) return null
  if (status === 400 && reason === "BadDeviceToken") {
    return {
      errorCode: "BadDeviceToken",
      retryable: false,
      disableDevice: true,
    }
  }
  if (status === 410 && reason === "Unregistered") {
    return {
      errorCode: "Unregistered",
      retryable: false,
      disableDevice: true,
    }
  }
  if (status === 403) {
    return {
      errorCode: "ApnsAuthError",
      retryable: false,
      disableDevice: false,
    }
  }
  if (status === 429 || status >= 500) {
    return {
      errorCode: `ApnsHttp${status}`,
      retryable: true,
      disableDevice: false,
    }
  }
  return {
    errorCode: reason ? `Apns${reason}` : `ApnsHttp${status}`,
    retryable: false,
    disableDevice: false,
  }
}
