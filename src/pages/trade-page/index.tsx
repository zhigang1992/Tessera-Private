import { PriceChart } from './components/price-chart'
import { TokenSwapPanel } from './components/token-swap-panel'
import { TradeHistory } from './components/trade-history'

export default function TradePage() {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Header */}
      <h1 className="text-xl lg:text-2xl font-bold text-foreground dark:text-[#d2d2d2]">Trade</h1>

      {/* Main Section - Stack on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Left: Price Chart */}
        <PriceChart tokenSymbol="SOL" />

        {/* Right: Swap Panel */}
        <TokenSwapPanel />
      </div>

      {/* Trade History */}
      <TradeHistory />
    </div>
  )
}
