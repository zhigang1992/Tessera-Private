import { useState, useEffect, useMemo } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useSearchParams } from 'react-router'
import { PriceChart } from './components/price-chart'
import { TokenSwapPanel } from './components/token-swap-panel'
import { TradeHistory } from './components/trade-history'
import { type AppTokenId, DEFAULT_BASE_TOKEN_ID, QUOTE_TOKEN_ID, getTokenByMint, getAppToken } from '@/config'
import { getAlphaVaultClient } from '@/services/alpha-vault'

export default function TradePage() {
  const { connection } = useConnection()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tradingEnabled, setTradingEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Parse tokens from URL parameters (base and quote mint addresses)
  const baseTokenId = useMemo((): AppTokenId => {
    const baseMintParam = searchParams.get('base')
    if (baseMintParam) {
      const token = getTokenByMint(baseMintParam)
      if (token) return token.id as AppTokenId
    }
    return DEFAULT_BASE_TOKEN_ID
  }, [searchParams])

  const quoteTokenId = useMemo((): Extract<AppTokenId, 'USDC'> => {
    const quoteMintParam = searchParams.get('quote')
    if (quoteMintParam) {
      const token = getTokenByMint(quoteMintParam)
      if (token && token.id === 'USDC') return token.id
    }
    return QUOTE_TOKEN_ID
  }, [searchParams])

  useEffect(() => {
    let mounted = true

    async function checkTradingStatus() {
      try {
        // Get alpha vault client
        const vaultClient = getAlphaVaultClient(baseTokenId, { connection })

        // Fetch vault info to get activation point and type
        const vaultInfo = await vaultClient.getVaultInfo()

        // Determine if trading is active based on activation point and type
        let isActive = false

        if (vaultInfo.activationType === 'slot') {
          // For slot-based activation, compare current slot with activation point
          const currentSlot = await connection.getSlot()
          isActive = currentSlot >= vaultInfo.activationPoint
        } else if (vaultInfo.activationType === 'timestamp') {
          // For timestamp-based activation, compare current time with activation point
          // activationPoint is in seconds, convert to milliseconds
          const currentTime = Date.now()
          const activationTime = vaultInfo.activationPoint * 1000
          isActive = currentTime >= activationTime
        }

        if (mounted) {
          setTradingEnabled(isActive)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to check trading status from alpha vault:', error)
        // On error, default to disabled
        if (mounted) {
          setTradingEnabled(false)
          setIsLoading(false)
        }
      }
    }

    checkTradingStatus()

    return () => {
      mounted = false
    }
  }, [connection, baseTokenId])

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Header */}
      <h1 className="text-xl lg:text-2xl font-bold text-foreground dark:text-[#d2d2d2]">Trade</h1>

      {/* Main Section - Stack on mobile, side by side on desktop */}
      <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
        {/* Left: Price Chart - 3 parts of 5 total (60%) - order-2 on mobile, order-1 on desktop */}
        <div className="w-full md:w-3/5 min-w-0 order-2 md:order-1">
          {/* Price chart and market depth should always be visible, even when trading is disabled */}
          <PriceChart baseTokenId={baseTokenId} disabled={isLoading} />
        </div>

        {/* Right: Swap Panel - 2 parts of 5 total (40%) - order-1 on mobile, order-2 on desktop */}
        <div className="w-full md:w-2/5 flex-shrink-0 order-1 md:order-2">
          {/* Swap panel should disable trading but still show balances */}
          <TokenSwapPanel baseTokenId={baseTokenId} quoteTokenId={quoteTokenId} disabled={isLoading || !tradingEnabled} />
        </div>
      </div>

      {/* Trade History - always shown regardless of trading enabled status */}
      <TradeHistory />
    </div>
  )
}
