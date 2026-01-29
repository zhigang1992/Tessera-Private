export type LeaderboardType = 'trading' | 'referral'

export interface LeaderboardEntry {
  account: string
  rank: number
  total_referrals: number
  total_rewards_usd: number
  total_trading_points: number
  total_trading_volume: number
}

export interface LeaderboardSummaryData {
  account: string
  total_referrals: number // bigint from GraphQL
  total_rewards_usd: string // numeric from GraphQL (18 decimals)
  total_trading_points: string // numeric from GraphQL (18 decimals)
  total_trading_volume: string // numeric from GraphQL (18 decimals)
}

export interface LeaderboardQueryResult {
  public_marts_leaderboard_summary: LeaderboardSummaryData[]
  public_marts_leaderboard_summary_aggregate: {
    aggregate: {
      count: number
    }
  }
}

// Legacy types for backward compatibility
export interface LegacyLeaderboardEntry {
  owner: string
  invited_count: number
  rank: number
}

export interface LegacyLeaderboardQueryResult {
  view_owner_referral_stats: Array<{
    owner: string
    invited_count: number
  }>
  view_owner_referral_stats_aggregate: {
    aggregate: {
      count: number
    }
  }
}
