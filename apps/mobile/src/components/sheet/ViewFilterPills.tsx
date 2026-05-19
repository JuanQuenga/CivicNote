import { MobilePageTabs } from '../navigation/MobilePageTabs'

type ViewFilter = 'all' | 'spots' | 'meetups'

interface ViewFilterPillsProps {
  value: ViewFilter
  onChange: (value: ViewFilter) => void
}

const FILTERS: Array<{ value: ViewFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'spots', label: 'Spots' },
  { value: 'meetups', label: 'Meetups' },
]

export function ViewFilterPills({ value, onChange }: ViewFilterPillsProps) {
  return <MobilePageTabs tabs={FILTERS} value={value} onChange={onChange} />
}
