/**
 * Admin API for whitelist applications.
 *
 * Auth model mirrors /api/admin/mock-trading-volumes: `ADMIN_MOCK_SECRET`
 * compared constant-time against the `x-admin-secret` header, with the secret
 * carried in a URL hash fragment on the client so it never hits server logs.
 *
 * Endpoints:
 *   GET    /api/admin/whitelist-applications             → list + counts
 *   POST   /api/admin/whitelist-applications             → toggle selection / note
 *   DELETE /api/admin/whitelist-applications?wallet=…    → remove one row
 */

import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import { parseWalletAddress } from '../../lib/wallet-link'

type Env = {
  DB: D1Database
  ADMIN_MOCK_SECRET?: string
}

type ApplicationRow = {
  wallet_address: string
  qualified_via: string
  trading_volume_usd: number | null
  snapshot_volume_usd: number | null
  solana_mobile_eligible: number | null
  twitter_handle: string | null
  twitter_connected: number
  social_post_found: number
  social_post_tweet_url: string | null
  presale_1_selected: number
  admin_note: string | null
  qualified_at: string
  selected_at: string | null
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
    qualifiedVia: row.qualified_via,
    tradingVolumeUsd: row.trading_volume_usd,
    snapshotVolumeUsd: row.snapshot_volume_usd,
    solanaMobileEligible:
      row.solana_mobile_eligible == null ? null : row.solana_mobile_eligible === 1,
    twitterHandle: row.twitter_handle,
    twitterConnected: row.twitter_connected === 1,
    socialPostFound: row.social_post_found === 1,
    socialPostTweetUrl: row.social_post_tweet_url,
    presale1Selected: row.presale_1_selected === 1,
    adminNote: row.admin_note,
    qualifiedAt: row.qualified_at,
    selectedAt: row.selected_at,
  }
}

const NO_STORE: HeadersInit = { 'Cache-Control': 'no-store' }

const SELECT_COLUMNS = `
  wallet_address, qualified_via, trading_volume_usd, snapshot_volume_usd,
  solana_mobile_eligible, twitter_handle, twitter_connected,
  social_post_found, social_post_tweet_url, presale_1_selected,
  admin_note, qualified_at, selected_at
`

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = authorize(request, env)
  if (unauthorized) return unauthorized

  const { results } = await env.DB
    .prepare(
      `SELECT ${SELECT_COLUMNS}
         FROM presale_whitelist_applications
        ORDER BY presale_1_selected DESC, qualified_at DESC`,
    )
    .all<ApplicationRow>()

  const rows = (results ?? []).map(serialize)
  const presale1SelectedCount = rows.reduce((n, r) => n + (r.presale1Selected ? 1 : 0), 0)

  return Response.json(
    { rows, totalCount: rows.length, presale1SelectedCount },
    { headers: NO_STORE },
  )
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = authorize(request, env)
  if (unauthorized) return unauthorized

  let body: {
    walletAddress?: string
    presale1Selected?: boolean
    adminNote?: string | null
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

  const existing = await env.DB
    .prepare(`SELECT presale_1_selected FROM presale_whitelist_applications WHERE wallet_address = ?`)
    .bind(walletAddress)
    .first<{ presale_1_selected: number }>()

  if (!existing) {
    return Response.json({ error: 'Application not found' }, { status: 404 })
  }

  const setFragments: string[] = []
  const binds: unknown[] = []

  if (typeof body.presale1Selected === 'boolean') {
    const next = body.presale1Selected ? 1 : 0
    const prev = existing.presale_1_selected
    setFragments.push(`presale_1_selected = ?`)
    binds.push(next)
    if (next === 1 && prev === 0) {
      setFragments.push(`selected_at = datetime('now')`)
    } else if (next === 0 && prev === 1) {
      setFragments.push(`selected_at = NULL`)
    }
  }

  if (body.adminNote !== undefined) {
    const note = typeof body.adminNote === 'string' && body.adminNote.trim()
      ? body.adminNote.trim()
      : null
    setFragments.push(`admin_note = ?`)
    binds.push(note)
  }

  if (setFragments.length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 })
  }

  binds.push(walletAddress)
  await env.DB
    .prepare(
      `UPDATE presale_whitelist_applications SET ${setFragments.join(', ')} WHERE wallet_address = ?`,
    )
    .bind(...binds)
    .run()

  const updated = await env.DB
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM presale_whitelist_applications WHERE wallet_address = ?`,
    )
    .bind(walletAddress)
    .first<ApplicationRow>()

  return Response.json(serialize(updated!), { headers: NO_STORE })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = authorize(request, env)
  if (unauthorized) return unauthorized

  const url = new URL(request.url)
  const walletParam = url.searchParams.get('wallet')

  let walletAddress: string
  try {
    walletAddress = parseWalletAddress(walletParam).address
  } catch (err) {
    return Response.json(
      { error: 'Invalid wallet address', detail: (err as Error).message },
      { status: 400 },
    )
  }

  const result = await env.DB
    .prepare('DELETE FROM presale_whitelist_applications WHERE wallet_address = ?')
    .bind(walletAddress)
    .run()

  return Response.json(
    { ok: true, deleted: result.meta.changes ?? 0 },
    { headers: NO_STORE },
  )
}
