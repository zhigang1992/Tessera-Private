import { useState, useCallback } from 'react'
import { PriceChart } from './components/price-chart'
import { TokenSwapPanel } from './components/token-swap-panel'
import { BalanceDisplay } from './components/balance-display'
import { TradeHistory } from './components/trade-history'
import type { Token } from '@/services'

export default function TradePage() {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)

  const handleTokenChange = useCallback((token: Token) => {
    setSelectedToken(token)
  }, [])

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Header */}
      <h1 className="text-xl lg:text-2xl font-bold text-black">Trade</h1>

      {/* Main Section - Stack on mobile, side by side on desktop */}
      <div className="flex flex-col gap-4 lg:gap-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Left: Price Chart */}
          <div className="w-full lg:flex-1">
            <PriceChart tokenSymbol={selectedToken?.symbol ?? 'T-SpaceX'} />
          </div>

          {/* Right: Swap Panel + Balance */}
          <div className="w-full lg:flex-1 flex flex-col gap-2.5">
            <TokenSwapPanel onTokenChange={handleTokenChange} />
            <BalanceDisplay />
          </div>
        </div>
      </div>

      {/* Trade History */}
      <TradeHistory />
    </div>
  )
}
