import { useState } from 'react'
import { LeaderboardHeader } from './components/leaderboard-header'
import { LeaderboardTabSwitcher } from './components/leaderboard-tab-switcher'
import { TradingLeaderboard } from './components/trading-leaderboard'
import { ReferralLeaderboard } from './components/referral-leaderboard'

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'trading' | 'referral'>('trading')

  return (
    <div className="space-y-6">
      {/* Header */}
      <LeaderboardHeader />

      {/* Tab Switcher */}
      <LeaderboardTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'trading' ? <TradingLeaderboard /> : <ReferralLeaderboard />}
    </div>
  )
}
