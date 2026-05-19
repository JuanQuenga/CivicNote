import { Text, View } from 'react-native'

interface SystemMessageProps {
  content: string
}

export function SystemMessage({ content }: SystemMessageProps) {
  return (
    <View className="my-2 items-center">
      <View className="rounded-full bg-card px-3 py-1">
        <Text className="text-xs font-medium text-muted-foreground">
          {content}
        </Text>
      </View>
    </View>
  )
}
