import { AppTokenId, DEFAULT_BASE_TOKEN_ID } from '@/config'
import { useState } from 'react'
import { AboutPanel } from './components/about-panel'
import { AssetsTable } from './components/assets-table'
import { DashboardPriceChart } from './components/dashboard-price-chart'
import { DashboardTabs } from './components/dashboard-tabs'
import { MyBalanceCard } from './components/my-balance-card'
import { MyTradeHistory } from './components/my-trade-history'
import { StatisticsPanel } from './components/statistics-panel'
import { StatsCards } from './components/stats-cards'
import { TransparencyPanel } from './components/transparency-panel'

export default function DashboardPage() {
  // In production mode, default to transparency tab
  const [activeTab, setActiveTab] = useState('market-data')
  // Default to T-SpaceX token ID
  const [selectedTokenId, setSelectedTokenId] = useState<AppTokenId>(DEFAULT_BASE_TOKEN_ID)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-foreground dark:text-[#d2d2d2]">Dashboard</h1>

      {/* Tabs - hide if only one tab is available */}
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content based on active tab */}
      {activeTab === 'market-data' && (
        <div className="flex flex-col gap-6">
          {/* Stats Cards */}
          <StatsCards />

          {/* Assets Table */}
          <AssetsTable selectedTokenId={selectedTokenId} onSelectToken={setSelectedTokenId} />

          {/* Price Chart */}
          <DashboardPriceChart />

          {/* Selected Asset Info - Show AboutPanel for selected token */}
          {selectedTokenId && (
            <>
              <AboutPanel tokenId={selectedTokenId} />
              <StatisticsPanel tokenId={selectedTokenId} />
            </>
          )}
        </div>
      )}

      {activeTab === 'my-dashboard' && (
        <div className="flex flex-col gap-6">
          {/* My Balance Card */}
          <MyBalanceCard />

          {/* My Trade History */}
          <MyTradeHistory />
        </div>
      )}

      {activeTab === 'transparency' && <TransparencyPanel />}
    </div>
  )
}
