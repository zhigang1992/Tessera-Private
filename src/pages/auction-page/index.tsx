import { useState } from 'react'
import { AuctionTabs } from './components/auction/auction-tabs'
import { AuctionHeaderCard } from './components/auction/auction-header-card'
import { AuctionProgressCard } from './components/auction/auction-progress-card'
import { DepositUSDCCard } from './components/auction/deposit-usdc-card'
import { TokenInfoCard } from './components/auction/token-info-card'
import { VestingHeaderCard } from './components/vesting/vesting-header-card'
import { VestingChartCard } from './components/vesting/vesting-chart-card'
import { ClaimHeaderCard } from './components/vesting/claim-header-card'
import { ClaimTokensCard } from './components/vesting/claim-tokens-card'
import { ALPHA_VAULT_CONFIG } from '@/services/alpha-vault'

export default function AuctionPage() {
  const [activeTab, setActiveTab] = useState('auction')

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Header */}
      <h1 className="text-xl lg:text-2xl font-bold text-foreground dark:text-[#d2d2d2]">Auction</h1>

      {/* Tabs */}
      <AuctionTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Auction Tab Content */}
      {activeTab === 'auction' && (
        <div className="flex flex-col gap-4 lg:gap-6">
          {/* Auction Header Card */}
          <AuctionHeaderCard />

          {/* Bottom Section: Chart and Deposit - Mobile: stacked, Desktop: grid */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1.75fr_1fr] gap-4 lg:gap-6">
            {/* Auction Progress Chart - Shows second on mobile, first on desktop */}
            <div className="order-2 lg:order-1 min-w-0">
              <AuctionProgressCard />
            </div>

            {/* Deposit USDC Card - Shows first on mobile, second on desktop */}
            <div className="order-1 lg:order-2 min-w-0">
              <DepositUSDCCard />
            </div>
          </div>

          {/* Token Information */}
          <TokenInfoCard />
        </div>
      )}

      {/* Vesting/Claim Tab Content - Conditionally rendered based on config */}
      {activeTab === 'vesting' && (
        <>
          {ALPHA_VAULT_CONFIG.hasVestingPeriod ? (
            // Vesting layout: Header + Chart + Claim (3 cards)
            <div className="flex flex-col gap-4 lg:gap-6">
              {/* Vesting Header Card */}
              <VestingHeaderCard />

              {/* Charts Section - Mobile: Claim first, Desktop: Chart first */}
              <div className="flex flex-col lg:grid lg:grid-cols-[1.75fr_1fr] gap-4 lg:gap-6">
                {/* Claim Tokens Card - Shows first on mobile */}
                <div className="order-1 lg:order-2">
                  <ClaimTokensCard />
                </div>

                {/* Release Schedule Chart - Shows second on mobile */}
                <div className="order-2 lg:order-1">
                  <VestingChartCard />
                </div>
              </div>
            </div>
          ) : (
            // Claim layout: Final Allocation + Claim Tokens (2 cards, side by side)
            <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
              {/* Left Panel - Your Final Allocation */}
              <div className="w-full md:basis-0 md:grow order-2 md:order-1">
                <ClaimHeaderCard />
              </div>

              {/* Right Panel - Claim Tokens */}
              <div className="w-full md:w-[400px] order-1 md:order-2">
                <ClaimTokensCard />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
