import { PriceChart } from './components/price-chart'
import { TokenSwapPanel } from './components/token-swap-panel'
import { TradeHistory } from './components/trade-history'
import { isTradingEnabledForPool } from '@/lib/solana/config'

export default function TradePage() {
  // Use T-SpaceX-USDC pool on devnet
  const tradingEnabled = isTradingEnabledForPool('T-SpaceX-USDC')

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Header */}
      <h1 className="text-xl lg:text-2xl font-bold text-foreground dark:text-[#d2d2d2]">Trade</h1>

      {/* Main Section - Stack on mobile, side by side on desktop */}
      <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
        {/* Left: Price Chart - 3 parts of 5 total (60%) - order-2 on mobile, order-1 on desktop */}
        <div className="w-full md:w-3/5 min-w-0 order-2 md:order-1">
          <PriceChart tokenSymbol="T-SpaceX" disabled={!tradingEnabled} />
        </div>

        {/* Right: Swap Panel - 2 parts of 5 total (40%) - order-1 on mobile, order-2 on desktop */}
        <div className="w-full md:w-2/5 flex-shrink-0 order-1 md:order-2">
          <TokenSwapPanel disabled={!tradingEnabled} />
        </div>
      </div>

      {/* Trade History - always shown regardless of trading enabled status */}
      <TradeHistory />
    </div>
  )
}
