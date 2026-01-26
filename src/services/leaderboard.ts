import {
  fetchGlobalReferralStats,
  fetchTradingVolumeLeaderboard,
  fetchUserTradingVolumeRank,
} from '@/features/referral/lib/graphql-client'
import { fromHasuraToNative, BigNumber } from '@/lib/bignumber'

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

// ============ Helper Functions ============

/**
 * Format wallet address for display (truncated)
 */
function formatWalletAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

// ============ API Functions ============

/**
 * Get trading leaderboard from GraphQL
 */
export async function getTradingLeaderboard(
  page: number = 1,
  pageSize: number = 10
): Promise<LeaderboardResponse<TradingLeaderboardItem>> {
  const offset = (page - 1) * pageSize
  const data = await fetchTradingVolumeLeaderboard(pageSize, offset)

  const items: TradingLeaderboardItem[] = data.items.map((item, index) => ({
    rank: offset + index + 1,
    user: formatWalletAddress(item.account),
    tradingVolume: BigNumber.toNumber(fromHasuraToNative(item.total_volume)),
    tradingPoints: 0, // Not tracked in current schema
    feeRebates: 0, // Not tracked in current schema
  }))

  const totalPages = Math.ceil(data.total / pageSize)

  return {
    items,
    total: data.total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Get referral leaderboard from GraphQL
 */
export async function getReferralLeaderboard(
  page: number = 1,
  pageSize: number = 10
): Promise<LeaderboardResponse<ReferralLeaderboardItem>> {
  const offset = (page - 1) * pageSize
  const data = await fetchGlobalReferralStats(pageSize, offset)

  const items: ReferralLeaderboardItem[] = data.view_owner_referral_stats.map((stat, index) => ({
    rank: offset + index + 1,
    user: formatWalletAddress(stat.owner),
    traderReferral: Number(stat.invited_count) || 0,
    tradingPoints: 0, // Not tracked in current schema
    feeRewards: 0, // Not tracked in current schema
  }))

  const total = data.view_owner_referral_stats_aggregate.aggregate.count
  const totalPages = Math.ceil(total / pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Get current user's trading rank
 */
export async function getCurrentUserTradingRank(walletAddress?: string): Promise<number | null> {
  if (!walletAddress) return null

  const result = await fetchUserTradingVolumeRank(walletAddress)
  return result?.rank ?? null
}

/**
 * Get current user's referral rank
 */
export async function getCurrentUserReferralRank(walletAddress?: string): Promise<number | null> {
  if (!walletAddress) return null

  // Fetch all stats to find user's rank
  // Note: This is inefficient for large datasets, ideally backend should provide a rank lookup
  const data = await fetchGlobalReferralStats(100, 0)

  const userIndex = data.view_owner_referral_stats.findIndex(
    (stat) => stat.owner === walletAddress
  )

  return userIndex >= 0 ? userIndex + 1 : null
}
