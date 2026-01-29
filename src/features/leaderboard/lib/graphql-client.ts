import type { LeaderboardQueryResult, LeaderboardType } from '../types'

const GRAPHQL_ENDPOINT = 'https://tracker-gql-dev.tessera.fun/v1/graphql'

/**
 * Fetch leaderboard data from public_marts.leaderboard_summary
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

  const query = `
    query GetLeaderboard($limit: Int!, $offset: Int!) {
      public_marts_leaderboard_summary(
        limit: $limit
        offset: $offset
        order_by: ${orderBy}
      ) {
        account
        total_referrals
        total_rewards_usd
        total_trading_points
        total_trading_volume
      }
      public_marts_leaderboard_summary_aggregate {
        aggregate {
          count
        }
      }
    }
  `

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { limit, offset },
    }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`)
  }

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL query failed')
  }

  return result.data
}
