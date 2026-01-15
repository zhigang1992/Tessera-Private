import { useState } from 'react'
import { AuctionTabs } from './components/auction-tabs'
import { AuctionHeaderCard } from './components/auction-header-card'
import { AuctionProgressCard } from './components/auction-progress-card'
import { DepositUSDCCard } from './components/deposit-usdc-card'
import { TokenInfoCard } from './components/token-info-card'
import { VestingHeaderCard } from './components/vesting-header-card'
import { VestingChartCard } from './components/vesting-chart-card'
import { ClaimTokensCard } from './components/claim-tokens-card'

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

          {/* Bottom Section: Chart and Deposit */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.75fr_1fr] gap-4 lg:gap-6">
            {/* Auction Progress Chart */}
            <AuctionProgressCard />

            {/* Deposit USDC Card */}
            <DepositUSDCCard />
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

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.75fr_1fr] gap-4 lg:gap-6">
            {/* Release Schedule Chart */}
            <VestingChartCard />

            {/* Claim Tokens Card */}
            <ClaimTokensCard />
          </div>
        </div>
      )}
    </div>
  )
}
