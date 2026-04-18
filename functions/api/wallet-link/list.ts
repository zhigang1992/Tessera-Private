import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import { parseWalletAddress } from '../../lib/wallet-link'

type Env = {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const parentParam = new URL(request.url).searchParams.get('parent')

  let parent: string
  try {
    parent = parseWalletAddress(parentParam).address
  } catch (err) {
    return Response.json(
      { error: 'Invalid parent wallet', detail: (err as Error).message },
      { status: 400 },
    )
  }

  const { results } = await env.DB
    .prepare('SELECT child_wallet, created_at FROM wallet_links WHERE parent_wallet = ? ORDER BY created_at DESC')
    .bind(parent)
    .all<{ child_wallet: string; created_at: string }>()

  return Response.json(
    {
      parentWallet: parent,
      children: (results ?? []).map((row) => ({
        wallet: row.child_wallet,
        linkedAt: row.created_at,
      })),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
