import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import { computeTradingVolume } from '../../lib/eligibility'
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

  const result = await computeTradingVolume(env, parent)

  if (result.kind === 'error') {
    if (result.reason === 'wallet_link_check_failed') {
      return Response.json({ error: 'Failed to verify wallet link status' }, { status: 500 })
    }
    return Response.json(
      { error: 'Failed to fetch trading volume', detail: result.detail },
      { status: 502 },
    )
  }

  if (result.linkedAsChild) {
    return Response.json(
      {
        volumeUsd: 0,
        wallets: result.wallets,
        linkedWalletCount: 0,
        linkedAsChild: true,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return Response.json(
    {
      volumeUsd: result.volumeUsd,
      wallets: result.wallets,
      linkedWalletCount: result.linkedWalletCount,
      mockedWalletCount: result.mockedWalletCount,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
