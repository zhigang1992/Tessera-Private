import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import { parseWalletAddress } from '../../lib/wallet-link'

type Env = {
  DB: D1Database
  APP_ENV?: string
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

  // Mirror the child-wallet guard from trading-volume: a child's snapshot
  // volume rolls up to its parent, so returning it here would double-count.
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
    return Response.json(
      { error: 'Failed to verify wallet link status' },
      { status: 500 },
    )
  }

  let children: string[] = []
  try {
    const { results } = await env.DB
      .prepare('SELECT child_wallet FROM wallet_links WHERE parent_wallet = ?')
      .bind(parent)
      .all<{ child_wallet: string }>()
    children = (results ?? []).map((row) => row.child_wallet)
  } catch (err) {
    console.error('Failed to read wallet_links', err)
  }

  const senders = [parent, ...children]

  const mockMap = new Map<string, number>()
  try {
    const placeholders = senders.map(() => '?').join(',')
    const { results } = await env.DB
      .prepare(
        `SELECT wallet_address, snapshot_volume_usd
         FROM mock_trading_volumes
         WHERE wallet_address IN (${placeholders})
           AND snapshot_volume_usd IS NOT NULL`,
      )
      .bind(...senders)
      .all<{ wallet_address: string; snapshot_volume_usd: number }>()
    for (const row of results ?? []) {
      mockMap.set(row.wallet_address, row.snapshot_volume_usd)
    }
  } catch (err) {
    console.error('Failed to read mock snapshot volumes', err)
  }

  // TODO: replace with a real Hasura snapshot aggregation once the indexer
  // exposes a pre-event volume view. For now, any wallet without a mock row
  // contributes 0.
  const realVolume = 0

  const mockVolume = Array.from(mockMap.values()).reduce((sum, v) => sum + v, 0)
  const volumeUsd = mockVolume + realVolume

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
