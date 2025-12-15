export interface LeaderboardEntry {
  owner: string
  invited_count: number
  rank: number
}

export interface LeaderboardQueryResult {
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
