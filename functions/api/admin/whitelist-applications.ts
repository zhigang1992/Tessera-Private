/**
 * Admin API for Pre-Sale 1 whitelist applications.
 *
 * Auth model mirrors /api/admin/mock-trading-volumes: `ADMIN_MOCK_SECRET`
 * compared constant-time against the `x-admin-secret` header, with the secret
 * carried in a URL hash fragment on the client so it never hits server logs or
 * the Referer header.
 *
 * Endpoints:
 *   GET    /api/admin/whitelist-applications                    → list all rows
 *   POST   /api/admin/whitelist-applications                    → set status
 *   DELETE /api/admin/whitelist-applications?wallet=…&tokenId=… → remove one row
 */

import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import { parseWalletAddress } from '../../lib/wallet-link'

type Env = {
  DB: D1Database
  ADMIN_MOCK_SECRET?: string
}

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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

function authorize(request: Request, env: Env): Response | null {
  const expected = env.ADMIN_MOCK_SECRET
  if (!expected) {
    return Response.json(
      { error: 'ADMIN_MOCK_SECRET is not configured on the server' },
      { status: 503 },
    )
  }
  const provided = request.headers.get('x-admin-secret') ?? ''
  if (!provided || !timingSafeEqual(provided, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
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

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = authorize(request, env)
  if (unauthorized) return unauthorized

  const { results } = await env.DB
    .prepare(
      `SELECT wallet_address, token_id, status, trading_volume_usd, twitter_handle,
              twitter_connected, social_post_found, social_post_tweet_url,
              admin_note, applied_at, reviewed_at
         FROM presale_whitelist_applications
        ORDER BY applied_at DESC`,
    )
    .all<ApplicationRow>()

  return Response.json(
    { rows: (results ?? []).map(serialize) },
    { headers: NO_STORE },
  )
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = authorize(request, env)
  if (unauthorized) return unauthorized

  let body: {
    walletAddress?: string
    tokenId?: string
    status?: string
    note?: string | null
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let walletAddress: string
  try {
    walletAddress = parseWalletAddress(body.walletAddress).address
  } catch (err) {
    return Response.json(
      { error: 'Invalid wallet address', detail: (err as Error).message },
      { status: 400 },
    )
  }

  const tokenId = body.tokenId?.trim()
  if (!tokenId) {
    return Response.json({ error: 'tokenId is required' }, { status: 400 })
  }

  const status = body.status
  if (status !== 'pending' && status !== 'approved' && status !== 'rejected') {
    return Response.json(
      { error: 'status must be one of: pending, approved, rejected' },
      { status: 400 },
    )
  }

  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null
  const reviewedAt = status === 'pending' ? null : new Date().toISOString().replace('T', ' ').slice(0, 19)

  const result = await env.DB
    .prepare(
      `UPDATE presale_whitelist_applications
          SET status = ?1, admin_note = ?2, reviewed_at = ?3
        WHERE wallet_address = ?4 AND token_id = ?5`,
    )
    .bind(status, note, reviewedAt, walletAddress, tokenId)
    .run()

  if ((result.meta.changes ?? 0) === 0) {
    return Response.json({ error: 'Application not found' }, { status: 404 })
  }

  const updated = await env.DB
    .prepare(
      `SELECT wallet_address, token_id, status, trading_volume_usd, twitter_handle,
              twitter_connected, social_post_found, social_post_tweet_url,
              admin_note, applied_at, reviewed_at
         FROM presale_whitelist_applications
        WHERE wallet_address = ? AND token_id = ?`,
    )
    .bind(walletAddress, tokenId)
    .first<ApplicationRow>()

  return Response.json(serialize(updated!), { headers: NO_STORE })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = authorize(request, env)
  if (unauthorized) return unauthorized

  const url = new URL(request.url)
  const walletParam = url.searchParams.get('wallet')
  const tokenId = url.searchParams.get('tokenId')

  let walletAddress: string
  try {
    walletAddress = parseWalletAddress(walletParam).address
  } catch (err) {
    return Response.json(
      { error: 'Invalid wallet address', detail: (err as Error).message },
      { status: 400 },
    )
  }
  if (!tokenId) {
    return Response.json({ error: 'tokenId is required' }, { status: 400 })
  }

  const result = await env.DB
    .prepare('DELETE FROM presale_whitelist_applications WHERE wallet_address = ? AND token_id = ?')
    .bind(walletAddress, tokenId)
    .run()

  return Response.json(
    { ok: true, deleted: result.meta.changes ?? 0 },
    { headers: NO_STORE },
  )
}
