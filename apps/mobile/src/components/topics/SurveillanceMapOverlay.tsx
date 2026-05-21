import { useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import * as Location from "expo-location"
import { ExternalLink, Flame, LocateFixed, MapPinned, X } from "lucide-react-native"
import {
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native"
import MapView, {
  Circle,
  Heatmap,
  Marker,
  PROVIDER_GOOGLE,
} from "react-native-maps"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

type CameraCluster = {
  id: string
  state: string
  place: string
  operator: string
  latitude: number
  longitude: number
  cameraCount: number
  source: string
}

type StateRegion = {
  code: string
  name: string
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

type PanelItem = {
  id: string
  title: string
  subtitle: string
}

const LIVE_ALPR_MAP_URL = "https://deflock.me/map"
const MAP_PANEL_EDGE_GAP = 14

const NATIONAL_REGION = {
  latitude: 39.5,
  longitude: -98.35,
  latitudeDelta: 42,
  longitudeDelta: 58,
}

const stateRegions: Array<StateRegion> = [
  { code: "AL", name: "Alabama", latitude: 32.8067, longitude: -86.7911, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  { code: "AK", name: "Alaska", latitude: 61.3707, longitude: -152.4044, latitudeDelta: 22, longitudeDelta: 30 },
  { code: "AZ", name: "Arizona", latitude: 33.7298, longitude: -111.4312, latitudeDelta: 6.5, longitudeDelta: 6.5 },
  { code: "AR", name: "Arkansas", latitude: 34.9697, longitude: -92.3731, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  { code: "CA", name: "California", latitude: 36.1162, longitude: -119.6816, latitudeDelta: 10, longitudeDelta: 10 },
  { code: "CO", name: "Colorado", latitude: 39.0598, longitude: -105.3111, latitudeDelta: 6.5, longitudeDelta: 6.5 },
  { code: "CT", name: "Connecticut", latitude: 41.5978, longitude: -72.7554, latitudeDelta: 2.6, longitudeDelta: 2.6 },
  { code: "DE", name: "Delaware", latitude: 39.3185, longitude: -75.5071, latitudeDelta: 2.4, longitudeDelta: 2.4 },
  { code: "FL", name: "Florida", latitude: 27.7663, longitude: -81.6868, latitudeDelta: 8, longitudeDelta: 8 },
  { code: "GA", name: "Georgia", latitude: 33.0406, longitude: -83.6431, latitudeDelta: 6, longitudeDelta: 6 },
  { code: "HI", name: "Hawaii", latitude: 21.0943, longitude: -157.4983, latitudeDelta: 5, longitudeDelta: 5 },
  { code: "ID", name: "Idaho", latitude: 44.2405, longitude: -114.4788, latitudeDelta: 7, longitudeDelta: 7 },
  { code: "IL", name: "Illinois", latitude: 40.3495, longitude: -88.9861, latitudeDelta: 6, longitudeDelta: 6 },
  { code: "IN", name: "Indiana", latitude: 39.8494, longitude: -86.2583, latitudeDelta: 5, longitudeDelta: 5 },
  { code: "IA", name: "Iowa", latitude: 42.0115, longitude: -93.2105, latitudeDelta: 5, longitudeDelta: 5 },
  { code: "KS", name: "Kansas", latitude: 38.5266, longitude: -96.7265, latitudeDelta: 5.8, longitudeDelta: 5.8 },
  { code: "KY", name: "Kentucky", latitude: 37.6681, longitude: -84.6701, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  { code: "LA", name: "Louisiana", latitude: 31.1695, longitude: -91.8678, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  { code: "ME", name: "Maine", latitude: 44.6939, longitude: -69.3819, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  { code: "MD", name: "Maryland", latitude: 39.0639, longitude: -76.8021, latitudeDelta: 3.2, longitudeDelta: 3.2 },
  { code: "MA", name: "Massachusetts", latitude: 42.2302, longitude: -71.5301, latitudeDelta: 3.5, longitudeDelta: 3.5 },
  { code: "MI", name: "Michigan", latitude: 44.3148, longitude: -85.6024, latitudeDelta: 6.8, longitudeDelta: 6.8 },
  { code: "MN", name: "Minnesota", latitude: 45.6945, longitude: -93.9002, latitudeDelta: 6.5, longitudeDelta: 6.5 },
  { code: "MS", name: "Mississippi", latitude: 32.7416, longitude: -89.6787, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  { code: "MO", name: "Missouri", latitude: 38.4561, longitude: -92.2884, latitudeDelta: 5.8, longitudeDelta: 5.8 },
  { code: "MT", name: "Montana", latitude: 46.9219, longitude: -110.4544, latitudeDelta: 7, longitudeDelta: 7 },
  { code: "NE", name: "Nebraska", latitude: 41.1254, longitude: -98.2681, latitudeDelta: 5.8, longitudeDelta: 5.8 },
  { code: "NV", name: "Nevada", latitude: 38.3135, longitude: -117.0554, latitudeDelta: 7, longitudeDelta: 7 },
  { code: "NH", name: "New Hampshire", latitude: 43.4525, longitude: -71.5639, latitudeDelta: 3.5, longitudeDelta: 3.5 },
  { code: "NJ", name: "New Jersey", latitude: 40.2989, longitude: -74.521, latitudeDelta: 3.5, longitudeDelta: 3.5 },
  { code: "NM", name: "New Mexico", latitude: 34.8405, longitude: -106.2485, latitudeDelta: 6.5, longitudeDelta: 6.5 },
  { code: "NY", name: "New York", latitude: 42.1657, longitude: -74.9481, latitudeDelta: 6, longitudeDelta: 6 },
  { code: "NC", name: "North Carolina", latitude: 35.6301, longitude: -79.8064, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  { code: "ND", name: "North Dakota", latitude: 47.5289, longitude: -99.784, latitudeDelta: 5.8, longitudeDelta: 5.8 },
  { code: "OH", name: "Ohio", latitude: 40.3888, longitude: -82.7649, latitudeDelta: 5, longitudeDelta: 5 },
  { code: "OK", name: "Oklahoma", latitude: 35.5653, longitude: -96.9289, latitudeDelta: 5.8, longitudeDelta: 5.8 },
  { code: "OR", name: "Oregon", latitude: 44.572, longitude: -122.0709, latitudeDelta: 6.5, longitudeDelta: 6.5 },
  { code: "PA", name: "Pennsylvania", latitude: 40.5908, longitude: -77.2098, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  { code: "RI", name: "Rhode Island", latitude: 41.6809, longitude: -71.5118, latitudeDelta: 1.8, longitudeDelta: 1.8 },
  { code: "SC", name: "South Carolina", latitude: 33.8569, longitude: -80.945, latitudeDelta: 5, longitudeDelta: 5 },
  { code: "SD", name: "South Dakota", latitude: 44.2998, longitude: -99.4388, latitudeDelta: 5.8, longitudeDelta: 5.8 },
  { code: "TN", name: "Tennessee", latitude: 35.7478, longitude: -86.6923, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  { code: "TX", name: "Texas", latitude: 31.0545, longitude: -97.5635, latitudeDelta: 11, longitudeDelta: 11 },
  { code: "UT", name: "Utah", latitude: 40.15, longitude: -111.8624, latitudeDelta: 6, longitudeDelta: 6 },
  { code: "VT", name: "Vermont", latitude: 44.0459, longitude: -72.7107, latitudeDelta: 3.5, longitudeDelta: 3.5 },
  { code: "VA", name: "Virginia", latitude: 37.7693, longitude: -78.17, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  { code: "WA", name: "Washington", latitude: 47.4009, longitude: -121.4905, latitudeDelta: 6, longitudeDelta: 6 },
  { code: "WV", name: "West Virginia", latitude: 38.4912, longitude: -80.9545, latitudeDelta: 5, longitudeDelta: 5 },
  { code: "WI", name: "Wisconsin", latitude: 44.2685, longitude: -89.6165, latitudeDelta: 6, longitudeDelta: 6 },
  { code: "WY", name: "Wyoming", latitude: 42.756, longitude: -107.3025, latitudeDelta: 6, longitudeDelta: 6 },
]

const cameraClusters: Array<CameraCluster> = [
  {
    id: "detroit",
    state: "MI",
    place: "Detroit",
    operator: "Police and regional ALPR network",
    latitude: 42.3314,
    longitude: -83.0458,
    cameraCount: 46,
    source: "Crowdsourced ALPR maps and local reporting",
  },
  {
    id: "grand-rapids",
    state: "MI",
    place: "Grand Rapids",
    operator: "Flock / ALPR deployments",
    latitude: 42.9634,
    longitude: -85.6681,
    cameraCount: 32,
    source: "Crowdsourced ALPR maps and local reporting",
  },
  {
    id: "flint",
    state: "MI",
    place: "Flint",
    operator: "Flock / ALPR deployments",
    latitude: 43.0125,
    longitude: -83.6875,
    cameraCount: 26,
    source: "Crowdsourced ALPR maps and local reporting",
  },
  {
    id: "lansing",
    state: "MI",
    place: "Lansing",
    operator: "Flock / ALPR deployments",
    latitude: 42.7325,
    longitude: -84.5555,
    cameraCount: 21,
    source: "Crowdsourced ALPR maps and local reporting",
  },
  {
    id: "ann-arbor",
    state: "MI",
    place: "Ann Arbor",
    operator: "ALPR and connected camera systems",
    latitude: 42.2808,
    longitude: -83.743,
    cameraCount: 18,
    source: "Crowdsourced ALPR maps and local reporting",
  },
  {
    id: "kalamazoo",
    state: "MI",
    place: "Kalamazoo",
    operator: "Flock / ALPR deployments",
    latitude: 42.2917,
    longitude: -85.5872,
    cameraCount: 15,
    source: "Crowdsourced ALPR maps and local reporting",
  },
  {
    id: "portage",
    state: "MI",
    place: "Portage",
    operator: "Flock transparency portal",
    latitude: 42.2012,
    longitude: -85.58,
    cameraCount: 12,
    source: "City transparency materials",
  },
  {
    id: "holland",
    state: "MI",
    place: "Holland",
    operator: "Flock / ALPR deployments",
    latitude: 42.7875,
    longitude: -86.1089,
    cameraCount: 11,
    source: "Crowdsourced ALPR maps and local reporting",
  },
  {
    id: "royal-oak",
    state: "MI",
    place: "Royal Oak",
    operator: "Flock / ALPR deployments",
    latitude: 42.4895,
    longitude: -83.1446,
    cameraCount: 10,
    source: "Public procurement records",
  },
  {
    id: "saginaw",
    state: "MI",
    place: "Saginaw",
    operator: "ALPR deployments",
    latitude: 43.4195,
    longitude: -83.9508,
    cameraCount: 8,
    source: "Crowdsourced ALPR maps and local reporting",
  },
  {
    id: "los-angeles",
    state: "CA",
    place: "Los Angeles",
    operator: "ALPR and connected camera systems",
    latitude: 34.0522,
    longitude: -118.2437,
    cameraCount: 54,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "bay-area",
    state: "CA",
    place: "San Francisco Bay Area",
    operator: "ALPR and camera-sharing networks",
    latitude: 37.7749,
    longitude: -122.4194,
    cameraCount: 41,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "phoenix",
    state: "AZ",
    place: "Phoenix",
    operator: "Flock / ALPR deployments",
    latitude: 33.4484,
    longitude: -112.074,
    cameraCount: 28,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "dallas",
    state: "TX",
    place: "Dallas-Fort Worth",
    operator: "Flock / ALPR deployments",
    latitude: 32.7767,
    longitude: -96.797,
    cameraCount: 36,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "houston",
    state: "TX",
    place: "Houston",
    operator: "ALPR and regional camera systems",
    latitude: 29.7604,
    longitude: -95.3698,
    cameraCount: 24,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "chicago",
    state: "IL",
    place: "Chicago",
    operator: "ALPR and connected camera systems",
    latitude: 41.8781,
    longitude: -87.6298,
    cameraCount: 38,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "atlanta",
    state: "GA",
    place: "Atlanta",
    operator: "Flock / ALPR deployments",
    latitude: 33.749,
    longitude: -84.388,
    cameraCount: 31,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "miami",
    state: "FL",
    place: "Miami",
    operator: "ALPR and connected camera systems",
    latitude: 25.7617,
    longitude: -80.1918,
    cameraCount: 27,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "orlando",
    state: "FL",
    place: "Orlando",
    operator: "Flock / ALPR deployments",
    latitude: 28.5383,
    longitude: -81.3792,
    cameraCount: 23,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "denver",
    state: "CO",
    place: "Denver",
    operator: "ALPR and connected camera systems",
    latitude: 39.7392,
    longitude: -104.9903,
    cameraCount: 22,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "seattle",
    state: "WA",
    place: "Seattle",
    operator: "ALPR and connected camera systems",
    latitude: 47.6062,
    longitude: -122.3321,
    cameraCount: 20,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "new-york",
    state: "NY",
    place: "New York City",
    operator: "ALPR and connected camera systems",
    latitude: 40.7128,
    longitude: -74.006,
    cameraCount: 44,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "philadelphia",
    state: "PA",
    place: "Philadelphia",
    operator: "Flock / ALPR deployments",
    latitude: 39.9526,
    longitude: -75.1652,
    cameraCount: 21,
    source: "Crowdsourced ALPR maps and public reporting",
  },
  {
    id: "raleigh",
    state: "NC",
    place: "Raleigh",
    operator: "Flock / ALPR deployments",
    latitude: 35.7796,
    longitude: -78.6382,
    cameraCount: 19,
    source: "Crowdsourced ALPR maps and public reporting",
  },
]

const CIVIC_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f7f4ee" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#52525b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d4d4d8" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f3f0e8" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#dbeafe" }],
  },
]

function distanceInMiles(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number }
) {
  const earthRadiusMiles = 3958.8
  const latitudeDelta = ((second.latitude - first.latitude) * Math.PI) / 180
  const longitudeDelta = ((second.longitude - first.longitude) * Math.PI) / 180
  const firstLatitude = (first.latitude * Math.PI) / 180
  const secondLatitude = (second.latitude * Math.PI) / 180
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function SurveillanceMapLauncher({
  topicSlug,
}: {
  topicSlug: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (topicSlug !== "michigan-surveillance-stack") return null

  return (
    <>
      <View className="border-t border-white/10 bg-zinc-950 px-5 pb-6">
        <Pressable
          className="flex-row items-center justify-center gap-2 border border-white bg-white px-4 py-4"
          onPress={() => setIsOpen(true)}
        >
          <MapPinned color="#18181b" size={18} strokeWidth={2.2} />
          <Text className="text-xs font-bold tracking-[1.5px] text-zinc-950 uppercase">
            Open ALPR Camera Map
          </Text>
        </Pressable>
      </View>
      <Modal animationType="none" transparent visible={isOpen}>
        <MobileMapOverlay isOpen={isOpen}>
          <SurveillanceMap onClose={() => setIsOpen(false)} />
        </MobileMapOverlay>
      </Modal>
    </>
  )
}

function MobileMapOverlay({
  children,
  isOpen,
}: {
  children: ReactNode
  isOpen: boolean
}) {
  const { height } = useWindowDimensions()
  const translateY = useRef(new Animated.Value(height)).current

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isOpen ? 0 : height,
      tension: 95,
      friction: 18,
      useNativeDriver: true,
    }).start()
  }, [height, isOpen, translateY])

  return (
    <Pressable
      pointerEvents={isOpen ? "box-none" : "none"}
      style={styles.overlay}
    >
      <Animated.View
        style={[
          styles.sheet,
          {
            bottom: 0,
            height,
            transform: [{ translateY }],
          },
        ]}
      >
        <Pressable style={styles.sheetSurface} onPress={() => {}}>
          <View style={styles.sheetContent}>{children}</View>
        </Pressable>
      </Animated.View>
    </Pressable>
  )
}

function SurveillanceMap({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapView>(null)
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null)
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "denied">(
    "idle"
  )

  const selectedCluster =
    cameraClusters.find((cluster) => cluster.id === selectedClusterId) ?? null
  const visibleClusters = selectedStateCode
    ? cameraClusters.filter((cluster) => cluster.state === selectedStateCode)
    : cameraClusters
  const totalMapped = cameraClusters.reduce(
    (sum, cluster) => sum + cluster.cameraCount,
    0
  )
  const nearby = useMemo(() => {
    if (!userLocation) return []

    return visibleClusters
      .map((cluster) => ({
        ...cluster,
        distance: distanceInMiles(userLocation, cluster),
      }))
      .filter((cluster) => cluster.distance <= 25)
      .sort((a, b) => a.distance - b.distance)
  }, [userLocation, visibleClusters])
  const statePanelItems = useMemo<Array<PanelItem>>(
    () =>
      stateRegions.map((state) => {
        const count = cameraClusters
          .filter((cluster) => cluster.state === state.code)
          .reduce((sum, cluster) => sum + cluster.cameraCount, 0)

        return {
          id: state.code,
          title: state.name,
          subtitle: count ? `${count} bundled pins` : "Open live map",
        }
      }),
    []
  )
  const panelItems = useMemo<Array<PanelItem>>(
    () =>
      visibleClusters
        .slice()
        .sort((a, b) => b.cameraCount - a.cameraCount)
        .map((cluster) => ({
          id: cluster.id,
          title: cluster.place,
          subtitle: `${cluster.cameraCount} mapped cameras`,
        })),
    [visibleClusters]
  )

  async function refreshLocation() {
    setLocationStatus("loading")
    const permission = await Location.requestForegroundPermissionsAsync()

    if (permission.status !== Location.PermissionStatus.GRANTED) {
      setLocationStatus("denied")
      return
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })
    const nextLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }
    setUserLocation(nextLocation)
    setLocationStatus("idle")
    mapRef.current?.animateToRegion(
      {
        ...nextLocation,
        latitudeDelta: 0.8,
        longitudeDelta: 0.8,
      },
      650
    )
  }

  function selectCluster(cluster: CameraCluster) {
    setSelectedStateCode(cluster.state)
    setSelectedClusterId(cluster.id)
    mapRef.current?.animateToRegion(
      {
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        latitudeDelta: 0.95,
        longitudeDelta: 0.95,
      },
      650
    )
  }

  function selectState(stateCode: string) {
    const state = stateRegions.find((candidate) => candidate.code === stateCode)
    if (!state) return

    setSelectedStateCode(state.code)
    setSelectedClusterId(null)
    mapRef.current?.animateToRegion(
      {
        latitude: state.latitude,
        longitude: state.longitude,
        latitudeDelta: state.latitudeDelta,
        longitudeDelta: state.longitudeDelta,
      },
      650
    )
  }

  return (
    <View style={styles.container}>
      <MapView
        customMapStyle={CIVIC_MAP_STYLE}
        initialRegion={NATIONAL_REGION}
        mapType="standard"
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        ref={mapRef}
        showsBuildings={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        showsUserLocation={Boolean(userLocation)}
        style={StyleSheet.absoluteFillObject}
        userInterfaceStyle="light"
        onPress={() => setSelectedClusterId(null)}
      >
        {Platform.OS === "android" && visibleClusters.length ? (
          <Heatmap
            gradient={{
              colorMapSize: 256,
              colors: ["#fef3c7", "#f97316", "#dc2626", "#18181b"],
              startPoints: [0.1, 0.35, 0.65, 1],
            }}
            opacity={0.55}
            points={visibleClusters.map((cluster) => ({
              latitude: cluster.latitude,
              longitude: cluster.longitude,
              weight: cluster.cameraCount,
            }))}
            radius={42}
          />
        ) : (
          visibleClusters.map((cluster) => (
            <Circle
              center={{
                latitude: cluster.latitude,
                longitude: cluster.longitude,
              }}
              fillColor="rgba(220, 38, 38, 0.22)"
              key={`${cluster.id}-density`}
              radius={Math.max(9000, cluster.cameraCount * 650)}
              strokeColor="rgba(127, 29, 29, 0.34)"
              strokeWidth={1}
            />
          ))
        )}
        {visibleClusters.map((cluster) => (
          <Marker
            coordinate={{
              latitude: cluster.latitude,
              longitude: cluster.longitude,
            }}
            key={cluster.id}
            onPress={(event) => {
              event.stopPropagation()
              selectCluster(cluster)
            }}
          >
            <View style={styles.markerShell}>
              <View
                style={[
                  styles.cameraMarker,
                  selectedClusterId === cluster.id && styles.selectedMarker,
                ]}
              >
                <Text style={styles.markerCount}>{cluster.cameraCount}</Text>
              </View>
              <View style={styles.markerPointer} />
            </View>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={[styles.topHeader, { top: insets.top + 4 }]}>
          <View style={styles.headerBadge}>
            <MapPinned color="#F11A23" size={18} />
            <Text style={styles.headerBadgeText}>Topic 02</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Open live ALPR map"
              style={styles.headerButton}
              onPress={() => {
                void Linking.openURL(LIVE_ALPR_MAP_URL)
              }}
            >
              <ExternalLink color="#18181b" size={20} />
            </Pressable>
            <Pressable
              accessibilityLabel="Close map"
              style={styles.headerButton}
              onPress={onClose}
            >
              <X color="#18181b" size={21} />
            </Pressable>
          </View>
        </View>

        <MobileMapBottomPanel
          actions={
            <View style={styles.statPill}>
              <Text style={styles.statPillText}>{totalMapped} mapped</Text>
            </View>
          }
          bottomOffset={MAP_PANEL_EDGE_GAP + insets.bottom}
          icon={<Flame color="#F11A23" size={17} />}
          items={panelItems}
          locationStatus={locationStatus}
          nearbyCount={
            nearby.length
              ? nearby.reduce((sum, cluster) => sum + cluster.cameraCount, 0)
              : null
          }
          onClose={onClose}
          onOpenLiveMap={() => {
            void Linking.openURL(LIVE_ALPR_MAP_URL)
          }}
          onRefreshLocation={() => void refreshLocation()}
          onSelectItem={(item) => {
            const cluster = cameraClusters.find((candidate) => candidate.id === item.id)
            if (cluster) selectCluster(cluster)
          }}
          onSelectState={selectState}
          renderSelectedItem={
            selectedCluster ? (
              <SelectedCameraCluster cluster={selectedCluster} />
            ) : null
          }
          selectedItem={selectedCluster}
          selectedStateCode={selectedStateCode}
          stateItems={statePanelItems}
          title={selectedStateCode ? `${selectedStateCode} ALPR Pins` : "ALPR Density"}
        />
      </SafeAreaView>
    </View>
  )
}

function MobileMapBottomPanel({
  actions,
  bottomOffset,
  icon,
  items,
  locationStatus,
  nearbyCount,
  onClose,
  onOpenLiveMap,
  onRefreshLocation,
  onSelectItem,
  onSelectState,
  renderSelectedItem,
  selectedStateCode,
  stateItems,
  title,
}: {
  actions?: ReactNode
  bottomOffset: number
  icon: ReactNode
  items: Array<PanelItem>
  locationStatus: "idle" | "loading" | "denied"
  nearbyCount: number | null
  onClose: () => void
  onOpenLiveMap: () => void
  onRefreshLocation: () => void
  onSelectItem: (item: PanelItem) => void
  onSelectState: (stateCode: string) => void
  renderSelectedItem?: ReactNode
  selectedItem?: CameraCluster | null
  selectedStateCode: string | null
  stateItems: Array<PanelItem>
  title: string
}) {
  return (
    <View style={[styles.bottomControls, { bottom: bottomOffset }]}>
      <View style={styles.bottomPanel}>
        <View style={styles.bottomHeader}>
          <View style={styles.bottomTitle}>
            {icon}
            <Text style={styles.titleText}>{title}</Text>
          </View>
          <View style={styles.bottomActions}>
            {actions}
            <Pressable
              accessibilityLabel="Refresh location"
              style={styles.iconButton}
              onPress={onRefreshLocation}
            >
              <LocateFixed color="#18181b" size={19} />
            </Pressable>
            <Pressable
              accessibilityLabel="Close map"
              style={styles.closeButton}
              onPress={onClose}
            >
              <X color="#18181b" size={18} />
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>

        {renderSelectedItem ?? (
          <View style={styles.panelLists}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stateScroller}
            >
              {stateItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.stateChip,
                    selectedStateCode === item.id && styles.selectedStateChip,
                  ]}
                  onPress={() => onSelectState(item.id)}
                >
                  <Text numberOfLines={1} style={styles.stateChipText}>
                    {item.id}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.itemScroller}
            >
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.itemChip}
                  onPress={() => onSelectItem(item)}
                >
                  <Text numberOfLines={1} style={styles.itemTitle}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.itemMeta}>
                    {item.subtitle}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={styles.itemChip}
                onPress={onOpenLiveMap}
              >
                <Text numberOfLines={1} style={styles.itemTitle}>
                  Individual cameras
                </Text>
                <Text numberOfLines={1} style={styles.itemMeta}>
                  Open the live DeFlock map
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        <View style={styles.panelFooter}>
          <Text style={styles.footerText}>
            {locationStatus === "denied"
              ? "Location permission is off."
              : nearbyCount === null
                ? "Tap locate to estimate cameras near you."
                : `${nearbyCount} mapped cameras within 25 miles.`}
          </Text>
          <Pressable style={styles.liveMapButton} onPress={onOpenLiveMap}>
            <Text style={styles.liveMapButtonText}>Live map</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

function SelectedCameraCluster({ cluster }: { cluster: CameraCluster }) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.cardIcon}>
        <Text style={styles.cardIconText}>{cluster.cameraCount}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text numberOfLines={1} style={styles.cardTitle}>
          {cluster.place}
        </Text>
        <Text numberOfLines={1} style={styles.cardSubtitle}>
          {cluster.operator}
        </Text>
        <Text numberOfLines={1} style={styles.cardMeta}>
          {cluster.source}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 20,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "transparent",
  },
  sheetSurface: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#f7f4ee",
  },
  sheetContent: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f7f4ee",
  },
  topHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    backgroundColor: "transparent",
  },
  headerBadge: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 14,
  },
  headerBadgeText: {
    color: "#18181b",
    fontSize: 13,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  bottomControls: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  bottomPanel: {
    gap: 12,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 18,
  },
  bottomHeader: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bottomTitle: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottomActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleText: {
    color: "#18181b",
    fontSize: 15,
    fontWeight: "800",
  },
  statPill: {
    height: 34,
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(241, 26, 35, 0.18)",
    paddingHorizontal: 10,
  },
  statPillText: {
    color: "#18181b",
    fontSize: 12,
    fontWeight: "800",
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
  },
  closeButton: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
  },
  closeButtonText: {
    color: "#18181b",
    fontSize: 13,
    fontWeight: "700",
  },
  panelLists: {
    gap: 10,
  },
  stateScroller: {
    gap: 8,
    paddingRight: 2,
  },
  stateChip: {
    minWidth: 46,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
  },
  selectedStateChip: {
    borderColor: "rgba(241, 26, 35, 0.75)",
    backgroundColor: "rgba(241, 26, 35, 0.22)",
  },
  stateChipText: {
    color: "#18181b",
    fontSize: 12,
    fontWeight: "900",
  },
  itemScroller: {
    gap: 10,
    paddingRight: 2,
  },
  itemChip: {
    width: 172,
    minHeight: 62,
    justifyContent: "center",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  itemTitle: {
    color: "#18181b",
    fontSize: 14,
    fontWeight: "800",
  },
  itemMeta: {
    marginTop: 3,
    color: "#71717a",
    fontSize: 12,
    fontWeight: "600",
  },
  panelFooter: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  footerText: {
    flex: 1,
    color: "#71717a",
    fontSize: 12,
    fontWeight: "600",
  },
  liveMapButton: {
    height: 34,
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#F11A23",
    paddingHorizontal: 14,
  },
  liveMapButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  detailCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
    padding: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(241, 26, 35, 0.18)",
  },
  cardIconText: {
    color: "#18181b",
    fontSize: 16,
    fontWeight: "900",
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: "#18181b",
    fontSize: 15,
    fontWeight: "800",
  },
  cardSubtitle: {
    marginTop: 2,
    color: "#71717a",
    fontSize: 12,
    fontWeight: "600",
  },
  cardMeta: {
    marginTop: 2,
    color: "#71717A",
    fontSize: 11,
    fontWeight: "600",
  },
  markerShell: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 46,
    minHeight: 52,
  },
  cameraMarker: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FAFAFA",
    backgroundColor: "#F11A23",
  },
  selectedMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
  },
  markerCount: {
    color: "#FAFAFA",
    fontSize: 12,
    fontWeight: "900",
  },
  markerPointer: {
    marginTop: -2,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#F11A23",
  },
})
