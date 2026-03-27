import { useState } from 'react'
import { LEADERBOARD_MAINTENANCE } from '@/config'
import { LeaderboardHeader } from './components/leaderboard-header'
import { LeaderboardTabSwitcher } from './components/leaderboard-tab-switcher'
import { TradingLeaderboard } from './components/trading-leaderboard'
import { ReferralLeaderboard } from './components/referral-leaderboard'

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'trading' | 'referral'>('trading')

  return (
    <div className="space-y-6">
      <LeaderboardHeader />

      {LEADERBOARD_MAINTENANCE ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl bg-white dark:bg-[#111111]">
          <div className="text-center space-y-3 px-6">
            <p className="text-4xl">🔧</p>
            <h2 className="text-xl font-semibold text-foreground dark:text-[#d2d2d2]">
              Leaderboard is Under Maintenance
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              We're making some improvements to the leaderboard. It will be back
              shortly. Thanks for your patience!
            </p>
          </div>
        </div>
      ) : (
        <>
          <LeaderboardTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === 'trading' ? <TradingLeaderboard /> : <ReferralLeaderboard />}
        </>
      )}
    </div>
  )
}
