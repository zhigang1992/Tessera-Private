import { useState } from 'react'
import { ReferralHeader } from './components/referral-header'
import { TabSwitcher } from './components/tab-switcher'
import { RewardsOverview } from './components/rewards-overview'
import { ReferralTree } from './components/referral-tree'
import { CodeSection } from './components/code-section'

export default function ReferralPage() {
  const [activeTab, setActiveTab] = useState<'affiliates' | 'traders'>('affiliates')

  return (
    <div className="space-y-6">
      {/* Header */}
      <ReferralHeader />

      {/* Tab Switcher */}
      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Rewards Overview */}
      <RewardsOverview />

      {/* Referral Tree + Table */}
      <ReferralTree />

      {/* Code Section */}
      <CodeSection />
    </div>
  )
}
