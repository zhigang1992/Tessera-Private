/**
 * Token Price Service
 *
 * Provides price data from the backend GraphQL API.
 * Falls back to swap event data when daily prices are not available.
 */

import {
  fetchTokenPricesDaily,
  fetchTokenPricesHourly,
  fetchTokenPrice24hOHLC,
  fetchTokenDetails,
} from '@/features/referral/lib/graphql-client'
import { DEVNET_POOLS } from './meteora'
import { fromHasuraToNative, BigNumber } from '@/lib/bignumber'
import {
  DEFAULT_BASE_TOKEN_ID,
  getAppToken,
  getTokenBySymbol as getConfiguredTokenBySymbol,
  getTokenDlmmPoolAddress,
  getTokenMintAddress,
  type AppToken,
  type AppTokenId,
} from '@/config'

// ============ Types ============

export interface PriceDataPoint {
  time: number // Unix timestamp in seconds
  value: number
}

export interface TokenPriceInfo {
  symbol: string
  price: number
  priceChange24h: number
  priceChangePercent24h: number
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'

// ============ Helpers ============

function resolveDlmmPoolAddress(tokenId: AppTokenId): string | null {
  const configured = getTokenDlmmPoolAddress(tokenId)
  if (configured) {
    return configured
  }

  const poolId = getAppToken(tokenId).dlmmPool?.id
  if (poolId && DEVNET_POOLS[poolId]) {
    return DEVNET_POOLS[poolId].address
  }

  return null
}

function resolvePriceContext(symbol: string): { token: AppToken; mint: string; poolAddress: string | null } {
  const token = getConfiguredTokenBySymbol(symbol) ?? getAppToken(DEFAULT_BASE_TOKEN_ID)
  const mint = getTokenMintAddress(token.id)
  const poolAddress = resolveDlmmPoolAddress(token.id)
  return { token, mint, poolAddress }
}

// ============ Helper Functions ============

/**
 * Get the number of days for each time range
 */
function getDaysForRange(range: TimeRange): number {
  switch (range) {
    case '1D':
      return 1
    case '1W':
      return 7
    case '1M':
      return 30
    case '3M':
      return 90
    case '1Y':
      return 365
    case 'ALL':
      return 9999 // All available data
  }
}

// ============ API Functions ============

/**
 * Get current token price and 24h change
 * Uses public_marts_token_details for latest price and public_marts_token_prices_24h_ohlc for 24h change
 */
export async function getTokenPrice(symbol: string): Promise<TokenPriceInfo | null> {
  const { token, mint } = resolvePriceContext(symbol)
  if (!mint) return null

  // Fetch latest price from token_details and 24h OHLC data in parallel
  const [tokenDetails, ohlc] = await Promise.all([
    fetchTokenDetails(mint),
    fetchTokenPrice24hOHLC(mint),
  ])

  // Get latest price from token_details
  if (!tokenDetails || !tokenDetails.price) {
    return null
  }

  const currentPrice = BigNumber.toNumber(fromHasuraToNative(tokenDetails.price))

  // Get 24h change from OHLC data
  const priceChange = ohlc?.price_change_24h
    ? BigNumber.toNumber(fromHasuraToNative(ohlc.price_change_24h))
    : 0
  const priceChangePct = ohlc?.price_change_pct_24h
    ? BigNumber.toNumber(fromHasuraToNative(ohlc.price_change_pct_24h))
    : 0

  return {
    symbol: token.symbol,
    price: currentPrice,
    priceChange24h: priceChange,
    priceChangePercent24h: priceChangePct,
  }
}

/**
 * Get price history for charting
 * Uses hourly data for short ranges (1D, 1W) and daily data for longer ranges
 */
export async function getPriceHistory(
  symbol: string,
  range: TimeRange = '1D'
): Promise<PriceDataPoint[]> {
  const { mint } = resolvePriceContext(symbol)
  if (!mint) return []

  const days = getDaysForRange(range)

  // For short time ranges (< 7 days), use hourly prices
  if (days < 7) {
    const hours = days * 24
    const hourlyPrices = await fetchTokenPricesHourly(mint, hours)

    if (hourlyPrices.length > 0) {
      return hourlyPrices
        .map((p) => ({
          time: p.hour_timestamp,
          value: BigNumber.toNumber(fromHasuraToNative(p.price)),
        }))
        .sort((a, b) => a.time - b.time) // Ensure ascending order
    }
    return []
  }

  // For longer time ranges, use daily prices
  const dailyPrices = await fetchTokenPricesDaily(mint, days)

  if (dailyPrices.length > 0) {
    return dailyPrices
      .map((p) => ({
        time: p.day_timestamp,
        value: BigNumber.toNumber(fromHasuraToNative(p.price)),
      }))
      .sort((a, b) => a.time - b.time) // Ensure ascending order
  }

  return []
}

/**
 * Get current token price by mint address from public_marts_token_details
 * This is the recommended way to get current prices as it's cached and performant
 * @param tokenMint - The token mint address
 * @returns The current price in USD, or null if not available
 */
export async function getCurrentTokenPrice(tokenMint: string): Promise<number | null> {
  try {
    const tokenDetails = await fetchTokenDetails(tokenMint)
    if (tokenDetails && tokenDetails.price) {
      return BigNumber.toNumber(fromHasuraToNative(tokenDetails.price))
    }
    return null
  } catch {
    return null
  }
}
