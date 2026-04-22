/**
 * Pre-Sale 1 whitelist application API.
 *
 *   GET  /api/whitelist/applications?wallet=…&tokenId=…
 *        Public status lookup. Returns the stored row or { status: 'not-applied' }.
 *
 *   POST /api/whitelist/applications    body: { tokenId }
 *        Session-authenticated. Re-runs the three eligibility checks via
 *        functions/lib/eligibility (the same helpers the public eligibility
 *        endpoints use), and — if all pass — inserts a pending row. Existing
 *        rows are returned unchanged.
 */

import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types'

import { authenticateRequest } from '../../lib/middleware'
import { parseWalletAddress } from '../../lib/wallet-link'
import {
  checkSocialPost,
  computeTradingVolume,
  lookupTwitterHandle,
} from '../../lib/eligibility'

type Env = {
  DB: D1Database
  SESSION_KV: KVNamespace
  TWITTERAPI_IO_KEY?: string
  APP_ENV?: string
}

const VOLUME_THRESHOLD_USD = 5000

type ApplicationRow = {
  wallet_address: string
  token_id: string
  status: string
  trading_volume_usd: number | null
  twitter_handle: string | null
  twitter_connected: number
  social_post_found: number
  social_post_tweet_url: string | null
  admin_note: string | null
  applied_at: string
  reviewed_at: string | null
}

function serialize(row: ApplicationRow) {
  return {
    walletAddress: row.wallet_address,
    tokenId: row.token_id,
    status: row.status as 'pending' | 'approved' | 'rejected',
    tradingVolumeUsd: row.trading_volume_usd,
    twitterHandle: row.twitter_handle,
    twitterConnected: row.twitter_connected === 1,
    socialPostFound: row.social_post_found === 1,
    socialPostTweetUrl: row.social_post_tweet_url,
    adminNote: row.admin_note,
    appliedAt: row.applied_at,
    reviewedAt: row.reviewed_at,
  }
}

const NO_STORE: HeadersInit = { 'Cache-Control': 'no-store' }

async function loadApplication(
  env: Env,
  walletAddress: string,
  tokenId: string,
): Promise<ApplicationRow | null> {
  return await env.DB
    .prepare(
      `SELECT wallet_address, token_id, status, trading_volume_usd, twitter_handle,
              twitter_connected, social_post_found, social_post_tweet_url,
              admin_note, applied_at, reviewed_at
         FROM presale_whitelist_applications
        WHERE wallet_address = ? AND token_id = ?`,
    )
    .bind(walletAddress, tokenId)
    .first<ApplicationRow>()
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const walletParam = url.searchParams.get('wallet')
  const tokenId = url.searchParams.get('tokenId')

  let wallet: string
  try {
    wallet = parseWalletAddress(walletParam).address
  } catch (err) {
    return Response.json(
      { error: 'Invalid wallet address', detail: (err as Error).message },
      { status: 400 },
    )
  }
  if (!tokenId) {
    return Response.json({ error: 'tokenId is required' }, { status: 400 })
  }

  const row = await loadApplication(env, wallet, tokenId)
  if (!row) {
    return Response.json(
      { status: 'not-applied', walletAddress: wallet, tokenId },
      { headers: NO_STORE },
    )
  }
  return Response.json(serialize(row), { headers: NO_STORE })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await authenticateRequest(request, env)
  if (!auth.authenticated) return auth.error

  const walletAddress = auth.context.walletAddress

  let body: { tokenId?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const tokenId = body.tokenId?.trim()
  if (!tokenId) {
    return Response.json({ error: 'tokenId is required' }, { status: 400 })
  }

  // Idempotent: if a row already exists, return it unchanged. Re-applying
  // should not overwrite an admin's decision.
  const existing = await loadApplication(env, walletAddress, tokenId)
  if (existing) {
    return Response.json(serialize(existing), { headers: NO_STORE })
  }

  // Re-run the same three checks the eligibility UI runs, server-side.
  const volumeResult = await computeTradingVolume(env, walletAddress)
  if (volumeResult.kind === 'error') {
    return Response.json(
      { error: 'eligibility_check_failed', detail: 'Failed to compute trading volume' },
      { status: 502 },
    )
  }
  if (volumeResult.linkedAsChild) {
    return Response.json(
      { error: 'not_eligible', detail: 'Wallet is linked as a child — apply from the parent wallet.' },
      { status: 403 },
    )
  }
  if (volumeResult.volumeUsd < VOLUME_THRESHOLD_USD) {
    return Response.json(
      { error: 'not_eligible', detail: 'Trading volume is below the required threshold.' },
      { status: 403 },
    )
  }

  const twitterHandle = await lookupTwitterHandle(env, walletAddress)
  if (!twitterHandle) {
    return Response.json(
      { error: 'not_eligible', detail: 'Connect your X account first.' },
      { status: 403 },
    )
  }

  const postResult = await checkSocialPost(env, walletAddress, tokenId)
  if (postResult.kind === 'rate_limited') {
    return Response.json(
      { error: 'rate_limited', retryAfterSeconds: postResult.retryAfterSeconds },
      { status: 429 },
    )
  }
  if (postResult.kind !== 'ok') {
    return Response.json(
      { error: 'not_eligible', detail: 'Could not verify social card post.' },
      { status: 403 },
    )
  }
  if (!postResult.record.found) {
    return Response.json(
      { error: 'not_eligible', detail: 'Post the social card from your X account first.' },
      { status: 403 },
    )
  }

  await env.DB
    .prepare(
      `INSERT INTO presale_whitelist_applications
         (wallet_address, token_id, status, trading_volume_usd, twitter_handle,
          twitter_connected, social_post_found, social_post_tweet_url)
       VALUES (?1, ?2, 'pending', ?3, ?4, 1, 1, ?5)
       ON CONFLICT(wallet_address, token_id) DO NOTHING`,
    )
    .bind(
      walletAddress,
      tokenId,
      volumeResult.volumeUsd,
      twitterHandle,
      postResult.record.tweetUrl,
    )
    .run()

  const row = await loadApplication(env, walletAddress, tokenId)
  if (!row) {
    return Response.json({ error: 'insert_failed' }, { status: 500 })
  }
  return Response.json(serialize(row), { headers: NO_STORE, status: 201 })
}
