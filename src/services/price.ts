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

export interface PriceCandlePoint {
  time: number // Unix timestamp in seconds
  open: number
  high: number
  low: number
  close: number
  volume: number
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
  // Get network-aware pool address from config
  return getTokenDlmmPoolAddress(tokenId)
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

/**
 * Get data granularity for range. Short ranges use hourly data.
 */
function getUsesHourlyData(range: TimeRange): boolean {
  switch (range) {
    case '1D':
      return true
    case '1W':
      return true
    default:
      return false
  }
}

/**
 * Get OHLCV candle history for charting
 */
export async function getPriceCandles(
  symbol: string,
  range: TimeRange = '1D'
): Promise<PriceCandlePoint[]> {
  const { mint } = resolvePriceContext(symbol)
  if (!mint) return []

  const days = getDaysForRange(range)
  if (getUsesHourlyData(range)) {
    const limit = range === '1D' ? 5 * 24 : days * 24
    const hourlyPrices = await fetchTokenPricesHourly(mint, limit)

    if (hourlyPrices.length > 0) {
      return hourlyPrices
        .map((p) => {
          const price = BigNumber.toNumber(fromHasuraToNative(p.price))
          return {
            time: p.hour_timestamp,
            open: price,
            high: price,
            low: price,
            close: price,
          volume: 0,
        }
      })
        .sort((a, b) => a.time - b.time)
    }
    return []
  }

  const dailyPrices = await fetchTokenPricesDaily(mint, days)
  if (dailyPrices.length > 0) {
    return dailyPrices
      .map((p) => {
        const price = BigNumber.toNumber(fromHasuraToNative(p.price))
        return {
          time: p.day_timestamp,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 0,
        }
      })
      .sort((a, b) => a.time - b.time)
  }

  return []
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
  const candles = await getPriceCandles(symbol, range)
  return candles.map((candle) => ({
    time: candle.time,
    value: candle.close,
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
