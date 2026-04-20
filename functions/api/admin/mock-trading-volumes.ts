/**
 * Admin API for seeding mock trading volumes used by the eligibility check.
 *
 * Auth: `ADMIN_MOCK_SECRET` env var, compared constant-time against the
 * `x-admin-secret` request header. The frontend carries the secret in a URL
 * hash fragment (never sent over the wire) and attaches this header on each
 * request, so the secret never reaches server logs, CDN caches, or the
 * Referer header.
 *
 * Endpoints:
 *   GET    /api/admin/mock-trading-volumes           → list all rows
 *   POST   /api/admin/mock-trading-volumes           → upsert { walletAddress, volumeUsd, note? }
 *   DELETE /api/admin/mock-trading-volumes?wallet=…  → delete one row
 *
 * The underlying table is read ONLY by functions/api/eligibility/trading-volume.ts.
 */

import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import { parseWalletAddress } from '../../lib/wallet-link'

type Env = {
  DB: D1Database
  ADMIN_MOCK_SECRET?: string
}

type MockRow = {
  wallet_address: string
  volume_usd: number
  note: string | null
  created_at: string
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

const NO_STORE: HeadersInit = { 'Cache-Control': 'no-store' }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = authorize(request, env)
  if (unauthorized) return unauthorized

  const { results } = await env.DB
    .prepare(
      'SELECT wallet_address, volume_usd, note, created_at FROM mock_trading_volumes ORDER BY created_at DESC',
    )
    .all<MockRow>()

  return Response.json(
    {
      rows: (results ?? []).map((r) => ({
        walletAddress: r.wallet_address,
        volumeUsd: r.volume_usd,
        note: r.note,
        createdAt: r.created_at,
      })),
    },
    { headers: NO_STORE },
  )
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = authorize(request, env)
  if (unauthorized) return unauthorized

  let body: { walletAddress?: string; volumeUsd?: number; note?: string | null }
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

  const volumeUsd = Number(body.volumeUsd)
  if (!Number.isFinite(volumeUsd) || volumeUsd < 0) {
    return Response.json(
      { error: 'volumeUsd must be a non-negative finite number' },
      { status: 400 },
    )
  }

  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null

  await env.DB
    .prepare(
      `INSERT INTO mock_trading_volumes (wallet_address, volume_usd, note)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(wallet_address) DO UPDATE SET
         volume_usd = excluded.volume_usd,
         note = excluded.note,
         created_at = datetime('now')`,
    )
    .bind(walletAddress, volumeUsd, note)
    .run()

  return Response.json(
    { ok: true, walletAddress, volumeUsd, note },
    { headers: NO_STORE },
  )
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = authorize(request, env)
  if (unauthorized) return unauthorized

  const walletParam = new URL(request.url).searchParams.get('wallet')
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
    .prepare('DELETE FROM mock_trading_volumes WHERE wallet_address = ?')
    .bind(walletAddress)
    .run()

  return Response.json(
    { ok: true, walletAddress, deleted: result.meta.changes ?? 0 },
    { headers: NO_STORE },
  )
}
