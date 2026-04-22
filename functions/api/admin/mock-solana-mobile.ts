/**
 * Admin API for seeding mock Solana Mobile eligibility used by the Pre-Sale 2
 * eligibility check. Same auth model as mock-trading-volumes: ADMIN_MOCK_SECRET
 * compared constant-time against `x-admin-secret` header.
 *
 * Endpoints:
 *   GET    /api/admin/mock-solana-mobile           → list all rows
 *   POST   /api/admin/mock-solana-mobile           → upsert { walletAddress, eligible, note? }
 *   DELETE /api/admin/mock-solana-mobile?wallet=…  → delete one row
 *
 * The underlying table is read ONLY by functions/api/eligibility/solana-mobile.ts.
 */

import type { D1Database, PagesFunction } from '@cloudflare/workers-types'
import { parseWalletAddress } from '../../lib/wallet-link'

type Env = {
  DB: D1Database
  ADMIN_MOCK_SECRET?: string
}

type MockRow = {
  wallet_address: string
  eligible: number
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
      'SELECT wallet_address, eligible, note, created_at FROM mock_solana_mobile ORDER BY created_at DESC',
    )
    .all<MockRow>()

  return Response.json(
    {
      rows: (results ?? []).map((r) => ({
        walletAddress: r.wallet_address,
        eligible: r.eligible === 1,
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

  let body: { walletAddress?: string; eligible?: boolean; note?: string | null }
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

  const eligible = body.eligible === false ? 0 : 1
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null

  await env.DB
    .prepare(
      `INSERT INTO mock_solana_mobile (wallet_address, eligible, note)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(wallet_address) DO UPDATE SET
         eligible = excluded.eligible,
         note = excluded.note,
         created_at = datetime('now')`,
    )
    .bind(walletAddress, eligible, note)
    .run()

  return Response.json(
    { ok: true, walletAddress, eligible: eligible === 1, note },
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
    .prepare('DELETE FROM mock_solana_mobile WHERE wallet_address = ?')
    .bind(walletAddress)
    .run()

  return Response.json(
    { ok: true, walletAddress, deleted: result.meta.changes ?? 0 },
    { headers: NO_STORE },
  )
}
