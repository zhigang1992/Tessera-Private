import { cn } from '@/lib/utils'

interface LeaderboardTabSwitcherProps {
  activeTab: 'trading' | 'referral'
  onTabChange: (tab: 'trading' | 'referral') => void
}

export function LeaderboardTabSwitcher({ activeTab, onTabChange }: LeaderboardTabSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-[#E4E4E7] px-2 py-1.5">
      <button
        onClick={() => onTabChange('trading')}
        className={cn(
          'rounded-md px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'trading' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-black',
        )}
      >
        Trading Leaderboard
      </button>
      <button
        onClick={() => onTabChange('referral')}
        className={cn(
          'rounded-md px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'referral' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-black',
        )}
      >
        Referral Leaderboard
      </button>
    </div>
  )
}
