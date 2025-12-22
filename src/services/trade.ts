import { sleep } from './utils'

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
  amountIn: string
  amountOut: string
  type: 'Buy' | 'Sell'
  account: string
  time: string
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

// Generate trade history
function generateTradeHistory(): TradeHistoryItem[] {
  const items: TradeHistoryItem[] = []
  const tokenSymbols = ['T-SPACEX', 'T-TSLA', 'T-NVDA', 'T-AAPL', 'T-GOOG', 'T-AMZN', 'T-META', 'T-MSFT']
  const accounts = ['0xA8D0...6006', '0x7B3F...A123', '0x9C2E...8B45', '0x1D4A...C789', '0x5E6F...D012']
  const times = ['Today at 3:20 PM', 'Today at 2:45 PM', 'Today at 1:30 PM', 'Yesterday at 5:00 PM', 'Yesterday at 11:20 AM']

  for (let i = 1; i <= 100; i++) {
    const token = tokenSymbols[Math.floor(Math.random() * tokenSymbols.length)]
    const type = Math.random() > 0.5 ? 'Buy' : 'Sell'
    const usdcAmount = (Math.floor(Math.random() * 10) + 1) * 100
    const tokenAmount = (usdcAmount / (300 + Math.random() * 200)).toFixed(2)

    items.push({
      id: `trade-${i}`,
      token,
      amountIn: type === 'Buy' ? `${usdcAmount.toLocaleString()} USDC` : `${tokenAmount} ${token}`,
      amountOut: type === 'Buy' ? `${tokenAmount} ${token}` : `${usdcAmount.toLocaleString()} USDC`,
      type,
      account: accounts[Math.floor(Math.random() * accounts.length)],
      time: times[Math.floor(Math.random() * times.length)],
    })
  }

  return items
}

const rawTradeHistory = generateTradeHistory()

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

export async function getTradeHistory(page: number = 1, pageSize: number = 10): Promise<TradeHistoryResponse> {
  await sleep(500)
  const start = (page - 1) * pageSize
  const items = rawTradeHistory.slice(start, start + pageSize)
  const total = rawTradeHistory.length
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
