import * as SecureStore from 'expo-secure-store'

const REFERRAL_CODE_KEY = 'civic-research-hub.mobile.referral-code.v1'

export async function storeReferralCode(referralCode: string) {
  const normalized = referralCode.trim().toUpperCase()
  if (!normalized) return
  await SecureStore.setItemAsync(REFERRAL_CODE_KEY, normalized)
}

export async function getStoredReferralCode() {
  return SecureStore.getItemAsync(REFERRAL_CODE_KEY)
}

export async function clearStoredReferralCode() {
  await SecureStore.deleteItemAsync(REFERRAL_CODE_KEY)
}
