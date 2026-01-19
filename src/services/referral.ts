import { sleep } from './utils'
import {
  fetchAffiliateStats,
  fetchUserRegistration,
  fetchTradersForCode,
  type AggregatedAffiliateStats,
  type UserRegisteredEvent,
} from '@/features/referral/lib/graphql-client'

// ============ Types ============

export interface RewardsData {
  rewards: number
  referralPoints: number | null
}

export interface TraderLayer {
  layer: string
  tradersReferred: number
  points: number
}

export interface ReferralCode {
  code: string
  totalVolume: number
  tradersReferred: number
  totalRewards: number
}

export interface RewardItem {
  amount: number
  token: string
}

export interface ReferralUser {
  id: string
  email: string
  dateJoined: string
  layer: 'L1' | 'L2' | 'L3'
  rewards: RewardItem[]
  referredBy?: string // referrer's user id
}

// Traders tab types
export interface TradersOverviewData {
  tradingVolume: number
  activeReferralCode: string | null
  tradingPoints: number
}

export interface TradingHistoryItem {
  id: string
  token: string
  tokenIcon?: string
  amountIn: string
  amountOut: string
  type: 'Buy' | 'Sell'
  account: string
  time: string
}

export interface TradingHistoryResponse {
  items: TradingHistoryItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Store wallet address for service layer (set by components that have wallet context)
let currentWalletAddress: string | null = null

export function setCurrentWalletAddress(address: string | null) {
  currentWalletAddress = address
}

export function getCurrentWalletAddress(): string | null {
  return currentWalletAddress
}


// ============ Helper Functions (calculation logic) ============

function formatCurrency(value: number): string {
  return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatSOL(value: number): string {
  return `${value.toFixed(2)} SOL`
}

// ============ API Functions ============

// Cache for GraphQL stats to avoid repeated calls
let cachedAffiliateStats: AggregatedAffiliateStats | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 30000 // 30 seconds

async function getCachedAffiliateStats(): Promise<AggregatedAffiliateStats | null> {
  if (!currentWalletAddress) return null

  const now = Date.now()
  if (cachedAffiliateStats && now - cacheTimestamp < CACHE_TTL) {
    return cachedAffiliateStats
  }

  try {
    cachedAffiliateStats = await fetchAffiliateStats(currentWalletAddress)
    cacheTimestamp = now
    return cachedAffiliateStats
  } catch (error) {
    console.warn('Failed to fetch affiliate stats from GraphQL:', error)
    return null
  }
}

export async function getRewardsOverview(): Promise<RewardsData> {
  const stats = await getCachedAffiliateStats()

  // Always return GraphQL data (which may be zeros if no data exists)
  // Only fall back to mock if GraphQL fetch failed entirely (stats is null)
  if (stats) {
    return {
      rewards: stats.totalRewardsUsd,
      referralPoints: stats.totalReferrals,
    }
  }

  // Return zeros when no wallet connected or GraphQL failed
  return {
    rewards: 0,
    referralPoints: 0,
  }
}

export async function getTraderLayers(): Promise<TraderLayer[]> {
  const stats = await getCachedAffiliateStats()

  // Always return GraphQL data (which may be zeros if no data exists)
  if (stats) {
    return [
      { layer: 'L1', tradersReferred: stats.tier1Referrals, points: Math.round(stats.tier1Rewards) },
      { layer: 'L2', tradersReferred: stats.tier2Referrals, points: Math.round(stats.tier2Rewards) },
      { layer: 'L3', tradersReferred: stats.tier3Referrals, points: Math.round(stats.tier3Rewards) },
    ]
  }

  // Return zeros when no wallet connected or GraphQL failed
  return [
    { layer: 'L1', tradersReferred: 0, points: 0 },
    { layer: 'L2', tradersReferred: 0, points: 0 },
    { layer: 'L3', tradersReferred: 0, points: 0 },
  ]
}

export async function getReferralCodes(): Promise<ReferralCode[]> {
  const stats = await getCachedAffiliateStats()

  if (stats && stats.codes.length > 0) {
    return stats.codes.map((c) => ({
      code: c.code,
      totalVolume: c.tradingVolume,
      tradersReferred: c.referralCount,
      totalRewards: c.rewardsUsd,
    }))
  }

  // Return empty array when no codes exist or GraphQL failed
  return []
}

/**
 * Determine the tier (L1, L2, L3) of a user relative to the current wallet owner
 */
function determineUserTier(event: UserRegisteredEvent, ownerWallet: string): 'L1' | 'L2' | 'L3' {
  // L1: Direct referral - tier1_referrer is the code owner
  if (event.tier1_referrer === ownerWallet) {
    return 'L1'
  }
  // L2: Second-level referral - tier2_referrer is the code owner
  if (event.tier2_referrer === ownerWallet) {
    return 'L2'
  }
  // L3: Third-level referral - tier3_referrer is the code owner
  if (event.tier3_referrer === ownerWallet) {
    return 'L3'
  }
  // Default to L1 if no match (shouldn't happen for valid data)
  return 'L1'
}

/**
 * Format a wallet address for display (truncate middle)
 */
function formatWalletAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Format timestamp to readable date
 */
function formatBlockTime(blockTime: number): string {
  const date = new Date(blockTime * 1000) // block_time is in seconds
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export async function getReferralUsersByCode(code: string): Promise<ReferralUser[]> {
  if (!currentWalletAddress) {
    return []
  }

  try {
    const traders = await fetchTradersForCode(code)

    return traders.map((event) => ({
      id: event.signature,
      email: formatWalletAddress(event.user), // Using wallet address as identifier
      dateJoined: formatBlockTime(event.block_time),
      layer: determineUserTier(event, currentWalletAddress!),
      rewards: [], // Rewards data would need separate query - leaving empty for now
    }))
  } catch (error) {
    console.warn('Failed to fetch traders for code from GraphQL:', error)
    return []
  }
}

// Clear cache when wallet changes
export function clearAffiliateStatsCache() {
  cachedAffiliateStats = null
  cacheTimestamp = 0
}

// ============ Traders Tab Data ============

const tradersOverviewData: TradersOverviewData = {
  tradingVolume: 100,
  activeReferralCode: 'jfhdkskl9',
  tradingPoints: 100000,
}

// Generate mock trading history data
const generateTradingHistory = (): TradingHistoryItem[] => {
  const items: TradingHistoryItem[] = []
  for (let i = 1; i <= 100; i++) {
    items.push({
      id: `trade-${i}`,
      token: 'T-SPACEX',
      amountIn: '1,000 USDC',
      amountOut: '300.2 T-SPACEX',
      type: 'Buy',
      account: '0xA8D0...6006',
      time: 'Today at 3:20 PM',
    })
  }
  return items
}

const rawTradingHistory = generateTradingHistory()

// ============ Traders Tab API Functions ============

export async function getTradersOverview(): Promise<TradersOverviewData> {
  if (currentWalletAddress) {
    try {
      // Fetch user registration to get active referral code
      const registration = await fetchUserRegistration(currentWalletAddress)
      const activeReferralCode = registration?.referral_code ?? null

      // For trading volume, we would need to aggregate from swap events
      // For now, return 0 as the data model doesn't track per-user trading volume
      return {
        tradingVolume: 0, // TODO: Implement swap volume aggregation
        activeReferralCode,
        tradingPoints: 0, // Not tracked in current schema
      }
    } catch (error) {
      console.warn('Failed to fetch traders overview from GraphQL:', error)
    }
  }

  // Fallback to mock data
  await sleep(400)
  return tradersOverviewData
}

export async function getTradingHistory(
  page: number = 1,
  pageSize: number = 10
): Promise<TradingHistoryResponse> {
  await sleep(500)
  const start = (page - 1) * pageSize
  const items = rawTradingHistory.slice(start, start + pageSize)
  const total = rawTradingHistory.length
  const totalPages = Math.ceil(total / pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

// ============ Export Helper Functions (for formatting in components) ============

export { formatCurrency, formatSOL }
