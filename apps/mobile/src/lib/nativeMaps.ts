import { Linking, Platform } from 'react-native'

interface Place {
  latitude: number
  longitude: number
  label?: string
}

function encodedLabel(label?: string) {
  return encodeURIComponent(label?.trim() || 'Destination')
}

export function getNativeDirectionsUrl({ latitude, longitude, label }: Place) {
  const destination = `${latitude},${longitude}`
  if (Platform.OS === 'ios') {
    return `maps://?daddr=${destination}&q=${encodedLabel(label)}`
  }
  return `google.navigation:q=${destination}`
}

export function getNativeMapSearchUrl({ latitude, longitude, label }: Place) {
  const query = `${latitude},${longitude}(${encodedLabel(label)})`
  if (Platform.OS === 'ios') {
    return `maps://?ll=${latitude},${longitude}&q=${encodedLabel(label)}`
  }
  return `geo:${latitude},${longitude}?q=${query}`
}

export async function openNativeDirections(place: Place) {
  const primaryUrl = getNativeDirectionsUrl(place)
  const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`

  if (await Linking.canOpenURL(primaryUrl)) {
    await Linking.openURL(primaryUrl)
    return
  }

  await Linking.openURL(fallbackUrl)
}

export async function openNativeMapSearch(place: Place) {
  const primaryUrl = getNativeMapSearchUrl(place)
  const fallbackUrl = `https://maps.apple.com/?ll=${place.latitude},${place.longitude}&q=${encodedLabel(place.label)}`

  if (await Linking.canOpenURL(primaryUrl)) {
    await Linking.openURL(primaryUrl)
    return
  }

  await Linking.openURL(fallbackUrl)
}
