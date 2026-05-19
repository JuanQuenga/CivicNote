import { Phone, PhoneMissed, PhoneOff } from 'lucide-react-native'
import { Text, View } from 'react-native'

type CallEventType =
  | 'call_started'
  | 'call_ended'
  | 'call_missed'
  | 'call_declined'

interface CallSystemMessageProps {
  eventType: CallEventType
  content: string
}

const EVENT_CONFIG: Record<
  CallEventType,
  {
    Icon: typeof Phone
    color: string
    bgClass: string
  }
> = {
  call_started: {
    Icon: Phone,
    color: '#22c55e',
    bgClass: 'bg-green-500/10',
  },
  call_ended: {
    Icon: PhoneOff,
    color: '#999999',
    bgClass: 'bg-card',
  },
  call_missed: {
    Icon: PhoneMissed,
    color: '#ef4444',
    bgClass: 'bg-red-500/10',
  },
  call_declined: {
    Icon: PhoneOff,
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10',
  },
}

export function CallSystemMessage({
  eventType,
  content,
}: CallSystemMessageProps) {
  const config = EVENT_CONFIG[eventType]
  const Icon = config.Icon

  return (
    <View className="my-2 items-center">
      <View
        className={`flex-row items-center gap-2 rounded-full px-3 py-1.5 ${config.bgClass}`}
      >
        <Icon size={14} color={config.color} />
        <Text className="text-xs font-medium" style={{ color: config.color }}>
          {content}
        </Text>
      </View>
    </View>
  )
}
