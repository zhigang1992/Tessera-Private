import { fetchGlobalReferralStats } from '@/features/referral/lib/graphql-client'

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
 * Get trading leaderboard
 * TODO: Waiting for backend view `view_trader_volume_stats` to be created
 * Currently returns empty data
 */
export async function getTradingLeaderboard(
  _page: number = 1,
  pageSize: number = 10
): Promise<LeaderboardResponse<TradingLeaderboardItem>> {
  // Trading leaderboard data not yet available from GraphQL
  // Return empty results until backend creates the view
  return {
    items: [],
    total: 0,
    page: _page,
    pageSize,
    totalPages: 0,
  }
}

/**
 * Get referral leaderboard from GraphQL
 */
export async function getReferralLeaderboard(
  page: number = 1,
  pageSize: number = 10
): Promise<LeaderboardResponse<ReferralLeaderboardItem>> {
  try {
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
  } catch (error) {
    console.warn('Failed to fetch referral leaderboard from GraphQL:', error)
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }
}

/**
 * Get current user's trading rank
 * TODO: Implement when trading leaderboard view is available
 */
export async function getCurrentUserTradingRank(_walletAddress?: string): Promise<number | null> {
  // Not implemented until trading leaderboard view is available
  return null
}

/**
 * Get current user's referral rank
 */
export async function getCurrentUserReferralRank(walletAddress?: string): Promise<number | null> {
  if (!walletAddress) return null

  try {
    // Fetch all stats to find user's rank
    // Note: This is inefficient for large datasets, ideally backend should provide a rank lookup
    const data = await fetchGlobalReferralStats(100, 0)

    const userIndex = data.view_owner_referral_stats.findIndex(
      (stat) => stat.owner === walletAddress
    )

    return userIndex >= 0 ? userIndex + 1 : null
  } catch (error) {
    console.warn('Failed to fetch user referral rank:', error)
    return null
  }
}
