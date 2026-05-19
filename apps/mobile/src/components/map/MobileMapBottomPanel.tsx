import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LocateFixed, X } from 'lucide-react-native'
import type { ReactNode } from 'react'

export type MobileMapPanelItem = {
  id: string
  title: string
  subtitle?: string | null
}

export function MobileMapBottomPanel<TItem extends MobileMapPanelItem>({
  actions,
  bottomOffset,
  icon,
  items,
  onClose,
  onRefreshLocation,
  onSelectItem,
  renderItem,
  renderSelectedItem,
  selectedItem,
  title,
}: {
  actions?: ReactNode
  bottomOffset: number
  icon: ReactNode
  items: Array<TItem>
  onClose: () => void
  onRefreshLocation: () => void
  onSelectItem: (item: TItem) => void
  renderItem?: (item: TItem) => ReactNode
  renderSelectedItem?: (item: TItem) => ReactNode
  selectedItem?: TItem | null
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
              <LocateFixed color="#FAFAFA" size={19} />
            </Pressable>
            <Pressable
              accessibilityLabel="Close map"
              style={styles.closeButton}
              onPress={onClose}
            >
              <X color="#FAFAFA" size={18} />
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>

        {selectedItem && renderSelectedItem ? (
          renderSelectedItem(selectedItem)
        ) : (
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
                {renderItem ? (
                  renderItem(item)
                ) : (
                  <>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text style={styles.itemMeta} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </>
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  bottomPanel: {
    gap: 12,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(3,3,4,0.96)',
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.48,
    shadowRadius: 30,
    elevation: 18,
  },
  bottomHeader: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bottomTitle: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#0A0A0B',
  },
  closeButton: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#0A0A0B',
    paddingHorizontal: 14,
  },
  closeButtonText: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '700',
  },
  titleText: {
    color: '#FAFAFA',
    fontSize: 15,
    fontWeight: '800',
  },
  itemScroller: {
    gap: 10,
    paddingRight: 2,
  },
  itemChip: {
    width: 172,
    minHeight: 62,
    justifyContent: 'center',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#0A0A0B',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  itemTitle: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '800',
  },
  itemMeta: {
    marginTop: 3,
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
})
