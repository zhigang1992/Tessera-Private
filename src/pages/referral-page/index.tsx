import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { ReferralHeader } from './components/referral-header'
import ReferralCodeModal from '@/features/referral/ui/referral-code-modal'
import { TabSwitcher } from './components/tab-switcher'
import { RewardsOverview } from './components/rewards-overview'
import { ReferralTree } from './components/referral-tree'
import { CodeSection } from './components/code-section'
import { RulesFaq } from './components/rules-faq'
import { TradersOverview } from './components/traders-overview'
import { TradingHistory } from './components/trading-history'
import { TradersRulesFaq } from './components/traders-rules-faq'
import { setCurrentWalletAddress, clearAffiliateStatsCache } from '@/services'

export default function ReferralPage() {
  const { publicKey } = useWallet()
  const [activeTab, setActiveTab] = useState<'affiliates' | 'traders'>('affiliates')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)

  // Set wallet address for service layer
  useEffect(() => {
    const walletAddress = publicKey?.toBase58() ?? null
    setCurrentWalletAddress(walletAddress)
    clearAffiliateStatsCache() // Clear cache when wallet changes
  }, [publicKey])

  // Handle ?code=xxx URL parameter for referral code binding
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    if (code) {
      setReferralCode(code)
      setIsModalOpen(true)
    }
  }, [])

  const clearCodeFromUrl = () => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('code')) return

    url.searchParams.delete('code')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setReferralCode(null)
    clearCodeFromUrl()
  }

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

      {/* Referral Code Bind Modal - triggered by ?code=xxx URL parameter */}
      {referralCode && (
        <ReferralCodeModal isOpen={isModalOpen} onClose={handleCloseModal} referralCode={referralCode} />
      )}
    </div>
  )
}
