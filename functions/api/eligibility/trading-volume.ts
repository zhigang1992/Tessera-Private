import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import { graphqlRequest, resolveGraphQLEndpoint } from '../../lib/graphql'
import { parseWalletAddress } from '../../lib/wallet-link'

type Env = {
  DB: D1Database
  APP_ENV?: string
}

type VolumeAggregateResponse = {
  facts_meteora_token_swap_events_aggregate: {
    aggregate: {
      sum: {
        amount_y: string | null
      }
    }
  }
}

const VOLUME_QUERY = `
  query GetTradingVolume($senders: [String!]!) {
    facts_meteora_token_swap_events_aggregate(where: { sender: { _in: $senders } }) {
      aggregate {
        sum {
          amount_y
        }
      }
    }
  }
`

// Hasura returns numeric(38, 18) as a decimal string. Convert to a plain USD
// number with 2dp precision using BigInt to avoid decimal.js on the server.
function hasura18ToUsd(raw: string | null): number {
  if (!raw) return 0
  // Input can be like "1500000000000000000000" or "1500.000000000000000000"; both are valid Hasura serialisations.
  // Normalise by stripping any fractional ".xxx" tail (Hasura occasionally emits it) — we already know the scale is 18.
  const cleaned = raw.split('.')[0]
  let asBigInt: bigint
  try {
    asBigInt = BigInt(cleaned)
  } catch {
    return 0
  }
  // Divide by 10^16 to get cents, then to USD with 2dp.
  const cents = asBigInt / 10n ** 16n
  return Number(cents) / 100
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const walletParam = new URL(request.url).searchParams.get('wallet')

  let parent: string
  try {
    parent = parseWalletAddress(walletParam).address
  } catch (err) {
    return Response.json(
      { error: 'Invalid wallet address', detail: (err as Error).message },
      { status: 400 },
    )
  }

  // Pull all child wallets linked to this parent.
  let children: string[] = []
  try {
    const { results } = await env.DB
      .prepare('SELECT child_wallet FROM wallet_links WHERE parent_wallet = ?')
      .bind(parent)
      .all<{ child_wallet: string }>()
    children = (results ?? []).map((row) => row.child_wallet)
  } catch (err) {
    console.error('Failed to read wallet_links', err)
    // Don't fail the whole check — fall through with just the parent.
  }

  const senders = [parent, ...children]

  let volumeUsd = 0
  try {
    const endpoint = resolveGraphQLEndpoint(env)
    const data = await graphqlRequest<VolumeAggregateResponse>(endpoint, VOLUME_QUERY, { senders })
    volumeUsd = hasura18ToUsd(data.facts_meteora_token_swap_events_aggregate.aggregate.sum.amount_y)
  } catch (err) {
    console.error('Failed to fetch trading volume from GraphQL', err)
    return Response.json(
      { error: 'Failed to fetch trading volume', detail: (err as Error).message },
      { status: 502 },
    )
  }

  return Response.json(
    {
      volumeUsd,
      wallets: senders,
      linkedWalletCount: children.length,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
