import { useState } from 'react'
import { LeaderboardHeader } from './components/leaderboard-header'
import { LeaderboardTabSwitcher } from './components/leaderboard-tab-switcher'
import { ReferralLeaderboard } from './components/referral-leaderboard'
import { TradingLeaderboard } from './components/trading-leaderboard'

export default function LeaderboardPage() {
  // In production mode, default to referral tab and hide trading tab
  const [activeTab, setActiveTab] = useState<'trading' | 'referral'>(
    'trading'
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <LeaderboardHeader />

      {/* Tab Switcher - hide if only one tab is available */}
        <LeaderboardTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Show only referral leaderboard in production mode */}
      {activeTab === 'trading' ? <TradingLeaderboard /> : <ReferralLeaderboard />}
    </div>
  )
}
