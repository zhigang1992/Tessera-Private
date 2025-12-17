import { useState } from 'react'
import { ReferralHeader } from './components/referral-header'
import { TabSwitcher } from './components/tab-switcher'
import { RewardsOverview } from './components/rewards-overview'
import { ReferralTree } from './components/referral-tree'
import { CodeSection } from './components/code-section'
import { RulesFaq } from './components/rules-faq'

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
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <p className="text-muted-foreground">Traders content coming soon...</p>
        </div>
      )}
    </div>
  )
}
