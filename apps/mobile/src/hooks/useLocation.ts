import { useCallback, useEffect, useState } from 'react'
import * as Location from 'expo-location'

interface LocationState {
  location: {
    latitude: number
    longitude: number
  } | null
  isLoading: boolean
  error: string | null
  permissionStatus: Location.PermissionStatus | null
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: true,
    error: null,
    permissionStatus: null,
  })

  const requestPermission = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setState((prev) => ({ ...prev, permissionStatus: status }))

      if (status !== 'granted') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Location permission not granted',
        }))
        return false
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      setState((prev) => ({
        ...prev,
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        isLoading: false,
        error: null,
      }))

      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to get location',
      }))
      return false
    }
  }, [])

  const refreshLocation = useCallback(async () => {
    if (state.permissionStatus !== 'granted') {
      return requestPermission()
    }

    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      setState((prev) => ({
        ...prev,
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        isLoading: false,
        error: null,
      }))

      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to get location',
      }))
      return false
    }
  }, [requestPermission, state.permissionStatus])

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync()
      setState((prev) => ({ ...prev, permissionStatus: status }))

      if (status === 'granted') {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })

          setState((prev) => ({
            ...prev,
            location: {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            },
            isLoading: false,
          }))
        } catch (error) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error:
              error instanceof Error ? error.message : 'Failed to get location',
          }))
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    }

    void checkPermission()
  }, [])

  return {
    location: state.location,
    isLoading: state.isLoading,
    error: state.error,
    permissionStatus: state.permissionStatus,
    requestPermission,
    refreshLocation,
  }
}
