import { sleep } from './utils'
import {
  fetchAffiliateStats,
  fetchUserRegistration,
  type AggregatedAffiliateStats,
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

// ============ Raw Mock Data (simulating backend raw data) ============

// Raw referral code data
interface RawReferralCode {
  code: string
  createdAt: string
}

const rawReferralCodes: RawReferralCode[] = [
  { code: 'JFHDKSKL9', createdAt: '2025-11-01' },
  { code: 'JFHDKSKL1', createdAt: '2025-11-15' },
  { code: 'JFHDKSKL2', createdAt: '2025-12-01' },
  { code: 'ABCD1234', createdAt: '2025-10-01' },
  { code: 'EFGH5678', createdAt: '2025-10-05' },
  { code: 'IJKL9012', createdAt: '2025-10-10' },
  { code: 'MNOP3456', createdAt: '2025-10-15' },
  { code: 'QRST7890', createdAt: '2025-10-20' },
  { code: 'UVWX1357', createdAt: '2025-10-25' },
  { code: 'YZAB2468', createdAt: '2025-10-28' },
  { code: 'CDEF3691', createdAt: '2025-11-02' },
  { code: 'GHIJ4820', createdAt: '2025-11-05' },
]

// Raw user data - includes referral relationships
const rawUsers: ReferralUser[] = [
  // Mock users matching design
  { id: 'u1', email: 'm****@hotmain.com', dateJoined: 'Dec 12, 2025', layer: 'L1', rewards: [{ amount: 0.2, token: 'SPACE-X' }, { amount: 0.1, token: 'Kalshi' }] },
  { id: 'u2', email: 'h*****@gmail.com', dateJoined: 'Dec 7, 2025', layer: 'L3', rewards: [{ amount: 0.2, token: 'SPACE-X' }] },
  { id: 'u3', email: 'E8LGMQFiuuweilLLQiejend88274', dateJoined: 'Nov 25, 2025', layer: 'L1', rewards: [{ amount: 0.2, token: 'SPACE-X' }] },
  { id: 'u4', email: '8mgd8dioe11Quj867Gnq400978L', dateJoined: 'Nov 16, 2025', layer: 'L2', rewards: [{ amount: 0.2, token: 'SPACE-X' }] },
  { id: 'u5', email: 'a****@gmail.com', dateJoined: 'Nov 10, 2025', layer: 'L1', rewards: [{ amount: 0.15, token: 'SPACE-X' }, { amount: 0.05, token: 'Kalshi' }] },
  { id: 'u6', email: 'b****@yahoo.com', dateJoined: 'Nov 5, 2025', layer: 'L2', rewards: [{ amount: 0.1, token: 'SPACE-X' }] },
  { id: 'u7', email: 'c****@outlook.com', dateJoined: 'Oct 28, 2025', layer: 'L1', rewards: [{ amount: 0.25, token: 'SPACE-X' }] },
  { id: 'u8', email: 'd****@icloud.com', dateJoined: 'Oct 20, 2025', layer: 'L3', rewards: [{ amount: 0.08, token: 'SPACE-X' }], referredBy: 'u6' },
  { id: 'u9', email: 'e****@proton.me', dateJoined: 'Oct 15, 2025', layer: 'L1', rewards: [{ amount: 0.3, token: 'SPACE-X' }, { amount: 0.12, token: 'Kalshi' }] },
]

// Mapping between referral codes and users
const codeUserMapping: Record<string, string[]> = {
  JFHDKSKL9: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
  JFHDKSKL1: ['u7', 'u8', 'u9', 'u10', 'u11'],
  JFHDKSKL2: ['u12', 'u13'],
  ABCD1234: ['u14', 'u15'],
  EFGH5678: ['u16', 'u17'],
  IJKL9012: ['u18'],
  MNOP3456: ['u19', 'u20', 'u21'],
  QRST7890: ['u22'],
  UVWX1357: ['u23', 'u24', 'u25'],
  YZAB2468: ['u26'],
  CDEF3691: ['u27', 'u28'],
  GHIJ4820: ['u29', 'u30'],
}

// ============ Helper Functions (calculation logic) ============

function formatCurrency(value: number): string {
  return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatSOL(value: number): string {
  return `${value.toFixed(2)} SOL`
}

function getUsersByCode(code: string): ReferralUser[] {
  // Case-insensitive lookup
  const normalizedCode = code.toUpperCase()
  const matchingKey = Object.keys(codeUserMapping).find((key) => key.toUpperCase() === normalizedCode)
  const userIds = matchingKey ? codeUserMapping[matchingKey] : []
  return rawUsers.filter((u) => userIds.includes(u.id))
}

function calculateCodeStats(code: string): ReferralCode {
  const users = getUsersByCode(code)
  // Sum all rewards across all users
  const totalRewards = users.reduce((sum, u) => {
    return sum + u.rewards.reduce((rSum, r) => rSum + r.amount, 0)
  }, 0)

  return {
    code,
    totalVolume: 0, // Not tracked in new data model
    tradersReferred: users.length,
    totalRewards,
  }
}

function calculateTraderLayers(): TraderLayer[] {
  const layers: Record<string, { count: number; points: number }> = {
    L1: { count: 0, points: 0 },
    L2: { count: 0, points: 0 },
    L3: { count: 0, points: 0 },
  }

  rawUsers.forEach((user) => {
    layers[user.layer].count++
    // Points no longer tracked, use 0
  })

  return Object.entries(layers).map(([layer, data]) => ({
    layer,
    tradersReferred: data.count,
    points: data.points,
  }))
}

function calculateRewardsOverview(): RewardsData {
  const totalRewards = rawUsers.reduce((sum, u) => {
    return sum + u.rewards.reduce((rSum, r) => rSum + r.amount, 0)
  }, 0)

  return {
    rewards: totalRewards,
    referralPoints: 0, // Points no longer tracked
  }
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

export async function getReferralUsersByCode(_code: string): Promise<ReferralUser[]> {
  await sleep(300)
  // Return first 6 users as mock data for any code
  // TODO: Implement GraphQL query for traders by code
  return rawUsers.slice(0, 6)
}

export async function createReferralCode(customCode?: string): Promise<{ success: boolean; code?: ReferralCode; error?: string }> {
  await sleep(800)

  // Validate and check for duplicates if custom code provided
  if (customCode) {
    const normalizedCode = customCode.toUpperCase().trim()

    // Check if code already exists
    const existingCodes = rawReferralCodes.map((c) => c.code.toUpperCase())
    if (existingCodes.includes(normalizedCode)) {
      return { success: false, error: 'Code already taken' }
    }

    return {
      success: true,
      code: {
        code: normalizedCode,
        totalVolume: 0,
        tradersReferred: 0,
        totalRewards: 0,
      },
    }
  }

  // Generate random code
  const newCode = `CODE${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  return {
    success: true,
    code: {
      code: newCode,
      totalVolume: 0,
      tradersReferred: 0,
      totalRewards: 0,
    },
  }
}

export async function deleteReferralCode(code: string): Promise<boolean> {
  await sleep(300)
  console.log(`Deleting code: ${code}`)
  return true
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
