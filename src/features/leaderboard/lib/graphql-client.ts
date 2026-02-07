import type { LeaderboardQueryResult, LeaderboardType } from '../types'
import { getGraphQLEndpoint } from '@/config'

const GRAPHQL_ENDPOINT = getGraphQLEndpoint()

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

  const summaryResponse = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: summaryQuery,
      variables: { limit, offset },
    }),
  })

  if (!summaryResponse.ok) {
    throw new Error(`GraphQL request failed: ${summaryResponse.statusText}`)
  }

  const summaryResult = await summaryResponse.json()

  if (summaryResult.errors) {
    throw new Error(summaryResult.errors[0]?.message || 'GraphQL query failed')
  }

  const summaryData = summaryResult.data
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

  const pointsResponse = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: pointsQuery,
      variables: { accounts },
    }),
  })

  if (!pointsResponse.ok) {
    throw new Error(`GraphQL request failed: ${pointsResponse.statusText}`)
  }

  const pointsResult = await pointsResponse.json()

  if (pointsResult.errors) {
    throw new Error(pointsResult.errors[0]?.message || 'GraphQL query failed')
  }

  // Create a map of account to points
  const pointsMap = new Map<string, string>()
  pointsResult.data.public_marts_trading_points_by_account.forEach((entry: any) => {
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
