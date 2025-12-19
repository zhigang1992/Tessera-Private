import { PriceChart } from './components/price-chart'
import { TokenSwapPanel } from './components/token-swap-panel'
import { BalanceDisplay } from './components/balance-display'
import { TradeHistory } from './components/trade-history'

export default function TradePage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-black">Trade</h1>

      {/* Main Section */}
      <div className="flex flex-col gap-5">
        <div className="flex gap-6">
          {/* Left: Price Chart */}
          <div className="flex-1">
            <PriceChart />
          </div>

          {/* Right: Swap Panel + Balance */}
          <div className="flex-1 flex flex-col gap-2.5">
            <TokenSwapPanel />
            <BalanceDisplay />
          </div>
        </div>
      </div>

      {/* Trade History */}
      <TradeHistory />
    </div>
  )
}
