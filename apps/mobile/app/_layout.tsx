import "../global.css"

import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from "@expo-google-fonts/outfit"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ActivityIndicator, View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { MobileAppMapSheet } from "../src/components/map/MobileAppMapSheet"
import { MobileBottomTabBar } from "../src/components/navigation/MobileBottomTabBar"
import { MobileSideMenu } from "../src/components/navigation/MobileSideMenu"

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  })

  if (!fontsLoaded && !fontError) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-100">
        <ActivityIndicator color="#991B1B" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View className="flex-1 bg-[#f7f4ee]">
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#ffffff" },
            headerTintColor: "#18181b",
            headerTitleStyle: {
              fontFamily: "Outfit_600SemiBold",
              fontWeight: "600",
            },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: "#f7f4ee" },
          }}
        >
          <Stack.Screen
            name="index"
            options={{ title: "Civic Research Hub", headerShown: false }}
          />
          <Stack.Screen
            name="topics/[slug]"
            options={{ title: "Topic", headerBackTitle: "Topics" }}
          />
          <Stack.Screen name="+not-found" options={{ title: "Not found" }} />
        </Stack>
        <MobileBottomTabBar />
        <MobileAppMapSheet />
        <MobileSideMenu />
      </View>
    </SafeAreaProvider>
  )
}
