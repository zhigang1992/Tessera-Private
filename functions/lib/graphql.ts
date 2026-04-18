/**
 * Server-side GraphQL helper for Pages Functions.
 *
 * The Hasura endpoint is public (no auth required) — matches the browser
 * client in src/features/referral/lib/graphql-client.ts. Endpoint selection
 * mirrors src/config.ts so we stay consistent between browser and functions.
 */

const GRAPHQL_ENDPOINTS = {
  devnet: 'https://tracker-gql-dev.tessera.fun/v1/graphql',
  mainnet: 'https://tracker-gql.tessera.fun/v1/graphql',
} as const

export type AppEnv = 'development' | 'production'

export function resolveGraphQLEndpoint(env: { APP_ENV?: string }): string {
  const appEnv = (env.APP_ENV ?? 'development').toLowerCase()
  return appEnv === 'production' ? GRAPHQL_ENDPOINTS.mainnet : GRAPHQL_ENDPOINTS.devnet
}

export async function graphqlRequest<T>(
  endpoint: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`)
  }

  const payload = (await res.json()) as { data?: T; errors?: Array<{ message: string }> }

  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors[0]?.message ?? 'GraphQL query failed')
  }
  if (!payload.data) {
    throw new Error('GraphQL response missing data')
  }

  return payload.data
}
