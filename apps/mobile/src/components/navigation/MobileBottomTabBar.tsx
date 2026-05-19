import { useRouter } from 'expo-router'
import { Images, MapPin, MessageCircle, Users } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BarnIcon } from '../icons/BarnIcon'

export type MobileBottomTabRoute =
  | 'map'
  | 'members'
  | 'barn'
  | 'messages'
  | 'photos'

const ACTIVE_COLOR = '#E7E9EA'
const INACTIVE_COLOR = '#8B98A5'

interface MobileBottomTabBarProps {
  activeRoute?: MobileBottomTabRoute
}

export function MobileBottomTabBar({ activeRoute }: MobileBottomTabBarProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const navigate = (target: MobileBottomTabRoute) => {
    router.replace(`/(tabs)/${target}` as never)
  }

  const colorFor = (target: MobileBottomTabRoute) =>
    target === activeRoute ? ACTIVE_COLOR : INACTIVE_COLOR

  return (
    <View
      style={{
        height: 48 + insets.bottom,
        paddingBottom: insets.bottom,
        paddingTop: 4,
        backgroundColor: '#000000',
      }}
      className="flex-row items-stretch"
    >
      <Pressable
        className="flex-1 items-center justify-center"
        onPress={() => navigate('map')}
      >
        <MapPin color={colorFor('map')} size={24} strokeWidth={2.2} />
      </Pressable>
      <Pressable
        className="flex-1 items-center justify-center"
        onPress={() => navigate('members')}
      >
        <Users color={colorFor('members')} size={24} strokeWidth={2.2} />
      </Pressable>
      <Pressable
        className="flex-1 items-center justify-center"
        onPress={() => navigate('barn')}
      >
        <BarnIcon color={colorFor('barn')} size={24} />
      </Pressable>
      <Pressable
        className="flex-1 items-center justify-center"
        onPress={() => navigate('messages')}
      >
        <MessageCircle
          color={colorFor('messages')}
          size={24}
          strokeWidth={2.2}
        />
      </Pressable>
      <Pressable
        className="flex-1 items-center justify-center"
        onPress={() => navigate('photos')}
      >
        <Images color={colorFor('photos')} size={24} strokeWidth={2.2} />
      </Pressable>
    </View>
  )
}
