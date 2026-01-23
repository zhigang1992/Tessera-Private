import { sleep } from './utils'
import { fetchDashboardStats } from '@/features/referral/lib/graphql-client'

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

const userDashboard: UserDashboard = {
  balance: 1355.87,
  tokenBalance: 13.27,
  tokenSymbol: 'T-SpaceX',
  tokenName: 'T-SpaceX Token',
  healthFactor: 100,
}

// Generate user trade history
function generateUserTradeHistory(): UserTradeHistoryItem[] {
  const items: UserTradeHistoryItem[] = []
  const accounts = ['0xA8D0...6006']
  const times = ['Today at 3:20 PM', 'Today at 2:45 PM', 'Today at 1:30 PM', 'Yesterday at 5:00 PM', 'Yesterday at 11:20 AM']

  for (let i = 1; i <= 100; i++) {
    items.push({
      id: `user-trade-${i}`,
      token: 'T-SPACEX',
      amountIn: '1,000 USDC',
      amountOut: '300.2 T-SPACEX',
      type: 'Buy',
      account: accounts[0],
      time: times[Math.floor(Math.random() * times.length)],
    })
  }

  return items
}

const rawUserTradeHistory = generateUserTradeHistory()

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

export async function getUserDashboard(): Promise<UserDashboard> {
  await sleep(300)
  return userDashboard
}

export async function getUserTradeHistory(page: number = 1, pageSize: number = 10): Promise<UserTradeHistoryResponse> {
  await sleep(500)
  const start = (page - 1) * pageSize
  const items = rawUserTradeHistory.slice(start, start + pageSize)
  const total = rawUserTradeHistory.length
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
