import { sleep } from './utils'
import {
  fetchSwapEvents,
  type MeteoraSwapEvent,
} from '@/features/referral/lib/graphql-client'
import { DEVNET_POOLS } from './meteora'
import { fromHasuraToNative, formatBigNumber, type BigNumberSource } from '@/lib/bignumber'

// ============ Types ============

export interface Token {
  symbol: string
  name: string
  icon: string
  price: number
  priceChange24h: number
  priceChangePercent24h: number
}

export interface PriceDataPoint {
  time: number // Unix timestamp in seconds
  value: number
}

export interface TradeHistoryItem {
  id: string
  token: string
  tokenIcon?: string
  amountIn: string
  amountOut: string
  type: 'Buy' | 'Sell'
  account: string
  time: string
  signature: string
}

export interface TradeHistoryResponse {
  items: TradeHistoryItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UserBalance {
  token: string
  amount: number
}

// ============ Raw Mock Data ============

const tokens: Token[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: 'usdc',
    price: 1.0,
    priceChange24h: 0,
    priceChangePercent24h: 0,
  },
  {
    symbol: 'T-SpaceX',
    name: 'Tokenized SpaceX',
    icon: 'spacex',
    price: 449.94,
    priceChange24h: 2.74,
    priceChangePercent24h: 0.6203,
  },
  {
    symbol: 'T-Tsla',
    name: 'Tokenized Tesla',
    icon: 'tesla',
    price: 421.06,
    priceChange24h: -3.21,
    priceChangePercent24h: -0.7562,
  },
  {
    symbol: 'T-NVDA',
    name: 'Tokenized NVIDIA',
    icon: 'nvidia',
    price: 138.25,
    priceChange24h: 4.12,
    priceChangePercent24h: 3.0712,
  },
  {
    symbol: 'T-AAPL',
    name: 'Tokenized Apple',
    icon: 'apple',
    price: 248.13,
    priceChange24h: 1.87,
    priceChangePercent24h: 0.7594,
  },
  {
    symbol: 'T-GOOG',
    name: 'Tokenized Google',
    icon: 'google',
    price: 192.46,
    priceChange24h: -0.54,
    priceChangePercent24h: -0.2798,
  },
  {
    symbol: 'T-AMZN',
    name: 'Tokenized Amazon',
    icon: 'amazon',
    price: 227.03,
    priceChange24h: 2.15,
    priceChangePercent24h: 0.9562,
  },
  {
    symbol: 'T-META',
    name: 'Tokenized Meta',
    icon: 'meta',
    price: 612.77,
    priceChange24h: 8.34,
    priceChangePercent24h: 1.3802,
  },
  {
    symbol: 'T-MSFT',
    name: 'Tokenized Microsoft',
    icon: 'microsoft',
    price: 446.95,
    priceChange24h: 3.26,
    priceChangePercent24h: 0.7347,
  },
]

// Generate price history data
function generatePriceHistory(
  basePrice: number,
  range: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'
): PriceDataPoint[] {
  const data: PriceDataPoint[] = []
  const now = new Date()
  let points = 100
  let intervalMs = 3 * 60 * 60 * 1000 // 3 hours

  switch (range) {
    case '1D':
      points = 24
      intervalMs = 60 * 60 * 1000 // 1 hour
      break
    case '1W':
      points = 7 * 24
      intervalMs = 60 * 60 * 1000 // 1 hour
      break
    case '1M':
      points = 30
      intervalMs = 24 * 60 * 60 * 1000 // 1 day
      break
    case '3M':
      points = 90
      intervalMs = 24 * 60 * 60 * 1000 // 1 day
      break
    case '1Y':
      points = 365
      intervalMs = 24 * 60 * 60 * 1000 // 1 day
      break
    case 'ALL':
      points = 500
      intervalMs = 24 * 60 * 60 * 1000 // 1 day
      break
  }

  let price = basePrice * 0.95 // Start from 95% of current price
  const volatility = basePrice * 0.01 // 1% volatility

  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalMs)
    price = price + (Math.random() - 0.48) * volatility
    price = Math.max(basePrice * 0.85, Math.min(basePrice * 1.05, price))
    data.push({
      time: Math.floor(time.getTime() / 1000),
      value: price,
    })
  }

  // Ensure the last point is close to current price
  if (data.length > 0) {
    data[data.length - 1].value = basePrice
  }

  return data
}

// Token mint to symbol mapping
const MINT_TO_SYMBOL: Record<string, string> = {
  [DEVNET_POOLS['TESS-USDC'].tokenX.mint]: 'TESS',
  [DEVNET_POOLS['TESS-USDC'].tokenY.mint]: 'USDC',
}

// Format wallet address for display
function formatWalletAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

