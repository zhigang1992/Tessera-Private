import { sleep } from './utils'

// ============ Types ============

export interface TradingLeaderboardItem {
  rank: number
  user: string
  tradingVolume: number
  tradingPoints: number
  feeRebates: number
}

export interface ReferralLeaderboardItem {
  rank: number
  user: string
  traderReferral: number
  tradingPoints: number
  feeRewards: number
}

export interface LeaderboardResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============ Raw Mock Data ============

const generateTradingLeaderboardData = (): TradingLeaderboardItem[] => {
  return Array.from({ length: 100 }, (_, i) => ({
    rank: i + 1,
    user: '0×123...SHXHZ',
    tradingVolume: 123456789,
    tradingPoints: 123456,
    feeRebates: 0.5,
  }))
}

const generateReferralLeaderboardData = (): ReferralLeaderboardItem[] => {
  return Array.from({ length: 100 }, (_, i) => ({
    rank: i + 1,
    user: '0×123...SHXHZ',
    traderReferral: 1234,
    tradingPoints: 123456,
    feeRewards: 0.5,
  }))
}

const rawTradingLeaderboard = generateTradingLeaderboardData()
const rawReferralLeaderboard = generateReferralLeaderboardData()

// ============ API Functions ============

export async function getTradingLeaderboard(
  page: number = 1,
  pageSize: number = 10,
): Promise<LeaderboardResponse<TradingLeaderboardItem>> {
  await sleep(500)
  const start = (page - 1) * pageSize
  const items = rawTradingLeaderboard.slice(start, start + pageSize)
  const total = rawTradingLeaderboard.length
  const totalPages = Math.ceil(total / pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function getReferralLeaderboard(
  page: number = 1,
  pageSize: number = 10,
): Promise<LeaderboardResponse<ReferralLeaderboardItem>> {
  await sleep(500)
  const start = (page - 1) * pageSize
  const items = rawReferralLeaderboard.slice(start, start + pageSize)
  const total = rawReferralLeaderboard.length
  const totalPages = Math.ceil(total / pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

// Get current user's rank (simulated)
export async function getCurrentUserTradingRank(walletAddress?: string): Promise<number | null> {
  await sleep(200)
  if (!walletAddress) return null
  // Simulate user being at rank 7
  return 7
}

export async function getCurrentUserReferralRank(walletAddress?: string): Promise<number | null> {
  await sleep(200)
  if (!walletAddress) return null
  // Simulate user being at rank 7
  return 7
}
