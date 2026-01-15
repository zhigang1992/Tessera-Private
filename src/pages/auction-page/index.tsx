import { useState } from 'react'
import { AuctionTabs } from './components/auction/auction-tabs'
import { AuctionHeaderCard } from './components/auction/auction-header-card'
import { AuctionProgressCard } from './components/auction/auction-progress-card'
import { DepositUSDCCard } from './components/auction/deposit-usdc-card'
import { TokenInfoCard } from './components/auction/token-info-card'
import { VestingHeaderCard } from './components/vesting/vesting-header-card'
import { VestingChartCard } from './components/vesting/vesting-chart-card'
import { ClaimTokensCard } from './components/vesting/claim-tokens-card'

export default function AuctionPage() {
  const [activeTab, setActiveTab] = useState('auction')

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Header */}
      <h1 className="text-xl lg:text-2xl font-bold text-foreground">Auction</h1>

      {/* Tabs */}
      <AuctionTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Auction Tab Content */}
      {activeTab === 'auction' && (
        <div className="flex flex-col gap-4 lg:gap-6">
          {/* Auction Header Card */}
          <AuctionHeaderCard />

          {/* Bottom Section: Chart and Deposit - Mobile: stacked, Desktop: grid */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1.75fr_1fr] gap-4 lg:gap-6">
            {/* Deposit USDC Card - Shows first on mobile */}
            <div className="order-1 lg:order-2">
              <DepositUSDCCard />
            </div>

            {/* Auction Progress Chart - Shows second on mobile */}
            <div className="order-2 lg:order-1">
              <AuctionProgressCard />
            </div>
          </div>

          {/* Token Information */}
          <TokenInfoCard />
        </div>
      )}

      {/* Vesting Tab Content */}
      {activeTab === 'vesting' && (
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
      )}
    </div>
  )
}