// Format block time to readable date
function formatBlockTime(blockTime: number): string {
  const date = new Date(blockTime * 1000)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  if (isToday) {
    return `Today at ${timeStr}`
  } else if (isYesterday) {
    return `Yesterday at ${timeStr}`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${timeStr}`
  }
}

// Format amount from raw value (accounting for 18 decimal precision from GraphQL)
function formatAmount(rawAmount: BigNumberSource): string {
  const bigNum = fromHasuraToNative(rawAmount)
  return formatBigNumber(bigNum)
}

// Transform GraphQL swap event to trade history item
function transformSwapEvent(event: MeteoraSwapEvent): TradeHistoryItem {
  const isBuy = event.type === 'swap-y-for-x' // USDC -> TESS is a buy
  const symbolX = MINT_TO_SYMBOL[event.mint_x] || 'Unknown'
  const symbolY = MINT_TO_SYMBOL[event.mint_y] || 'Unknown'

  const amountX = formatAmount(event.amount_x)
  const amountY = formatAmount(event.amount_y)

  return {
    id: event.signature,
    signature: event.signature,
    token: symbolX, // TESS is always the main token
    amountIn: isBuy ? `${amountY} ${symbolY}` : `${amountX} ${symbolX}`,
    amountOut: isBuy ? `${amountX} ${symbolX}` : `${amountY} ${symbolY}`,
    type: isBuy ? 'Buy' : 'Sell',
    account: formatWalletAddress(event.sender),
    time: formatBlockTime(event.block_time),
  }
}

// User balances
const userBalances: UserBalance[] = [
  { token: 'USDC', amount: 2399.89 },
  { token: 'T-SpaceX', amount: 12.5 },
  { token: 'T-Tsla', amount: 8.3 },
  { token: 'T-NVDA', amount: 25.0 },
]

// ============ API Functions ============

export async function getTokens(): Promise<Token[]> {
  await sleep(300)
  return tokens
}

export async function getTokenBySymbol(symbol: string): Promise<Token | null> {
  await sleep(200)
  return tokens.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase()) || null
}

export async function getPriceHistory(
  symbol: string,
  range: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL' = '1D'
): Promise<PriceDataPoint[]> {
  await sleep(400)
  const token = tokens.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase())
  if (!token) return []
  return generatePriceHistory(token.price, range)
}

// TESS-USDC pool address for filtering
const TESS_USDC_POOL = DEVNET_POOLS['TESS-USDC'].address

export async function getTradeHistory(page: number = 1, pageSize: number = 10): Promise<TradeHistoryResponse> {
  const offset = (page - 1) * pageSize
  // Filter to only show trades from the TESS-USDC pool
  const { events, total } = await fetchSwapEvents(pageSize, offset, TESS_USDC_POOL)

  const items = events.map(transformSwapEvent)
  const totalPages = Math.ceil(total / pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function getUserBalances(): Promise<UserBalance[]> {
  await sleep(300)
  return userBalances
}

export async function getTokenBalance(tokenSymbol: string): Promise<number> {
  await sleep(200)
  const balance = userBalances.find((b) => b.token.toLowerCase() === tokenSymbol.toLowerCase())
  return balance?.amount || 0
}

// Swap quote calculation
export interface SwapQuote {
  fromToken: string
  toToken: string
  fromAmount: number
  toAmount: number
  rate: number
  priceImpact: number
  fee: number
}

export async function getSwapQuote(
  fromToken: string,
  toToken: string,
  fromAmount: number
): Promise<SwapQuote | null> {
  await sleep(300)

  const from = tokens.find((t) => t.symbol.toLowerCase() === fromToken.toLowerCase())
  const to = tokens.find((t) => t.symbol.toLowerCase() === toToken.toLowerCase())

  if (!from || !to || fromAmount <= 0) return null

  const fromValueUsd = fromAmount * from.price
  const toAmount = fromValueUsd / to.price
  const rate = from.price / to.price

  // Mock price impact and fee
  const priceImpact = fromValueUsd > 10000 ? 0.5 : fromValueUsd > 1000 ? 0.1 : 0.05
  const fee = fromValueUsd * 0.003 // 0.3% fee

  return {
    fromToken: from.symbol,
    toToken: to.symbol,
    fromAmount,
    toAmount: toAmount * (1 - priceImpact / 100),
    rate,
    priceImpact,
    fee,
  }
}

// Execute swap (mock)
export interface SwapResult {
  success: boolean
  txHash?: string
  error?: string
}

export async function executeSwap(
  _fromToken: string,
  _toToken: string,
  _fromAmount: number
): Promise<SwapResult> {
  await sleep(1500) // Simulate transaction time

  // Mock 95% success rate
  if (Math.random() > 0.05) {
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    return { success: true, txHash }
  }

  return { success: false, error: 'Transaction failed. Please try again.' }
}
