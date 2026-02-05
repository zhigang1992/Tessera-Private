import { useState } from 'react'
import { DashboardTabs } from './components/dashboard-tabs'
import { StatsCards } from './components/stats-cards'
import { AssetsTable } from './components/assets-table'
import { DashboardPriceChart } from './components/dashboard-price-chart'
import { AboutPanel } from './components/about-panel'
import { StatisticsPanel } from './components/statistics-panel'
import { MyBalanceCard } from './components/my-balance-card'
import { MyTradeHistory } from './components/my-trade-history'
import { TransparencyPanel } from './components/transparency-panel'
import { DEFAULT_BASE_TOKEN_ID, getAppToken } from '@/config'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('market-data')
  // Default to T-SpaceX token slug ('t-spacex')
  const defaultToken = getAppToken(DEFAULT_BASE_TOKEN_ID)
  const [selectedAsset, setSelectedAsset] = useState<string | null>(defaultToken.slug)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-foreground dark:text-[#d2d2d2]">Dashboard</h1>

      {/* Tabs */}
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content based on active tab */}
      {activeTab === 'market-data' && (
        <div className="flex flex-col gap-6">
          {/* Stats Cards */}
          <StatsCards />

          {/* Assets Table */}
          <AssetsTable selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />

          {/* Selected Asset Info - Show AboutPanel for selected token */}
          {selectedAsset && (
            <>
              <AboutPanel />
              <StatisticsPanel />
            </>
          )}

          {/* Price Chart */}
          <DashboardPriceChart />
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
