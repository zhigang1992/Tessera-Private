import { cn } from '@/lib/utils'

interface LeaderboardTabSwitcherProps {
  activeTab: 'trading' | 'referral'
  onTabChange: (tab: 'trading' | 'referral') => void
}

export function LeaderboardTabSwitcher({ activeTab, onTabChange }: LeaderboardTabSwitcherProps) {
  return (
    <div className="w-full md:w-auto flex md:inline-flex items-center gap-1 rounded-xl bg-[#E4E4E7] dark:bg-[#1e1f20] px-2 py-1.5">
      <button
        onClick={() => onTabChange('trading')}
        className={cn(
          'flex-1 md:flex-initial rounded-md px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base font-medium transition-colors',
          activeTab === 'trading' ? 'bg-white dark:bg-[#323334] text-foreground dark:text-[#d2d2d2] shadow-sm' : 'text-muted-foreground dark:text-[#d2d2d2]/50 hover:text-foreground dark:hover:text-[#d2d2d2]',
        )}
      >
        Trading Leaderboard
      </button>
      <button
        onClick={() => onTabChange('referral')}
        className={cn(
          'flex-1 md:flex-initial rounded-md px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base font-medium transition-colors',
          activeTab === 'referral' ? 'bg-white dark:bg-[#323334] text-foreground dark:text-[#d2d2d2] shadow-sm' : 'text-muted-foreground dark:text-[#d2d2d2]/50 hover:text-foreground dark:hover:text-[#d2d2d2]',
        )}
      >
        Referral Leaderboard
      </button>
    </div>
  )
}
