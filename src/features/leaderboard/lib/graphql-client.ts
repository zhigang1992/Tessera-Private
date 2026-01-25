import type { LeaderboardQueryResult } from '../types'

const GRAPHQL_ENDPOINT = 'https://tracker-gql-dev.tessera.fun/v1/graphql'

export async function fetchLeaderboard(
  limit: number = 10,
  offset: number = 0
): Promise<LeaderboardQueryResult> {
  const query = `
    query GetLeaderboard($limit: Int!, $offset: Int!) {
      view_owner_referral_stats(
        limit: $limit
        offset: $offset
        order_by: { invited_count: desc }
      ) {
        owner
        invited_count
      }
      view_owner_referral_stats_aggregate {
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
