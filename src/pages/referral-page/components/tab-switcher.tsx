import { cn } from '@/lib/utils'

interface TabSwitcherProps {
  activeTab: 'affiliates' | 'traders'
  onTabChange: (tab: 'affiliates' | 'traders') => void
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
      <button
        onClick={() => onTabChange('affiliates')}
        className={cn(
          'rounded-full px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'affiliates'
            ? 'bg-white text-black shadow-sm'
            : 'text-muted-foreground hover:text-black'
        )}
      >
        Affiliates
      </button>
      <button
        onClick={() => onTabChange('traders')}
        className={cn(
          'rounded-full px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'traders'
            ? 'bg-white text-black shadow-sm'
            : 'text-muted-foreground hover:text-black'
        )}
      >
        Traders
      </button>
    </div>
  )
}
