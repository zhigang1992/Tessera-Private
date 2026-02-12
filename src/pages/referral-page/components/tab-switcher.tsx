import { cn } from '@/lib/utils'

interface TabSwitcherProps {
  activeTab: 'affiliates' | 'traders'
  onTabChange: (tab: 'affiliates' | 'traders') => void
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="w-full md:w-auto flex md:inline-flex items-center gap-1 rounded-xl bg-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.1)] p-1">
      <button
        onClick={() => onTabChange('affiliates')}
        className={cn(
          'flex-1 md:flex-initial rounded-md px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base font-medium transition-colors',
          activeTab === 'affiliates'
            ? 'bg-white dark:bg-[#D2FB95] text-black shadow-sm'
            : 'text-black dark:text-[#d2d2d2] opacity-50 dark:opacity-100 hover:bg-[rgba(255,255,255,0.3)] dark:hover:bg-[rgba(255,255,255,0.15)]'
        )}
      >
        Affiliates
      </button>
      <button
        onClick={() => onTabChange('traders')}
        className={cn(
          'flex-1 md:flex-initial rounded-md px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base font-medium transition-colors',
          activeTab === 'traders'
            ? 'bg-white dark:bg-[#D2FB95] text-black shadow-sm'
            : 'text-black dark:text-[#d2d2d2] opacity-50 dark:opacity-100 hover:bg-[rgba(255,255,255,0.3)] dark:hover:bg-[rgba(255,255,255,0.15)]'
        )}
      >
        Traders
      </button>
    </div>
  )
}
