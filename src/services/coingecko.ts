/**
 * CoinGecko API Service
 *
 * Provides real-time and historical price data for cryptocurrencies.
 * Free tier: 10-30 calls/minute, no API key required.
 */

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

// Token ID mapping for CoinGecko
const COINGECKO_IDS: Record<string, string> = {
  SOL: 'solana',
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDC: 'usd-coin',
  USDT: 'tether',
}

export interface PriceDataPoint {
  time: number // Unix timestamp in seconds
  value: number
}

export interface TokenPrice {
  symbol: string
  price: number
  priceChange24h: number
  priceChangePercent24h: number
  marketCap?: number
  volume24h?: number
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'

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
      return 'max' as unknown as number // CoinGecko uses 'max' for all-time
  }
}

/**
 * Fetch current price and 24h change for a token
 */
export async function getTokenPrice(symbol: string): Promise<TokenPrice | null> {
  const coinId = COINGECKO_IDS[symbol.toUpperCase()]
  if (!coinId) {
    console.warn(`Unknown token symbol: ${symbol}`)
    return null
  }

  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    const tokenData = data[coinId]

    if (!tokenData) {
      return null
    }

    const price = tokenData.usd
    const priceChangePercent24h = tokenData.usd_24h_change || 0
    const priceChange24h = (price * priceChangePercent24h) / 100

    return {
      symbol: symbol.toUpperCase(),
      price,
      priceChange24h,
      priceChangePercent24h,
      marketCap: tokenData.usd_market_cap,
      volume24h: tokenData.usd_24h_vol,
    }
  } catch (error) {
    console.error('Failed to fetch token price:', error)
    return null
  }
}

/**
 * Fetch historical price data for a token
 */
export async function getPriceHistory(
  symbol: string,
  range: TimeRange = '1D'
): Promise<PriceDataPoint[]> {
  const coinId = COINGECKO_IDS[symbol.toUpperCase()]
  if (!coinId) {
    console.warn(`Unknown token symbol: ${symbol}`)
    return []
  }

  const days = getDaysForRange(range)

  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()

    // CoinGecko returns prices as [timestamp_ms, price] pairs
    const prices: [number, number][] = data.prices || []

    return prices.map(([timestampMs, price]) => ({
      time: Math.floor(timestampMs / 1000), // Convert to seconds
      value: price,
    }))
  } catch (error) {
    console.error('Failed to fetch price history:', error)
    return []
  }
}

/**
 * Fetch OHLC (candlestick) data for a token
 */
export async function getOHLCData(
  symbol: string,
  days: number = 7
): Promise<{ time: number; open: number; high: number; low: number; close: number }[]> {
  const coinId = COINGECKO_IDS[symbol.toUpperCase()]
  if (!coinId) {
    console.warn(`Unknown token symbol: ${symbol}`)
    return []
  }

  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data: [number, number, number, number, number][] = await response.json()

    return data.map(([timestampMs, open, high, low, close]) => ({
      time: Math.floor(timestampMs / 1000),
      open,
      high,
      low,
      close,
    }))
  } catch (error) {
    console.error('Failed to fetch OHLC data:', error)
    return []
  }
}
