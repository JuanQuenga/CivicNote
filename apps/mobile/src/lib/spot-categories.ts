import {
  Beer,
  BookOpen,
  Droplets,
  Dumbbell,
  Flame,
  MapPin,
  ParkingCircle,
  Toilet,
  Trees,
  Waves,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'

export type SpotCategory =
  | 'park'
  | 'restroom'
  | 'gym'
  | 'bar'
  | 'bookstore'
  | 'bathhouse'
  | 'sauna'
  | 'beach'
  | 'rest_stop'
  | 'other'

export type SpotCategoryColor =
  | 'emerald'
  | 'slate'
  | 'orange'
  | 'amber'
  | 'indigo'
  | 'blue'
  | 'red'
  | 'cyan'
  | 'violet'
  | 'zinc'

export interface SpotCategoryMeta {
  label: string
  icon: LucideIcon
  color: SpotCategoryColor
}

export const SPOT_CATEGORIES: Record<SpotCategory, SpotCategoryMeta> = {
  park: { label: 'Park', icon: Trees, color: 'emerald' },
  restroom: { label: 'Restroom', icon: Toilet, color: 'slate' },
  gym: { label: 'Gym', icon: Dumbbell, color: 'orange' },
  bar: { label: 'Bar', icon: Beer, color: 'amber' },
  bookstore: { label: 'Bookstore', icon: BookOpen, color: 'indigo' },
  bathhouse: { label: 'Bathhouse', icon: Droplets, color: 'blue' },
  sauna: { label: 'Sauna', icon: Flame, color: 'red' },
  beach: { label: 'Beach', icon: Waves, color: 'cyan' },
  rest_stop: { label: 'Rest Stop', icon: ParkingCircle, color: 'violet' },
  other: { label: 'Other', icon: MapPin, color: 'zinc' },
}

export const SPOT_CATEGORY_OPTIONS: Array<{
  value: SpotCategory
  label: string
}> = (
  Object.entries(SPOT_CATEGORIES) as Array<[SpotCategory, SpotCategoryMeta]>
).map(([value, meta]) => ({ value, label: meta.label }))

export function getSpotCategoryMeta(category: string): SpotCategoryMeta {
  return SPOT_CATEGORIES[category as SpotCategory] ?? SPOT_CATEGORIES.other
}

interface CategoryColorTokens {
  bg: string
  fg: string
  border: string
  heroFrom: string
  heroTo: string
}

export const CATEGORY_COLOR_TOKENS: Record<
  SpotCategoryColor,
  CategoryColorTokens
> = {
  emerald: {
    bg: 'rgba(16, 185, 129, 0.15)',
    fg: '#34d399',
    border: 'rgba(16, 185, 129, 0.3)',
    heroFrom: 'rgba(16, 185, 129, 0.35)',
    heroTo: 'rgba(0, 0, 0, 0)',
  },
  slate: {
    bg: 'rgba(100, 116, 139, 0.15)',
    fg: '#94a3b8',
    border: 'rgba(100, 116, 139, 0.3)',
    heroFrom: 'rgba(100, 116, 139, 0.35)',
    heroTo: 'rgba(0, 0, 0, 0)',
  },
  orange: {
    bg: 'rgba(249, 115, 22, 0.15)',
    fg: '#fb923c',
    border: 'rgba(249, 115, 22, 0.3)',
    heroFrom: 'rgba(249, 115, 22, 0.35)',
    heroTo: 'rgba(0, 0, 0, 0)',
  },
  amber: {
    bg: 'rgba(245, 158, 11, 0.15)',
    fg: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.3)',
    heroFrom: 'rgba(245, 158, 11, 0.35)',
    heroTo: 'rgba(0, 0, 0, 0)',
  },
  indigo: {
    bg: 'rgba(99, 102, 241, 0.15)',
    fg: '#818cf8',
    border: 'rgba(99, 102, 241, 0.3)',
    heroFrom: 'rgba(99, 102, 241, 0.35)',
    heroTo: 'rgba(0, 0, 0, 0)',
  },
  blue: {
    bg: 'rgba(59, 130, 246, 0.15)',
    fg: '#60a5fa',
    border: 'rgba(59, 130, 246, 0.3)',
    heroFrom: 'rgba(59, 130, 246, 0.35)',
    heroTo: 'rgba(0, 0, 0, 0)',
  },
  red: {
    bg: 'rgba(239, 68, 68, 0.15)',
    fg: '#f87171',
    border: 'rgba(239, 68, 68, 0.3)',
    heroFrom: 'rgba(239, 68, 68, 0.35)',
    heroTo: 'rgba(0, 0, 0, 0)',
  },
  cyan: {
    bg: 'rgba(6, 182, 212, 0.15)',
    fg: '#22d3ee',
    border: 'rgba(6, 182, 212, 0.3)',
    heroFrom: 'rgba(6, 182, 212, 0.35)',
    heroTo: 'rgba(0, 0, 0, 0)',
  },
  violet: {
    bg: 'rgba(139, 92, 246, 0.15)',
    fg: '#a78bfa',
    border: 'rgba(139, 92, 246, 0.3)',
    heroFrom: 'rgba(139, 92, 246, 0.35)',
    heroTo: 'rgba(0, 0, 0, 0)',
  },
  zinc: {
    bg: 'rgba(113, 113, 122, 0.15)',
    fg: '#a1a1aa',
    border: 'rgba(113, 113, 122, 0.3)',
    heroFrom: 'rgba(113, 113, 122, 0.35)',
    heroTo: 'rgba(0, 0, 0, 0)',
  },
}

export interface ActivityLevel {
  level: 'cold' | 'warm' | 'hot'
  label: string
  bg: string
  fg: string
  border: string
}

export function getActivityLevel(count: number): ActivityLevel | null {
  if (count <= 0) return null
  if (count >= 5) {
    return {
      level: 'hot',
      label: 'Hot',
      bg: 'rgba(239, 68, 68, 0.15)',
      fg: '#f87171',
      border: 'rgba(239, 68, 68, 0.3)',
    }
  }
  if (count >= 2) {
    return {
      level: 'warm',
      label: 'Warm',
      bg: 'rgba(249, 115, 22, 0.15)',
      fg: '#fb923c',
      border: 'rgba(249, 115, 22, 0.3)',
    }
  }
  return {
    level: 'cold',
    label: 'Cold',
    bg: 'rgba(113, 113, 122, 0.15)',
    fg: '#a1a1aa',
    border: 'rgba(113, 113, 122, 0.3)',
  }
}
