import { useState } from 'react'
import { DashboardTabs } from './components/dashboard-tabs'
import { StatsCards } from './components/stats-cards'
import { DashboardPriceChart } from './components/dashboard-price-chart'
import { AboutPanel } from './components/about-panel'
import { StatisticsPanel } from './components/statistics-panel'
import { MyBalanceCard } from './components/my-balance-card'
import { MyTradeHistory } from './components/my-trade-history'
import { TransparencyPanel } from './components/transparency-panel'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('market-data')

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Header */}
      <h1 className="text-xl lg:text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Tabs */}
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content based on active tab */}
      {activeTab === 'market-data' && (
        <div className="flex flex-col gap-4 lg:gap-6">
          {/* Stats Cards */}
          <StatsCards />

          {/* Price Chart */}
          <DashboardPriceChart />

          {/* About Panel */}
          <AboutPanel />

          {/* Statistics Panel */}
          <StatisticsPanel />
        </div>
      )}

      {activeTab === 'my-dashboard' && (
        <div className="flex flex-col gap-4 lg:gap-6">
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
