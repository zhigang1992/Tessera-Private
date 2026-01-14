import { useState } from 'react'
import { ReferralHeader } from './components/referral-header'
import { TabSwitcher } from './components/tab-switcher'
import { RewardsOverview } from './components/rewards-overview'
import { ReferralTree } from './components/referral-tree'
import { CodeSection } from './components/code-section'
import { RulesFaq } from './components/rules-faq'
import { TradersOverview } from './components/traders-overview'
import { TradingHistory } from './components/trading-history'
import { TradersRulesFaq } from './components/traders-rules-faq'

export default function ReferralPage() {
  const [activeTab, setActiveTab] = useState<'affiliates' | 'traders'>('affiliates')

  return (
    <div className="space-y-6">
      {/* Header */}
      <ReferralHeader />

      {/* Tab Switcher */}
      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'affiliates' ? (
        <>
          {/* Rewards Overview */}
          <RewardsOverview />

          {/* Referral Tree + Table */}
          <ReferralTree />

          {/* Code Section */}
          <CodeSection />

          {/* Rules & FAQ */}
          <RulesFaq />
        </>
      ) : (
        <>
          {/* Traders Overview */}
          <TradersOverview />

          {/* Trading History */}
          <TradingHistory />

          {/* Rules & FAQ */}
          <TradersRulesFaq />
        </>
      )}
    </div>
  )
}
