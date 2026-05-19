import { Stack } from 'expo-router'

export default function MessagesStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'none' }} />
    </Stack>
  )
}
