import { sleep } from './utils'
import { fetchDashboardStats, fetchUserSwapEvents, fetchSwapEventsLast24h, fetchSwapEventsForPrice, fetchTotalMarketCap, fetchAllTokenDetails, fetchDashboardSummary, fetchTokenPrice24hOHLC, fetchTokenDetails } from '@/features/referral/lib/graphql-client'
import { fromHasuraToNative, formatBigNumber, BigNumber, math, mathIs, type BigNumberSource, fromTokenAmount, type BigNumberValue } from '@/lib/bignumber'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { DEVNET_POOLS } from './meteora'
import {
  APP_TOKENS,
  DEFAULT_BASE_TOKEN_ID,
  QUOTE_TOKEN_ID,
  getAppToken,
  getTokenDlmmPoolAddress,
  getTokenMintConfig,
} from '@/config'

const BASE_TOKEN = getAppToken(DEFAULT_BASE_TOKEN_ID)
const QUOTE_TOKEN = getAppToken(QUOTE_TOKEN_ID)
const BASE_MINT_CONFIG = getTokenMintConfig(BASE_TOKEN.id)
const QUOTE_MINT_CONFIG = getTokenMintConfig(QUOTE_TOKEN.id)
const BASE_MINT_ADDRESS = BASE_MINT_CONFIG?.address ?? null
const QUOTE_MINT_ADDRESS = QUOTE_MINT_CONFIG?.address ?? null
const BASE_DECIMALS = BASE_MINT_CONFIG?.decimals ?? BASE_TOKEN.decimals
const QUOTE_DECIMALS = QUOTE_MINT_CONFIG?.decimals ?? QUOTE_TOKEN.decimals

function getBasePoolAddress(): string | null {
  const configured = getTokenDlmmPoolAddress(BASE_TOKEN.id)
  if (configured) {
    return configured
  }

  const poolId = BASE_TOKEN.dlmmPool?.id
  if (poolId && DEVNET_POOLS[poolId]) {
    return DEVNET_POOLS[poolId].address
  }

  return null
}

// ============ Types ============

export interface MarketStatsData {
  totalMarketCap: number
  totalMarketCap24hChangePct: number | null
  totalTradingVolume: number
  totalVolume24hChangePct: number | null
  activeTraders: number
  activeTraders24hChange: number | null
  assetsTokenized: number
}

export interface AssetData {
  id: string
  symbol: string
  name: string
  code: string
  sector: string
  price: number
  holders: number
  valuation: string
}

export interface DashboardStats {
  protocolBackingRatio: number
  tokenSupply: string
  tokenPrice: number
}

export interface TokenInfo {
  symbol: string
  name: string
  price: number
  priceChange24h: number
  priceChangePercent24h: number
  description: string
  supportedChains: string[]
  onchainAddress: string
  categories: string[]
  underlyingAssetName: string
  underlyingAssetCompany: string
  sharesPerToken: string
}

export interface TokenStatistics {
  tokenPrice24h: {
    open: number
    high: number
    low: number
  }
  underlyingAssetPrice24h: {
    open: number
    high: number
    low: number
  }
}

export interface UserDashboard {
  balance: number
  tokenBalance: number
  tokenSymbol: string
  tokenName: string
}

export interface UserTradeHistoryItem {
  id: string
  token: string
  amountIn: string
  amountOut: string
  type: 'Buy' | 'Sell'
  account: string
  time: string
}

