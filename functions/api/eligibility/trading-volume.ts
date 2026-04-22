import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import { graphqlRequest, resolveGraphQLEndpoint } from '../../lib/graphql'
import { parseWalletAddress } from '../../lib/wallet-link'
import {
  BigNumber,
  fromHasuraToNative,
  type BigNumberSource,
} from '../../../src/lib/bignumber'

type Env = {
  DB: D1Database
  APP_ENV?: string
}

type VolumeAggregateResponse = {
  public_marts_total_trading_volume_by_account_aggregate: {
    aggregate: {
      sum: {
        total_volume: BigNumberSource | null
      }
    }
  }
}

const VOLUME_QUERY = `
  query GetTradingVolume($accounts: [String!]!) {
    public_marts_total_trading_volume_by_account_aggregate(
      where: { account: { _in: $accounts } }
    ) {
      aggregate {
        sum {
          total_volume
        }
      }
    }
  }
`

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

  // If this wallet is already linked as a child, its volume rolls up to its
  // parent — returning it here would double-count and let the child claim
  // eligibility on the same swaps.
  try {
    const linkedAs = await env.DB
      .prepare('SELECT parent_wallet FROM wallet_links WHERE child_wallet = ?')
      .bind(parent)
      .first<{ parent_wallet: string }>()
    if (linkedAs) {
      return Response.json(
        {
          volumeUsd: 0,
          wallets: [parent],
          linkedWalletCount: 0,
          linkedAsChild: true,
        },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }
  } catch (err) {
    console.error('Failed to check wallet_links child status', err)
    // Fail closed on the security check — better to 5xx than to leak volume.
    return Response.json(
      { error: 'Failed to verify wallet link status' },
      { status: 500 },
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

  // Per-wallet mock override. For any sender present in mock_trading_volumes,
  // use the mocked value in place of what Hasura would return for that wallet.
  // The parent→child aggregation is otherwise unchanged.
  const mockMap = new Map<string, number>()
  try {
    const placeholders = senders.map(() => '?').join(',')
    const { results } = await env.DB
      .prepare(
        `SELECT wallet_address, volume_usd FROM mock_trading_volumes WHERE wallet_address IN (${placeholders})`,
      )
      .bind(...senders)
      .all<{ wallet_address: string; volume_usd: number }>()
    for (const row of results ?? []) {
      mockMap.set(row.wallet_address, row.volume_usd)
    }
  } catch (err) {
    console.error('Failed to read mock_trading_volumes', err)
    // Fall through: ignore mocks and ask Hasura for everything.
  }

  const hasuraSenders = senders.filter((w) => !mockMap.has(w))

  let hasuraVolume = 0
  if (hasuraSenders.length > 0) {
    try {
      const endpoint = resolveGraphQLEndpoint(env)
      const data = await graphqlRequest<VolumeAggregateResponse>(endpoint, VOLUME_QUERY, {
        accounts: hasuraSenders,
      })
      const rawSum =
        data.public_marts_total_trading_volume_by_account_aggregate.aggregate.sum.total_volume
      hasuraVolume = rawSum == null ? 0 : BigNumber.toNumber(fromHasuraToNative(rawSum))
    } catch (err) {
      console.error('Failed to fetch trading volume from GraphQL', err)
      return Response.json(
        { error: 'Failed to fetch trading volume', detail: (err as Error).message },
        { status: 502 },
      )
    }
  }

  const mockVolume = Array.from(mockMap.values()).reduce((sum, v) => sum + v, 0)
  const volumeUsd = mockVolume + hasuraVolume

  return Response.json(
    {
      volumeUsd,
      wallets: senders,
      linkedWalletCount: children.length,
      mockedWalletCount: mockMap.size,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
