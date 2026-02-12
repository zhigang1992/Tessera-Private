/**
 * Hook for fetching market depth data from Meteora DLMM
 */

import { useQuery } from '@tanstack/react-query'
import { Connection } from '@solana/web3.js'
import { createMeteoraClient, type MarketDepthData } from '@/services/meteora'
import { getCurrentNetwork, getRpcEndpoint, getAppToken, DEFAULT_BASE_TOKEN_ID } from '@/config'
import { BigNumber, math } from 'math-literal'

// Get RPC URL based on current network configuration
const getRpcUrl = () => {
  return getRpcEndpoint()
}

// Singleton connection to avoid creating multiple connections
let connectionInstance: Connection | null = null

function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(getRpcUrl(), 'confirmed')
  }
  return connectionInstance
}

export interface UseMarketDepthOptions {
  poolAddress?: string
  binsToLeft?: number
  binsToRight?: number
  enabled?: boolean
}

export interface MarketDepthResult {
  data: MarketDepthData | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Fetch market depth data from Meteora DLMM
 */
async function fetchMarketDepth(
  poolAddress: string,
  binsToLeft: number,
  binsToRight: number
): Promise<MarketDepthData> {
  const connection = getConnection()
  const network = getCurrentNetwork()
  const client = createMeteoraClient(connection, network)
  return client.getBinsAroundActiveBin(poolAddress, binsToLeft, binsToRight)
}

/**
 * Hook to fetch market depth data for a DLMM pool
 *
 * @param options - Configuration options
 * @returns Market depth data, loading state, and error state
 */
export function useMarketDepth({
  poolAddress,
  binsToLeft = 100,
  binsToRight = 100,
  enabled = true,
}: UseMarketDepthOptions = {}): MarketDepthResult {
  // Use network-aware pool address from token config if not provided
  const defaultToken = getAppToken(DEFAULT_BASE_TOKEN_ID)
  const defaultPoolAddress = defaultToken.dlmmPool?.address ?? ''
  const resolvedPoolAddress = poolAddress ?? defaultPoolAddress
  const query = useQuery({
    queryKey: ['marketDepth', resolvedPoolAddress, binsToLeft, binsToRight],
    queryFn: () => fetchMarketDepth(resolvedPoolAddress, binsToLeft, binsToRight),
    enabled,
    staleTime: 30 * 1000, // Consider stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 60 * 1000, // Refresh every minute
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Calculate bar heights for market depth visualization
 * Normalizes bin liquidity to pixel heights for the chart
 */
export function calculateBarHeights(
  bins: MarketDepthData['bins'],
  maxHeight: number = 261
): number[] {
  if (bins.length === 0) return []

  // Calculate total liquidity (xAmount + yAmount) for each bin
  const liquidities = bins.map((bin) => {
    const x = parseFloat(bin.xAmount) || 0
    const y = parseFloat(bin.yAmount) || 0
    return x + y
  })

  const maxLiquidity = Math.max(...liquidities, 1) // Avoid division by zero

  // Normalize to max height, with minimum height of 20px for visibility
  return liquidities.map((liq) => {
    const normalized = (liq / maxLiquidity) * maxHeight
    return Math.max(normalized, liq > 0 ? 20 : 0) // Min 20px if has liquidity
  })
}

/**
 * Calculate and format TVL for display
 *
 * TVL is calculated as:
 * - Sum of all X amounts across all bins × active bin price
 * - Plus sum of all Y amounts across all bins
 *
 * This values all liquidity at the current market price (active bin)
 */
export function formatTvl(marketDepth: MarketDepthData): string {
  // Find the active bin to get its price
  const activeBin = marketDepth.bins.find(bin => bin.binId === marketDepth.activeBinId)

  if (!activeBin) {
    return '--'
  }

  const activeBinPrice = parseFloat(activeBin.price)

  // Sum all X amounts and Y amounts across all bins
  // These amounts are in raw token units, so we need to adjust for decimals
  let totalXAmount = BigNumber.sum(marketDepth.bins.map(x => x.xAmount))
  let totalYAmount = BigNumber.sum(marketDepth.bins.map(x => x.yAmount))

  const total = BigNumber.toNumber(math`(${totalXAmount} * ${activeBinPrice} + ${totalYAmount}) / ${1e6}`)

  if (total >= 1_000_000_000) {
    return `$${(total / 1_000_000_000).toFixed(2)}B`
  }
  if (total >= 1_000_000) {
    return `$${(total / 1_000_000).toFixed(2)}M`
  }
  if (total >= 1_000) {
    return `$${(total / 1_000).toFixed(2)}K`
  }
  return `$${total.toFixed(2)}`
}

/**
 * Format bin step for display
 */
export function formatBinStep(binStep: number): string {
  const percentage = binStep / 100
  return `${binStep} (${percentage.toFixed(2)}%)`
}