export interface UserTradeHistoryResponse {
  items: UserTradeHistoryItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============ Mock Data ============

const dashboardStats: DashboardStats = {
  protocolBackingRatio: 100,
  tokenSupply: '300K',
  tokenPrice: 183.2,
}

const tokenInfo: TokenInfo = {
  symbol: BASE_TOKEN.symbol,
  name: BASE_TOKEN.displayName,
  price: 449.94,
  priceChange24h: 2.74,
  priceChangePercent24h: 0.6203,
  description:
    'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally. It operates in two segments, Automotive, and Energy Generation and Storage. The Autom...',
  supportedChains: ['Solana'],
  onchainAddress: '0xf6b1...103f',
  categories: ['Equities', 'Stock'],
  underlyingAssetName: 'SpaceX, Inc. Private Equity',
  underlyingAssetCompany: 'SpaceX',
  sharesPerToken: `1 ${BASE_TOKEN.symbol} = 1.00 SPACEX EQUITY`,
}

// ============ Helper Functions ============

/**
 * Format swap amount from Hasura 18-decimal precision
 * Adjusts decimal places based on the magnitude of the number
 */
function formatSwapAmount(rawAmount: BigNumberSource): string {
  const bigNum = fromHasuraToNative(rawAmount)
  const numValue = BigNumber.toNumber(bigNum)

  // For very small amounts (< 0.01), show more precision
  if (numValue < 0.01 && numValue > 0) {
    return formatBigNumber(bigNum, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
  }

  // For regular amounts, show 2 decimal places
  return formatBigNumber(bigNum, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Format block time to readable date with time
 */
function formatBlockTimeWithTime(blockTime: number): string {
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

/**
 * Format wallet address for display
 */
function formatWalletAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// ============ Market Data API Functions ============

/**
 * Get market overview statistics for the stats cards
 * Uses new dashboard_summary view with 24h change data
 */
export async function getMarketStats(): Promise<MarketStatsData> {
  const summary = await fetchDashboardSummary()

  if (!summary) {
    // Fallback to old method if dashboard_summary is not available
    const [stats, marketCapData] = await Promise.all([
      fetchDashboardStats(),
      fetchTotalMarketCap(),
    ])

    let totalMarketCap = 0
    let assetsTokenized = 0
    if (marketCapData) {
      totalMarketCap = BigNumber.toNumber(fromHasuraToNative(marketCapData.total_market_cap))
      assetsTokenized = Number(marketCapData.token_count) || 0
    }

    return {
      totalMarketCap,
      totalMarketCap24hChangePct: null,
      totalTradingVolume: stats.totalTradingVolume,
      totalVolume24hChangePct: null,
      activeTraders: stats.totalTraders,
      activeTraders24hChange: null,
      assetsTokenized,
    }
  }

  // Use dashboard_summary data with 24h changes
  // Handle null market cap gracefully (returns 0 if data not available)
  let totalMarketCap = 0
  if (summary.total_market_cap !== null && summary.total_market_cap !== undefined) {
    totalMarketCap = BigNumber.toNumber(fromHasuraToNative(summary.total_market_cap))
  }

  const totalTradingVolume = summary.total_trading_volume
    ? BigNumber.toNumber(fromHasuraToNative(summary.total_trading_volume))
    : 0
  const totalMarketCap24hChangePct = summary.total_market_cap_24h_change_pct
    ? BigNumber.toNumber(fromHasuraToNative(summary.total_market_cap_24h_change_pct))
    : null
  const totalVolume24hChangePct = summary.total_volume_24h_change_pct
    ? BigNumber.toNumber(fromHasuraToNative(summary.total_volume_24h_change_pct))
    : null

  return {
    totalMarketCap,
    totalMarketCap24hChangePct,
    totalTradingVolume,
    totalVolume24hChangePct,
    activeTraders: Number(summary.total_active_traders) || 0,
    activeTraders24hChange: summary.total_traders_24h_change ?? null,
    assetsTokenized: Number(summary.total_assets_tokenized) || 0,
  }
}

// ============ Token Registry ============
// Static metadata for tokens (not available in GraphQL)
// This could be moved to a separate config file as more tokens are added

interface TokenMetadata {
  id: string
  symbol: string
  name: string
  code: string
  sector: string
  mint: string
}

const TOKEN_REGISTRY: Record<string, TokenMetadata> = {}

Object.values(APP_TOKENS).forEach((token) => {
  // Skip quote token (USDC) - not a tokenized asset
  if (token.id === QUOTE_TOKEN_ID) return

  Object.values(token.mints).forEach((mint) => {
    if (!mint) return
    TOKEN_REGISTRY[mint.address] = {
      id: token.slug,
      symbol: token.symbol,
      name: token.displayName,
      code: token.metadata?.code ?? token.slug.toUpperCase(),
      sector: token.metadata?.sector ?? 'Private Markets',
      mint: mint.address,
    }
  })
})

/**
 * Format market cap to human-readable valuation string
 */
function formatValuation(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(1)}T`
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`
  }
  return `$${value.toFixed(2)}`
}

/**
 * Get list of tokenized assets for the assets table
 * Fetches real data from GraphQL and merges with token metadata
 * Returns empty array when no real data is available
 */
export async function getTokenizedAssets(): Promise<AssetData[]> {
  let tokenDetails: Awaited<ReturnType<typeof fetchAllTokenDetails>> = []

  try {
    tokenDetails = await fetchAllTokenDetails()
  } catch (error) {
    console.error('[dashboard] Failed to fetch token details', error)
    return []
  }

  if (!tokenDetails || tokenDetails.length === 0) {
    return []
  }

  return tokenDetails.map((token) => {
    const metadata = TOKEN_REGISTRY[token.token]
    const price = BigNumber.toNumber(fromHasuraToNative(token.price))
    const marketCap = BigNumber.toNumber(fromHasuraToNative(token.market_cap))
    const holders = Number(token.holder_count) || 0

    // If we have metadata for this token, use it; otherwise create generic entry
    if (metadata) {
      return {
        id: metadata.id,
        symbol: metadata.symbol,
        name: metadata.name,
        code: metadata.code,
        sector: metadata.sector,
        price,
        holders,
        valuation: formatValuation(marketCap),
      }
    }

    // Fallback for unknown tokens
    const shortMint = `${token.token.slice(0, 4)}...${token.token.slice(-4)}`
    return {
      id: token.token,
      symbol: shortMint,
      name: shortMint,
      code: token.token.slice(0, 8),
      sector: 'Unknown',
      price,
      holders,
      valuation: formatValuation(marketCap),
    }
  })
}

// ============ API Functions ============

/**
 * Format large number to human-readable string (e.g., 107958426 -> "107.96M")
 */
function formatSupply(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }
  return value.toFixed(0)
}

/**
 * Get dashboard stats including real token price and supply from backend
 * Uses public_marts_token_details for latest price
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const tokenMint = BASE_MINT_ADDRESS

  if (!tokenMint) {
    return dashboardStats
  }

  // Fetch token details (includes price and circulating supply)
  const tokenData = await fetchTokenDetails(tokenMint)

  if (!tokenData) {
    return dashboardStats
  }

  // Get latest price from token_details
  const tokenPrice = BigNumber.toNumber(fromHasuraToNative(tokenData.price))

  // Get circulating supply from token_details
  const supplyValue = BigNumber.toNumber(fromHasuraToNative(tokenData.circulating_supply))
  const tokenSupply = formatSupply(supplyValue)

  return {
    ...dashboardStats,
    tokenPrice: tokenPrice > 0 ? tokenPrice : dashboardStats.tokenPrice,
    tokenSupply,
  }
}

/**
 * Get token info with real price data from backend
 * Falls back to calculating from swap events if backend data unavailable
 */
export async function getDashboardTokenInfo(): Promise<TokenInfo> {
  const tokenMint = BASE_MINT_ADDRESS
  const poolAddress = getBasePoolAddress()

  if (!tokenMint || !poolAddress) {
    return tokenInfo
  }

  // Fetch 24h OHLC data and swap events in parallel
  const [ohlcData, events] = await Promise.all([
    fetchTokenPrice24hOHLC(tokenMint),
    fetchSwapEventsForPrice(poolAddress, 100),
  ])

  // Get current price from most recent swap
  let currentPrice = 0
  if (events.length > 0) {
    const latestEvent = events[events.length - 1]
    const x = fromHasuraToNative(latestEvent.amount_x)
    const y = fromHasuraToNative(latestEvent.amount_y)
    if (mathIs`${x} > ${0}`) {
      currentPrice = BigNumber.toNumber(math`${y} / ${x}`)
    }
  }

  // Use close_price_24h if available, otherwise fall back to current price
  if (ohlcData?.close_price_24h) {
    currentPrice = BigNumber.toNumber(fromHasuraToNative(ohlcData.close_price_24h))
  }

  if (currentPrice === 0) {
    return tokenInfo
  }

  // Use backend 24h change data if available
  if (ohlcData?.price_change_24h && ohlcData?.price_change_pct_24h) {
    const priceChange24h = BigNumber.toNumber(fromHasuraToNative(ohlcData.price_change_24h))
    const priceChangePercent24h = BigNumber.toNumber(fromHasuraToNative(ohlcData.price_change_pct_24h))

    return {
      ...tokenInfo,
      price: currentPrice,
      priceChange24h,
      priceChangePercent24h,
    }
  }

  // Fallback: Calculate 24h change from swap events
  const now = Math.floor(Date.now() / 1000)
  const dayAgo = now - 24 * 60 * 60

  let price24hAgo = currentPrice
  for (const event of events) {
    if (event.block_time <= dayAgo) {
      const eventX = fromHasuraToNative(event.amount_x)
      const eventY = fromHasuraToNative(event.amount_y)
      if (mathIs`${eventX} > ${0}`) {
        price24hAgo = BigNumber.toNumber(math`${eventY} / ${eventX}`)
      }
    } else {
      break
    }
  }

  const priceChange24h = currentPrice - price24hAgo
  const priceChangePercent24h = price24hAgo !== 0 ? (priceChange24h / price24hAgo) * 100 : 0

  return {
    ...tokenInfo,
    price: currentPrice,
    priceChange24h,
    priceChangePercent24h,
  }
}

/**
 * Calculate price from swap event amounts
 * For the base/quote pool: price = amount_y (quote) / amount_x (base)
 */
function calculatePriceFromSwap(amountX: string, amountY: string): BigNumberValue {
  const x = fromHasuraToNative(amountX)
  const y = fromHasuraToNative(amountY)

  // Avoid division by zero
  if (mathIs`${x} === ${0}`) {
    return BigNumber.from(0)
  }

  return math`${y} / ${x}`
}

/**
 * Get dashboard statistics with 24h OHLC data from backend
 * Falls back to calculating from swap events if backend data unavailable
 */
export async function getDashboardStatistics(): Promise<TokenStatistics> {
  const tokenMint = BASE_MINT_ADDRESS

  if (!tokenMint) {
    return {
      tokenPrice24h: { open: 0, high: 0, low: 0 },
      underlyingAssetPrice24h: { open: 0, high: 0, low: 0 },
    }
  }

  // Try to get 24h OHLC from backend first
  const ohlcData = await fetchTokenPrice24hOHLC(tokenMint)

  if (ohlcData && ohlcData.open_price_24h) {
    const openPrice = BigNumber.toNumber(fromHasuraToNative(ohlcData.open_price_24h))
    const highPrice = ohlcData.high_price_24h
      ? BigNumber.toNumber(fromHasuraToNative(ohlcData.high_price_24h))
      : openPrice
    const lowPrice = ohlcData.low_price_24h
      ? BigNumber.toNumber(fromHasuraToNative(ohlcData.low_price_24h))
      : openPrice

    return {
      tokenPrice24h: {
        open: openPrice,
        high: highPrice,
        low: lowPrice,
      },
      // For now, underlying asset price mirrors token price
      underlyingAssetPrice24h: {
        open: openPrice,
        high: highPrice,
        low: lowPrice,
      },
    }
  }

  // Fallback: Calculate from swap events if backend data unavailable
  const poolAddress = getBasePoolAddress()
  if (!poolAddress) {
    return {
      tokenPrice24h: { open: 0, high: 0, low: 0 },
      underlyingAssetPrice24h: { open: 0, high: 0, low: 0 },
    }
  }
  const swapEvents = await fetchSwapEventsLast24h(poolAddress)

  if (swapEvents.length === 0) {
    return {
      tokenPrice24h: {
        open: 0,
        high: 0,
        low: 0,
      },
      underlyingAssetPrice24h: {
        open: 0,
        high: 0,
        low: 0,
      },
    }
  }

  // Calculate prices for each swap event
  const prices: number[] = swapEvents.map((event) => {
    const price = calculatePriceFromSwap(event.amount_x, event.amount_y)
    return BigNumber.toNumber(price)
  }).filter((price) => price > 0)

  if (prices.length === 0) {
    return {
      tokenPrice24h: {
        open: 0,
        high: 0,
        low: 0,
      },
      underlyingAssetPrice24h: {
        open: 0,
        high: 0,
        low: 0,
      },
    }
  }

  const openPrice = prices[0]
  const highPrice = Math.max(...prices)
  const lowPrice = Math.min(...prices)

  return {
    tokenPrice24h: {
      open: openPrice,
      high: highPrice,
      low: lowPrice,
    },
    underlyingAssetPrice24h: {
      open: openPrice,
      high: highPrice,
      low: lowPrice,
    },
  }
}

/**
 * Get user dashboard data including balances
 */
export async function getUserDashboard(walletAddress?: string): Promise<UserDashboard> {
  if (!walletAddress) {
    // Return default/empty data when no wallet connected
    return {
      balance: 0,
      tokenBalance: 0,
      tokenSymbol: BASE_TOKEN.symbol,
      tokenName: BASE_TOKEN.displayName,
    }
  }

  // Get devnet RPC connection
  const DEVNET_RPC_URL = import.meta.env.VITE_DEVNET_RPC_URL || clusterApiUrl('devnet')
  const connection = new Connection(DEVNET_RPC_URL, 'confirmed')
  const publicKey = new PublicKey(walletAddress)

  // Get USDC balance (this represents user's USD balance)
  let usdcBalance = 0
  try {
    if (!QUOTE_MINT_ADDRESS) {
      throw new Error('Quote mint not configured')
    }
    const usdcMint = new PublicKey(QUOTE_MINT_ADDRESS)
    const usdcAta = await getAssociatedTokenAddress(usdcMint, publicKey)
    const usdcAccount = await getAccount(connection, usdcAta)
    const usdcBigNum = fromTokenAmount(usdcAccount.amount.toString(), QUOTE_DECIMALS)
    usdcBalance = BigNumber.toNumber(usdcBigNum)
  } catch {
    // Token account doesn't exist, balance is 0
    usdcBalance = 0
  }

  // Get base token balance (Token-2022)
  let tessBalance = 0
  try {
    if (!BASE_MINT_ADDRESS) {
      throw new Error('Base mint not configured')
    }
    const tessMint = new PublicKey(BASE_MINT_ADDRESS)
    const tessAta = await getAssociatedTokenAddress(
      tessMint,
      publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    )
    const tessAccount = await getAccount(connection, tessAta, 'confirmed', TOKEN_2022_PROGRAM_ID)
    const tessBigNum = fromTokenAmount(tessAccount.amount.toString(), BASE_DECIMALS)
    tessBalance = BigNumber.toNumber(tessBigNum)
  } catch {
    // Token account doesn't exist, balance is 0
    tessBalance = 0
  }

  return {
    balance: usdcBalance,
    tokenBalance: tessBalance,
    tokenSymbol: BASE_TOKEN.symbol,
    tokenName: BASE_TOKEN.displayName,
  }
}

/**
 * Get user-specific trade history from GraphQL
 */
export async function getUserTradeHistory(
  walletAddress: string | undefined,
  page: number = 1,
  pageSize: number = 10
): Promise<UserTradeHistoryResponse> {
  if (!walletAddress) {
    // Return empty data if no wallet connected
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }

  const offset = (page - 1) * pageSize
  const { events, total } = await fetchUserSwapEvents(walletAddress, pageSize, offset)

  // Transform swap events to trade history items
  const items: UserTradeHistoryItem[] = events.map((event) => {
    const isBuy = event.type === 'swap-y-for-x' // USDC -> Token is a buy

    // Format amounts using BigNumber utilities
    const amountX = formatSwapAmount(event.amount_x)
    const amountY = formatSwapAmount(event.amount_y)

    return {
      id: `${event.signature}-${event.block_time}`,
      token: BASE_TOKEN.symbol,
      amountIn: isBuy ? `${amountY} ${QUOTE_TOKEN.symbol}` : `${amountX} ${BASE_TOKEN.symbol}`,
      amountOut: isBuy ? `${amountX} ${BASE_TOKEN.symbol}` : `${amountY} ${QUOTE_TOKEN.symbol}`,
      type: isBuy ? 'Buy' : 'Sell',
      account: formatWalletAddress(event.sender),
      time: formatBlockTimeWithTime(event.block_time),
    }
  })

  const totalPages = Math.ceil(total / pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

// ============ Transparency Types ============

export interface AttestationDocument {
  id: string
  month: string
  year: number
  url: string
}

export interface AuditorVerification {
  auditor: string
  overcollateralized: boolean
  deltaNeutral: boolean
}

export interface ProofOfReserves {
  date: string
  lastUpdated: string
  verifications: AuditorVerification[]
}

export interface ThirdPartyLink {
  id: string
  name: string
  url: string
}

export interface TransparencyData {
  attestations: AttestationDocument[]
  proofOfReserves: ProofOfReserves
  thirdPartyLinks: ThirdPartyLink[]
  lastUpdated: string
}

// ============ Transparency Mock Data ============

const transparencyData: TransparencyData = {
  attestations: [
    { id: '1', month: 'October', year: 2025, url: '#' },
    { id: '2', month: 'September', year: 2025, url: '#' },
    { id: '3', month: 'August', year: 2025, url: '#' },
    { id: '4', month: 'July', year: 2025, url: '#' },
    { id: '5', month: 'June', year: 2025, url: '#' },
    { id: '6', month: 'May', year: 2025, url: '#' },
    { id: '7', month: 'April', year: 2025, url: '#' },
    { id: '8', month: 'March', year: 2025, url: '#' },
    { id: '9', month: 'February', year: 2025, url: '#' },
    { id: '10', month: 'January', year: 2025, url: '#' },
    { id: '11', month: 'December', year: 2024, url: '#' },
    { id: '12', month: 'November', year: 2024, url: '#' },
  ],
  proofOfReserves: {
    date: '7 Nov 2025',
    lastUpdated: '01 Nov 2025 07:00',
    verifications: [
      { auditor: 'Chainlink', overcollateralized: true, deltaNeutral: true },
      { auditor: 'Auditor B', overcollateralized: true, deltaNeutral: true },
      { auditor: 'Auditor C', overcollateralized: true, deltaNeutral: true },
      { auditor: 'Auditor D', overcollateralized: true, deltaNeutral: true },
      { auditor: 'Auditor E', overcollateralized: true, deltaNeutral: true },
    ],
  },
  thirdPartyLinks: [
    { id: '1', name: 'CoinGecko', url: '#' },
    { id: '2', name: 'CoinMarketCap', url: '#' },
    { id: '3', name: 'DeFiLlama', url: '#' },
    { id: '4', name: 'Dune Analytics', url: '#' },
    { id: '5', name: 'Solscan', url: '#' },
    { id: '6', name: 'Birdeye', url: '#' },
    { id: '7', name: 'Jupiter', url: '#' },
    { id: '8', name: 'Raydium', url: '#' },
    { id: '9', name: 'Orca', url: '#' },
    { id: '10', name: 'Meteora', url: '#' },
  ],
  lastUpdated: '01 Nov 2025 07:00',
}

// ============ Transparency API Functions ============

export async function getTransparencyData(): Promise<TransparencyData> {
  await sleep(400)
  return transparencyData
}

export async function getAttestations(year?: number): Promise<AttestationDocument[]> {
  await sleep(300)
  if (year) {
    return transparencyData.attestations.filter((a) => a.year === year)
  }
  return transparencyData.attestations
}
