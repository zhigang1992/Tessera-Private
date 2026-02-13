import type { LeaderboardQueryResult, LeaderboardType } from '../types'
import { getGraphQLEndpoint } from '@/config'

const GRAPHQL_ENDPOINT = getGraphQLEndpoint()

interface GraphQLResponse<T> {
  data: T
  errors?: Array<{ message?: string }>
}

interface LeaderboardSummaryRow {
  account: string
  total_referrals: number | string
  total_rewards_usd: string
  total_trading_volume: string
}

interface TradingPointsRow {
  account: string
  own_trading_points: string | null
  referral_trading_points: string | null
}

export interface CurrentUserLeaderboardQueryResult {
  account: string
  rank: number
  total_referrals: number | string
  total_rewards_usd: string
  total_trading_points: string
  total_trading_volume: string
}

async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`)
  }

  const result: GraphQLResponse<T> = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL query failed')
  }

  return result.data
}

/**
 * Fetch leaderboard data from public_marts.leaderboard_summary
 * For points, we fetch the appropriate field from trading_points_by_account separately
 * Supports sorting by trading volume or referral count
 */
export async function fetchLeaderboard(
  limit: number = 10,
  offset: number = 0,
  type: LeaderboardType = 'trading'
): Promise<LeaderboardQueryResult> {
  // Determine sort order based on leaderboard type
  const orderBy = type === 'trading'
    ? '{ total_trading_volume: desc_nulls_last }'
    : '{ total_referrals: desc_nulls_last }'

  // First, fetch leaderboard summary with accounts
  const summaryQuery = `
    query GetLeaderboardSummary($limit: Int!, $offset: Int!) {
      public_marts_leaderboard_summary(
        limit: $limit
        offset: $offset
        order_by: ${orderBy}
      ) {
        account
        total_referrals
        total_rewards_usd
        total_trading_volume
      }
      public_marts_leaderboard_summary_aggregate {
        aggregate {
          count
        }
      }
    }
  `

  const summaryData = await graphqlRequest<{
    public_marts_leaderboard_summary: LeaderboardSummaryRow[]
    public_marts_leaderboard_summary_aggregate: {
      aggregate: {
        count: number
      }
    }
  }>(summaryQuery, { limit, offset })
  const accounts = summaryData.public_marts_leaderboard_summary.map((entry: any) => entry.account)

  // Now fetch trading points for these accounts
  const pointsField = type === 'trading' ? 'own_trading_points' : 'referral_trading_points'

  const pointsQuery = `
    query GetTradingPoints($accounts: [String!]!) {
      public_marts_trading_points_by_account(
        where: { account: { _in: $accounts } }
      ) {
        account
        own_trading_points
        referral_trading_points
      }
    }
  `

  const pointsResult = accounts.length
    ? await graphqlRequest<{ public_marts_trading_points_by_account: TradingPointsRow[] }>(pointsQuery, { accounts })
    : { public_marts_trading_points_by_account: [] }

  // Create a map of account to points
  const pointsMap = new Map<string, string>()
  pointsResult.public_marts_trading_points_by_account.forEach((entry: TradingPointsRow) => {
    pointsMap.set(entry.account, entry[pointsField] || '0')
  })

  // Merge the data
  const mergedData = summaryData.public_marts_leaderboard_summary.map((entry: any) => ({
    ...entry,
    total_trading_points: pointsMap.get(entry.account) || '0'
  }))

  return {
    public_marts_leaderboard_summary: mergedData,
    public_marts_leaderboard_summary_aggregate: summaryData.public_marts_leaderboard_summary_aggregate
  }
}

export async function fetchCurrentUserLeaderboardEntry(
  walletAddress: string,
  type: LeaderboardType = 'trading'
): Promise<CurrentUserLeaderboardQueryResult | null> {
  const pointsField = type === 'trading' ? 'own_trading_points' : 'referral_trading_points'

  const userSummaryQuery = `
    query GetCurrentUserLeaderboardEntry($account: String!) {
      public_marts_leaderboard_summary(where: { account: { _eq: $account } }, limit: 1) {
        account
        total_referrals
        total_rewards_usd
        total_trading_volume
      }
      public_marts_trading_points_by_account(where: { account: { _eq: $account } }, limit: 1) {
        own_trading_points
        referral_trading_points
      }
    }
  `

  const userSummaryData = await graphqlRequest<{
    public_marts_leaderboard_summary: LeaderboardSummaryRow[]
    public_marts_trading_points_by_account: TradingPointsRow[]
  }>(userSummaryQuery, { account: walletAddress })

  const userSummary = userSummaryData.public_marts_leaderboard_summary[0]

  if (!userSummary) {
    return null
  }

  const rankQuery = type === 'trading'
    ? `
      query GetCurrentUserTradingRank($value: numeric!) {
        public_marts_leaderboard_summary_aggregate(
          where: { total_trading_volume: { _gt: $value } }
        ) {
          aggregate {
            count
          }
        }
      }
    `
    : `
      query GetCurrentUserReferralRank($value: bigint!) {
        public_marts_leaderboard_summary_aggregate(
          where: { total_referrals: { _gt: $value } }
        ) {
          aggregate {
            count
          }
        }
      }
    `

  const rankValue = type === 'trading'
    ? userSummary.total_trading_volume
    : userSummary.total_referrals

  const rankData = await graphqlRequest<{
    public_marts_leaderboard_summary_aggregate: {
      aggregate: {
        count: number
      }
    }
  }>(rankQuery, { value: rankValue })

  return {
    account: userSummary.account,
    rank: rankData.public_marts_leaderboard_summary_aggregate.aggregate.count + 1,
    total_referrals: userSummary.total_referrals,
    total_rewards_usd: userSummary.total_rewards_usd,
    total_trading_points: userSummaryData.public_marts_trading_points_by_account[0]?.[pointsField] || '0',
    total_trading_volume: userSummary.total_trading_volume,
  }
}
