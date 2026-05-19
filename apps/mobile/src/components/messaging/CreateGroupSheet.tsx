import { useAction, useQuery } from 'convex/react'
import { Check, Search, Users, X } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '@/src/lib/convexApi'
import { Avatar } from '../ui/Avatar'
import type { Id } from '@/src/lib/convexApi'

interface CreateGroupSheetProps {
  visible: boolean
  onClose: () => void
  onCreated: (conversationId: Id<'conversations'>) => void
}

type Candidate = {
  _id: Id<'users'>
  name: string
  imageUrl?: string
  imageIsNsfw?: boolean
  isOnline?: boolean
}

const MIN_PARTICIPANTS = 2
const MAX_PARTICIPANTS = 24

export function CreateGroupSheet({
  visible,
  onClose,
  onCreated,
}: CreateGroupSheetProps) {
  const [step, setStep] = useState<'members' | 'details'>('members')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Map<Id<'users'>, Candidate>>(
    new Map(),
  )
  const [groupName, setGroupName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const recentPartners = useQuery(
    api.messages.getRecentInteractionPartners,
    visible ? { limit: 30 } : 'skip',
  )
  const searchResults = useQuery(
    api.members.searchUsers,
    visible && search.trim().length >= 2
      ? { query: search, limit: 30 }
      : 'skip',
  )
  const createGroup = useAction(api.groupChats.createGroupChat)

  useEffect(() => {
    if (!visible) {
      setStep('members')
      setSearch('')
      setSelected(new Map())
      setGroupName('')
      setIsCreating(false)
    }
  }, [visible])

  const candidates = useMemo<Array<Candidate>>(() => {
    if (search.trim().length >= 2) {
      return (searchResults ?? []) as Array<Candidate>
    }
    return (recentPartners ?? []) as Array<Candidate>
  }, [recentPartners, search, searchResults])

  const toggleSelect = (candidate: Candidate) => {
    setSelected((current) => {
      const next = new Map(current)
      if (next.has(candidate._id)) {
        next.delete(candidate._id)
      } else if (next.size >= MAX_PARTICIPANTS) {
        return next
      } else {
        next.set(candidate._id, candidate)
      }
      return next
    })
  }

  const handleCreate = async () => {
    if (selected.size < MIN_PARTICIPANTS) {
      Alert.alert(
        'Add more members',
        `Groups need at least ${MIN_PARTICIPANTS + 1} people including you.`,
      )
      return
    }
    if (!groupName.trim()) {
      Alert.alert('Name required', 'Give your group a name.')
      return
    }

    try {
      setIsCreating(true)
      const conversationId = await createGroup({
        name: groupName.trim(),
        participantIds: Array.from(selected.keys()),
      })
      onCreated(conversationId)
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not create group'
      Alert.alert('Create failed', message)
    } finally {
      setIsCreating(false)
    }
  }

  const selectedArray = Array.from(selected.values())
  const canContinue = selected.size >= MIN_PARTICIPANTS

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
          <Pressable
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-full"
          >
            <X size={20} color="#FAFAFA" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">
              {step === 'members' ? 'New group' : 'Name your group'}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {step === 'members'
                ? `${selected.size}/${MAX_PARTICIPANTS} selected`
                : `${selected.size + 1} members`}
            </Text>
          </View>
          {step === 'members' ? (
            <Pressable
              onPress={() => setStep('details')}
              disabled={!canContinue}
              className="rounded-full bg-primary px-4 py-2"
              style={{ opacity: canContinue ? 1 : 0.4 }}
            >
              <Text className="text-sm font-semibold text-primary-foreground">
                Next
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => void handleCreate()}
              disabled={isCreating || !groupName.trim()}
              className="rounded-full bg-primary px-4 py-2"
              style={{
                opacity: isCreating || !groupName.trim() ? 0.4 : 1,
              }}
            >
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-sm font-semibold text-primary-foreground">
                  Create
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {step === 'members' ? (
          <>
            <View className="px-4 pt-3">
              <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                <Search size={16} color="#999999" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search members"
                  placeholderTextColor="#999999"
                  className="flex-1 text-base text-foreground"
                  autoCorrect={false}
                />
              </View>
              {selectedArray.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={selectedArray}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => toggleSelect(item)}
                      className="items-center"
                      style={{ width: 64 }}
                    >
                      <View className="relative">
                        <Avatar
                          imageUrl={item.imageUrl}
                          name={item.name}
                          size="md"
                        />
                        <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-card">
                          <X size={12} color="#FAFAFA" />
                        </View>
                      </View>
                      <Text
                        className="mt-1 w-full text-center text-xs text-foreground"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  )}
                />
              ) : null}
            </View>
            <FlatList
              data={candidates}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              ListEmptyComponent={
                candidates === undefined ||
                (search.trim().length >= 2 && searchResults === undefined) ? (
                  <View className="mt-8 items-center">
                    <ActivityIndicator color="#F11A23" />
                  </View>
                ) : (
                  <View className="mt-12 items-center px-8">
                    <Users size={32} color="#999999" />
                    <Text className="mt-3 text-center text-sm text-muted-foreground">
                      {search.trim().length >= 2
                        ? 'No members found.'
                        : 'Start typing to find someone.'}
                    </Text>
                  </View>
                )
              }
              renderItem={({ item }) => {
                const isSelected = selected.has(item._id)
                return (
                  <Pressable
                    onPress={() => toggleSelect(item)}
                    className="mb-1 flex-row items-center gap-3 rounded-xl px-2 py-2.5"
                  >
                    <Avatar
                      imageUrl={item.imageUrl}
                      name={item.name}
                      size="md"
                      showOnlineIndicator
                      isOnline={item.isOnline}
                    />
                    <Text className="flex-1 text-base font-medium text-foreground">
                      {item.name}
                    </Text>
                    <View
                      className={
                        isSelected
                          ? 'h-6 w-6 items-center justify-center rounded-full bg-primary'
                          : 'h-6 w-6 items-center justify-center rounded-full border border-border'
                      }
                    >
                      {isSelected ? <Check size={14} color="#FFFFFF" /> : null}
                    </View>
                  </Pressable>
                )
              }}
            />
          </>
        ) : (
          <View className="px-4 pt-4">
            <Text className="text-xs font-semibold uppercase text-muted-foreground">
              Group name
            </Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="e.g. Friday Plans"
              placeholderTextColor="#999999"
              autoFocus
              maxLength={50}
              className="mt-2 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
            />
            <Text className="mt-3 text-xs text-muted-foreground">
              {groupName.length}/50
            </Text>

            <Text className="mt-6 text-xs font-semibold uppercase text-muted-foreground">
              Members
            </Text>
            <View className="mt-2 rounded-xl border border-border bg-card">
              {selectedArray.map((member) => (
                <View
                  key={member._id}
                  className="flex-row items-center gap-3 border-b border-border px-3 py-2.5"
                >
                  <Avatar
                    imageUrl={member.imageUrl}
                    name={member.name}
                    size="sm"
                  />
                  <Text className="flex-1 text-sm font-medium text-foreground">
                    {member.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  )
}
