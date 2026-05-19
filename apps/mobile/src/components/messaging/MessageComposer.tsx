import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { EyeOff, Plus, Send, X } from 'lucide-react-native'
import { useEffect, useMemo, useRef } from 'react'
import Svg, { Circle } from 'react-native-svg'
import type { ReactNode, RefObject } from 'react'

interface PendingMedia {
  uri: string
}

interface ComposerControlState {
  canSubmit: boolean
  disabled: boolean
}

interface Props {
  value: string
  onChangeText: (value: string) => void
  onSend: () => void
  placeholder: string
  canSubmit: boolean
  disabled?: boolean
  inputRef?: RefObject<TextInput | null>
  autoFocus?: boolean
  maxLength?: number
  characterLimit?: number
  characterLimitDisplay?: 'inline' | 'floatingRing'
  leading?: ReactNode
  renderLeading?: (floatingCharacterLimit: ReactNode) => ReactNode
  pendingMedia?: PendingMedia | null
  onPressLeadingControl?: () => void
  onRemoveMedia?: () => void
  anonymous?: boolean
  anonymousLabel?: string
  sendLabel?: string
  renderTrailingControl?: (state: ComposerControlState) => ReactNode
  horizontalPadding?: number
  topPadding?: number
  bottomPadding?: number
}

export function MessageComposer({
  value,
  onChangeText,
  onSend,
  placeholder,
  canSubmit,
  disabled = false,
  inputRef,
  autoFocus,
  maxLength,
  characterLimit,
  characterLimitDisplay = 'inline',
  leading,
  renderLeading,
  pendingMedia,
  onPressLeadingControl,
  onRemoveMedia,
  anonymous,
  anonymousLabel = 'Chatting anonymously',
  sendLabel,
  renderTrailingControl,
  horizontalPadding = 16,
  topPadding = 8,
  bottomPadding = 10,
}: Props) {
  const controlState = { canSubmit, disabled }
  const floatingCharacterLimit =
    characterLimit !== undefined && characterLimitDisplay === 'floatingRing' ? (
      <FloatingCharacterLimitRing
        count={value.length}
        limit={characterLimit}
      />
    ) : null

  return (
    <View
      style={{
        backgroundColor: '#000000',
        paddingHorizontal: horizontalPadding,
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
      }}
    >
      {anonymous ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-start',
            borderRadius: 999,
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginBottom: 8,
          }}
        >
          <EyeOff color="#a78bfa" size={13} />
          <Text style={{ color: '#c4b5fd', fontSize: 12, fontWeight: '600' }}>
            {anonymousLabel}
          </Text>
        </View>
      ) : null}

      {pendingMedia ? (
        <View
          style={{
            overflow: 'hidden',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#2F3336',
            backgroundColor: '#16181C',
            marginBottom: 12,
          }}
        >
          <ExpoImage
            source={{ uri: pendingMedia.uri }}
            contentFit="cover"
            style={{ width: '100%', height: 180 }}
          />
          {onRemoveMedia ? (
            <Pressable
              onPress={onRemoveMedia}
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                backgroundColor: 'rgba(0,0,0,0.75)',
              }}
            >
              <X color="#FAFAFA" size={18} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {onPressLeadingControl ? (
          <View style={{ width: 48, height: 48 }}>
            <Pressable
              onPress={onPressLeadingControl}
              disabled={disabled}
              style={{
                position: 'relative',
                width: 48,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 24,
                backgroundColor: '#16181C',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <Plus
                color={disabled ? '#666666' : '#FAFAFA'}
                size={28}
                strokeWidth={2}
              />
              {floatingCharacterLimit}
            </Pressable>
          </View>
        ) : null}
        {renderLeading ? (
          <View style={{ width: 48, height: 48 }}>
            {renderLeading(floatingCharacterLimit)}
          </View>
        ) : leading ? (
          <View style={{ width: 48, height: 48 }}>
            {leading}
            {onPressLeadingControl ? null : floatingCharacterLimit}
          </View>
        ) : null}
        <View
          style={{
            minHeight: 48,
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderRadius: 24,
            backgroundColor: '#16181C',
            paddingLeft: 16,
            paddingRight: 10,
          }}
        >
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#8B8F96"
            multiline
            autoFocus={autoFocus}
            editable={!disabled}
            maxLength={maxLength}
            style={{
              flex: 1,
              color: '#FAFAFA',
              fontSize: 16,
              maxHeight: 96,
              minHeight: 38,
              paddingTop: 8,
              paddingBottom: 8,
              paddingHorizontal: 0,
            }}
          />
          {renderTrailingControl ? (
            renderTrailingControl(controlState)
          ) : (
            <Pressable
              onPress={onSend}
              disabled={!canSubmit}
              style={{
                minWidth: sendLabel ? 52 : 40,
                height: 40,
                paddingHorizontal: sendLabel ? 10 : 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
              }}
            >
              {disabled ? (
                <ActivityIndicator size="small" color="#F11A23" />
              ) : sendLabel ? (
                <Text
                  style={{
                    color: canSubmit ? '#F11A23' : '#666666',
                    fontSize: 14,
                    fontWeight: '700',
                  }}
                >
                  {sendLabel}
                </Text>
              ) : (
                <Send color={canSubmit ? '#F11A23' : '#666666'} size={20} />
              )}
            </Pressable>
          )}
        </View>
      </View>

      {characterLimit !== undefined && characterLimitDisplay === 'inline' ? (
        <Text
          style={{
            color: '#71767B',
            fontSize: 11,
            marginTop: 6,
            alignSelf: 'flex-end',
          }}
        >
          {value.length}/{characterLimit}
        </Text>
      ) : null}
    </View>
  )
}

function FloatingCharacterLimitRing({
  count,
  limit,
}: {
  count: number
  limit: number
}) {
  const progress = Math.min(count / limit, 1)
  const remaining = limit - count
  const warn = remaining <= 20 && remaining > 0
  const over = remaining <= 0
  const shouldShow = remaining <= 35
  const radius = 10
  const strokeWidth = 2.25
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)
  const visibility = useRef(new Animated.Value(0)).current
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ringColor = over ? '#ef4444' : warn ? '#eab308' : '#FFFFFF'
  const countColor = over ? '#ef4444' : warn ? '#eab308' : '#FAFAFA'
  const countLabel = remaining < 0 ? `-${Math.abs(remaining)}` : `${remaining}`
  const animatedStyle = useMemo(
    () => ({
      opacity: visibility,
      transform: [
        {
          scale: visibility.interpolate({
            inputRange: [0, 1],
            outputRange: [0.82, 1],
          }),
        },
      ],
    }),
    [visibility],
  )

  useEffect(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    Animated.timing(visibility, {
      toValue: shouldShow ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start()

    if (shouldShow && !over) {
      hideTimeoutRef.current = setTimeout(() => {
        Animated.timing(visibility, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }).start()
      }, 2500)
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }
    }
  }, [count, over, shouldShow, visibility])

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 24,
          backgroundColor: '#16181C',
        },
        animatedStyle,
      ]}
    >
      <Svg
        pointerEvents="none"
        width={36}
        height={36}
        viewBox="0 0 24 24"
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={12}
          cy={12}
          r={radius}
          fill="none"
          stroke="#2F3336"
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={12}
          cy={12}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      <Text
        pointerEvents="none"
        style={{
          position: 'absolute',
          color: countColor,
          fontSize: countLabel.length >= 3 ? 9 : 10,
          fontWeight: '700',
          fontVariant: ['tabular-nums'],
        }}
      >
        {countLabel}
      </Text>
    </Animated.View>
  )
}
