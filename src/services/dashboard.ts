import { sleep } from './utils'
import { fetchDashboardStats, fetchUserSwapEvents } from '@/features/referral/lib/graphql-client'
import { fromHasuraToNative, formatBigNumber, BigNumber, type BigNumberSource, fromTokenAmount } from '@/lib/bignumber'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { DEVNET_POOLS } from './meteora'

// ============ Types ============

export interface MarketStatsData {
  totalMarketCap: number
  totalTradingVolume: number
  activeTraders: number
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
  healthFactor: number // 0-100 percentage
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
  symbol: 'T-SpaceX',
  name: 'T-SpaceX',
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
  sharesPerToken: '1 T-SPACEX = 1.00 SPACEX EQUITY',
}

const tokenStatistics: TokenStatistics = {
  tokenPrice24h: {
    open: 440.37,
    high: 449.63,
    low: 433.41,
  },
  underlyingAssetPrice24h: {
    open: 440.37,
    high: 449.63,
    low: 433.41,
  },
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
 */
export async function getMarketStats(): Promise<MarketStatsData> {
  try {
    const stats = await fetchDashboardStats()

    // For now, we'll use mock data for market cap and assets tokenized
    // These would come from different sources (e.g., token prices, treasury data)
    return {
      totalMarketCap: 485200000000, // $485.2B mock value
      totalTradingVolume: stats.totalTradingVolume,
      activeTraders: stats.totalTraders,
      assetsTokenized: 6, // Mock value - would come from token registry
    }
  } catch (error) {
    console.error('Failed to fetch market stats:', error)
    // Return mock data as fallback
    return {
      totalMarketCap: 485200000000,
      totalTradingVolume: 42500000,
      activeTraders: 24285,
      assetsTokenized: 6,
    }
  }
}

/**
 * Get list of tokenized assets for the assets table
 */
export async function getTokenizedAssets(): Promise<AssetData[]> {
  await sleep(300)
  // TODO: Replace with real data from token registry / GraphQL
  // For now returning mock data
  return [
    {
      id: 'spacex',
      symbol: 'T-SPACEX',
      name: 'T-SPACEX',
      code: 'SPX-TX2002',
      sector: 'Aerospace',
      price: 95.4,
      holders: 15420,
      valuation: '$180B',
    },
    {
      id: 'openai',
      symbol: 'T-OPENAI',
      name: 'T-OPENAI',
      code: 'OAI-TX1001',
      sector: 'Technology',
      price: 127.85,
      holders: 23150,
      valuation: '$290B',
    },
  ]
}

// ============ API Functions ============

export async function getDashboardStats(): Promise<DashboardStats> {
  await sleep(300)
  return dashboardStats
}

export async function getDashboardTokenInfo(): Promise<TokenInfo> {
  await sleep(400)
  return tokenInfo
}

export async function getDashboardStatistics(): Promise<TokenStatistics> {
  await sleep(300)
  return tokenStatistics
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
      tokenSymbol: 'T-SPACEX',
      tokenName: 'T-SPACEX Token',
      healthFactor: 100,
    }
  }

  try {
    // Get devnet RPC connection
    const DEVNET_RPC_URL = import.meta.env.VITE_DEVNET_RPC_URL || clusterApiUrl('devnet')
    const connection = new Connection(DEVNET_RPC_URL, 'confirmed')
    const publicKey = new PublicKey(walletAddress)

    // Get USDC balance (this represents user's USD balance)
    let usdcBalance = 0
    try {
      const usdcMint = new PublicKey(DEVNET_POOLS['TESS-USDC'].tokenY.mint)
      const usdcAta = await getAssociatedTokenAddress(usdcMint, publicKey)
      const usdcAccount = await getAccount(connection, usdcAta)
      const usdcBigNum = fromTokenAmount(usdcAccount.amount.toString(), DEVNET_POOLS['TESS-USDC'].tokenY.decimals)
      usdcBalance = BigNumber.toNumber(usdcBigNum)
    } catch {
      // Token account doesn't exist, balance is 0
      usdcBalance = 0
    }

    // Get TESS token balance (Token-2022)
    let tessBalance = 0
    try {
      const tessMint = new PublicKey(DEVNET_POOLS['TESS-USDC'].tokenX.mint)
      const tessAta = await getAssociatedTokenAddress(
        tessMint,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      )
      const tessAccount = await getAccount(connection, tessAta, 'confirmed', TOKEN_2022_PROGRAM_ID)
      const tessBigNum = fromTokenAmount(tessAccount.amount.toString(), DEVNET_POOLS['TESS-USDC'].tokenX.decimals)
      tessBalance = BigNumber.toNumber(tessBigNum)
    } catch {
      // Token account doesn't exist, balance is 0
      tessBalance = 0
    }

    return {
      balance: usdcBalance,
      tokenBalance: tessBalance,
      tokenSymbol: 'T-SPACEX',
      tokenName: 'T-SPACEX Token',
      healthFactor: 100, // TODO: Calculate health factor based on actual metrics
    }
  } catch (error) {
    console.error('Failed to fetch user dashboard:', error)
    // Return zeros on error
    return {
      balance: 0,
      tokenBalance: 0,
      tokenSymbol: 'T-SPACEX',
      tokenName: 'T-SPACEX Token',
      healthFactor: 100,
    }
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

  try {
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
        token: 'T-SPACEX', // TODO: Map mint addresses to token symbols
        amountIn: isBuy ? `${amountY} USDC` : `${amountX} T-SPACEX`,
        amountOut: isBuy ? `${amountX} T-SPACEX` : `${amountY} USDC`,
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
  } catch (error) {
    console.error('Failed to fetch user trade history:', error)
    // Return empty data on error
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
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
      { auditor: 'Auditor A', overcollateralized: true, deltaNeutral: true },
      { auditor: 'Auditor B', overcollateralized: true, deltaNeutral: true },
      { auditor: 'Auditor C', overcollateralized: true, deltaNeutral: true },
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
