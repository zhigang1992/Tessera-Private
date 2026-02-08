import { useState } from 'react'
import { LeaderboardHeader } from './components/leaderboard-header'
import { LeaderboardTabSwitcher } from './components/leaderboard-tab-switcher'
import { TradingLeaderboard } from './components/trading-leaderboard'
import { ReferralLeaderboard } from './components/referral-leaderboard'
import { PRODUCTION_MODE } from '@/config'

export default function LeaderboardPage() {
  // In production mode, default to referral tab and hide trading tab
  const [activeTab, setActiveTab] = useState<'trading' | 'referral'>(
    PRODUCTION_MODE ? 'referral' : 'trading'
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <LeaderboardHeader />

      {/* Tab Switcher - hide if only one tab is available */}
      {!PRODUCTION_MODE && (
        <LeaderboardTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Show only referral leaderboard in production mode */}
      {PRODUCTION_MODE ? (
        <ReferralLeaderboard />
      ) : (
        activeTab === 'trading' ? <TradingLeaderboard /> : <ReferralLeaderboard />
      )}
    </div>
  )
}
