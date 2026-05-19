import { Link, Stack } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center bg-zinc-50 px-6">
        <Text className="text-xl font-semibold text-zinc-900">
          Route not found
        </Text>
        <Link href="/" asChild>
          <Pressable className="mt-4 rounded-xl bg-zinc-900 px-4 py-2">
            <Text className="text-sm font-medium text-white">Go back home</Text>
          </Pressable>
        </Link>
      </View>
    </>
  )
}
