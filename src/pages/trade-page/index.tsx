import { PriceChart } from './components/price-chart'
import { TokenSwapPanel } from './components/token-swap-panel'
import { TradeHistory } from './components/trade-history'

export default function TradePage() {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Header */}
      <h1 className="text-xl lg:text-2xl font-bold text-foreground dark:text-[#d2d2d2]">Trade</h1>

      {/* Main Section - Stack on mobile, side by side on desktop */}
      <div className="flex flex-col gap-4 lg:gap-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Left: Price Chart */}
          <div className="w-full lg:flex-1">
            <PriceChart tokenSymbol="SOL" />
          </div>

          {/* Right: Swap Panel */}
          <div className="w-full lg:flex-1 flex flex-col gap-2.5">
            <TokenSwapPanel />
          </div>
        </div>
      </div>

      {/* Trade History */}
      <TradeHistory />
    </div>
  )
}
