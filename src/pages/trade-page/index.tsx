import { PriceChart } from './components/price-chart'
import { TokenSwapPanel } from './components/token-swap-panel'
import { TradeHistory } from './components/trade-history'
import { isTradingEnabled } from '@/lib/solana/config'

export default function TradePage() {
  const tradingEnabled = isTradingEnabled()

  if (!tradingEnabled) {
    return (
      <div className="flex flex-col gap-4 lg:gap-6">
        {/* Header */}
        <h1 className="text-xl lg:text-2xl font-bold text-foreground dark:text-[#d2d2d2]">Trade</h1>

        {/* Disabled State */}
        <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
          {/* Left: Chart placeholder */}
          <div className="w-full md:w-3/5 min-w-0 order-2 md:order-1">
            <PriceChart tokenSymbol="TESS" disabled />
          </div>

          {/* Right: Disabled message */}
          <div className="w-full md:w-2/5 flex-shrink-0 order-1 md:order-2">
            <div className="h-full rounded-2xl p-6 lg:p-8 bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-4xl">🔒</div>
                <h3 className="text-xl font-bold text-black dark:text-white">Trading Not Available Yet</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto">
                  Trading functionality will be enabled soon. Stay tuned for updates!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trade History hidden when disabled */}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Header */}
      <h1 className="text-xl lg:text-2xl font-bold text-foreground dark:text-[#d2d2d2]">Trade</h1>

      {/* Main Section - Stack on mobile, side by side on desktop */}
      <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
        {/* Left: Price Chart - 3 parts of 5 total (60%) - order-2 on mobile, order-1 on desktop */}
        <div className="w-full md:w-3/5 min-w-0 order-2 md:order-1">
          <PriceChart tokenSymbol="TESS" />
        </div>

        {/* Right: Swap Panel - 2 parts of 5 total (40%) - order-1 on mobile, order-2 on desktop */}
        <div className="w-full md:w-2/5 flex-shrink-0 order-1 md:order-2">
          <TokenSwapPanel />
        </div>
      </div>

      {/* Trade History */}
      <TradeHistory />
    </div>
  )
}
