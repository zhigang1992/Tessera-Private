/**
 * Token Price Service
 *
 * Provides price data from the backend GraphQL API.
 * Falls back to swap event data when daily prices are not available.
 */

import {
  fetchTokenPricesDaily,
  fetchTokenPrice24hOHLC,
  fetchSwapEventsForPrice,
  fetchTokenDetails,
} from '@/features/referral/lib/graphql-client'
import { DEVNET_POOLS } from './meteora'
import { fromHasuraToNative, BigNumber, math, mathIs } from '@/lib/bignumber'
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
 * Calculate price from swap event amounts
 * Price = amount_y (USDC) / amount_x (T-SpaceX)
 */
function calculatePriceFromSwap(amountX: string, amountY: string): number {
  const x = fromHasuraToNative(amountX)
  const y = fromHasuraToNative(amountY)

  if (mathIs`${x} === ${0}`) return 0

  const price = math`${y} / ${x}`
  return BigNumber.toNumber(price)
}

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

/**
 * Filter events within a time range
 */
function filterEventsByTimeRange(
  events: Array<{ block_time: number; amount_x: string; amount_y: string; type: string }>,
  range: TimeRange
): Array<{ block_time: number; amount_x: string; amount_y: string; type: string }> {
  const days = getDaysForRange(range)
  const now = Math.floor(Date.now() / 1000)
  const cutoff = now - days * 24 * 60 * 60

  return events.filter((event) => event.block_time >= cutoff)
}

// ============ API Functions ============

/**
 * Get current token price and 24h change
 */
export async function getTokenPrice(symbol: string): Promise<TokenPriceInfo | null> {
  const { token, mint, poolAddress } = resolvePriceContext(symbol)
  if (!poolAddress) return null

  // Try to get 24h OHLC data first
  const ohlc = await fetchTokenPrice24hOHLC(mint)

  if (ohlc && ohlc.close_price_24h) {
    const closePrice = BigNumber.toNumber(fromHasuraToNative(ohlc.close_price_24h))
    const priceChange = ohlc.price_change_24h
      ? BigNumber.toNumber(fromHasuraToNative(ohlc.price_change_24h))
      : 0
    const priceChangePct = ohlc.price_change_pct_24h
      ? BigNumber.toNumber(fromHasuraToNative(ohlc.price_change_pct_24h))
      : 0

    return {
      symbol: token.symbol,
      price: closePrice,
      priceChange24h: priceChange,
      priceChangePercent24h: priceChangePct,
    }
  }

  // Fall back to calculating from swap events
  const events = await fetchSwapEventsForPrice(poolAddress, 100)

  if (events.length === 0) {
    return null
  }

  // Get latest price from most recent swap
  const latestEvent = events[events.length - 1]
  const currentPrice = calculatePriceFromSwap(latestEvent.amount_x, latestEvent.amount_y)

  // Calculate 24h change by finding price 24h ago
  const now = Math.floor(Date.now() / 1000)
  const dayAgo = now - 24 * 60 * 60

  // Find the event closest to 24h ago
  let price24hAgo = currentPrice
  for (const event of events) {
    if (event.block_time <= dayAgo) {
      price24hAgo = calculatePriceFromSwap(event.amount_x, event.amount_y)
    } else {
      break
    }
  }

  const priceChange24h = currentPrice - price24hAgo
  const priceChangePercent24h = price24hAgo !== 0 ? (priceChange24h / price24hAgo) * 100 : 0

  return {
    symbol: token.symbol,
    price: currentPrice,
    priceChange24h,
    priceChangePercent24h,
  }
}

/**
 * Get price history for charting
 */
export async function getPriceHistory(
  symbol: string,
  range: TimeRange = '1D'
): Promise<PriceDataPoint[]> {
  const { mint, poolAddress } = resolvePriceContext(symbol)
  if (!poolAddress) return []

  const days = getDaysForRange(range)

  // For longer time ranges, try daily prices first
  if (days >= 7) {
    const dailyPrices = await fetchTokenPricesDaily(mint, days)

    if (dailyPrices.length > 0) {
      return dailyPrices
        .map((p) => ({
          time: p.day_timestamp,
          value: BigNumber.toNumber(fromHasuraToNative(p.price)),
        }))
        .sort((a, b) => a.time - b.time) // Ensure ascending order
    }
  }

  // Fall back to swap events for more granular data
  const events = await fetchSwapEventsForPrice(poolAddress, 500)

  if (events.length === 0) {
    return []
  }

  // Filter events by time range
  const filteredEvents = filterEventsByTimeRange(events, range)

  if (filteredEvents.length === 0) {
    // If no events in range, use all available events
    return events.map((event) => ({
      time: event.block_time,
      value: calculatePriceFromSwap(event.amount_x, event.amount_y),
    }))
  }

  return filteredEvents.map((event) => ({
    time: event.block_time,
    value: calculatePriceFromSwap(event.amount_x, event.amount_y),
  }))
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
