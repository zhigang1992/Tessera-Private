import { cn } from '@/lib/utils'

interface TabSwitcherProps {
  activeTab: 'affiliates' | 'traders'
  onTabChange: (tab: 'affiliates' | 'traders') => void
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-[#E4E4E7] dark:bg-[#27272A] px-2 py-1.5">
      <button
        onClick={() => onTabChange('affiliates')}
        className={cn(
          'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'affiliates'
            ? 'bg-white dark:bg-[#3F3F46] text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Affiliates
      </button>
      <button
        onClick={() => onTabChange('traders')}
        className={cn(
          'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'traders'
            ? 'bg-white dark:bg-[#3F3F46] text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Traders
      </button>
    </div>
  )
}
