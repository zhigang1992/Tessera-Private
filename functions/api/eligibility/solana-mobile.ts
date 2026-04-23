import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import { computeSolanaMobileEligible } from '../../lib/eligibility'
import { parseWalletAddress } from '../../lib/wallet-link'

type Env = {
  DB: D1Database
  SOLANA_MAINNET_RPC_URL?: string
  HELIUS_API_KEY?: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const walletParam = new URL(request.url).searchParams.get('wallet')

  let wallet: string
  try {
    wallet = parseWalletAddress(walletParam).address
  } catch (err) {
    return Response.json(
      { error: 'Invalid wallet address', detail: (err as Error).message },
      { status: 400 },
    )
  }

  const result = await computeSolanaMobileEligible(env, wallet)
  return Response.json(
    {
      status: result.eligible ? 'met' : 'unmet',
      source: result.source,
      details: result.details,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
