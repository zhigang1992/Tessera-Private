import { cn } from '@/lib/utils'

interface LeaderboardTabSwitcherProps {
  activeTab: 'trading' | 'referral'
  onTabChange: (tab: 'trading' | 'referral') => void
}

export function LeaderboardTabSwitcher({ activeTab, onTabChange }: LeaderboardTabSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-[#E4E4E7] dark:bg-[#27272A] px-2 py-1.5">
      <button
        onClick={() => onTabChange('trading')}
        className={cn(
          'rounded-md px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'trading' ? 'bg-white dark:bg-[#3F3F46] text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Trading Leaderboard
      </button>
      <button
        onClick={() => onTabChange('referral')}
        className={cn(
          'rounded-md px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'referral' ? 'bg-white dark:bg-[#3F3F46] text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Referral Leaderboard
      </button>
    </div>
  )
}
