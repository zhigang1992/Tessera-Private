/**
 * Admin CSV bulk-import for whitelist applications.
 *
 *   POST /api/admin/whitelist-applications-bulk
 *   body: { markSelected: boolean, walletAddresses: string[] }
 *
 * For each wallet we:
 *   1. Validate the address format.
 *   2. Best-effort fetch eligibility snapshot fields on the fly.
 *   3. Upsert with qualified_via='admin_csv' via upsertAdminApplication.
 *
 * Size-capped at BULK_MAX wallets per request — per-wallet work hits three
 * external services (Hasura, Solana RPC, D1) so larger batches risk the
 * Worker CPU/wall-time budget. Larger uploads should be split client-side.
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import { parseWalletAddress } from '../../lib/wallet-link'
import {
  type AdminWhitelistEnv,
  authorizeAdmin,
  fetchEligibilitySnapshot,
  upsertAdminApplication,
} from '../../lib/admin-whitelist'

const BULK_MAX = 100
const CONCURRENCY = 5

type BulkBody = { markSelected?: boolean; walletAddresses?: unknown }

type SkipReason = 'invalid_address' | 'duplicate_in_batch' | 'upsert_failed'

export const onRequestPost: PagesFunction<AdminWhitelistEnv> = async ({ request, env }) => {
  const unauthorized = authorizeAdmin(request, env)
  if (unauthorized) return unauthorized

  let body: BulkBody
  try {
    body = (await request.json()) as BulkBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const markSelected = body.markSelected === true
  const raw = Array.isArray(body.walletAddresses) ? body.walletAddresses : null
  if (!raw) {
    return Response.json({ error: 'walletAddresses must be an array' }, { status: 400 })
  }
  if (raw.length === 0) {
    return Response.json({ error: 'walletAddresses is empty' }, { status: 400 })
  }
  if (raw.length > BULK_MAX) {
    return Response.json(
      { error: `Too many addresses — max ${BULK_MAX} per upload`, limit: BULK_MAX, received: raw.length },
      { status: 413 },
    )
  }

  const skipped: { walletAddress: string; reason: SkipReason; detail?: string }[] = []
  const normalized: string[] = []
  const seen = new Set<string>()
  for (const entry of raw) {
    const str = typeof entry === 'string' ? entry.trim() : ''
    if (!str) {
      skipped.push({ walletAddress: String(entry ?? ''), reason: 'invalid_address', detail: 'empty' })
      continue
    }
    let parsed: string
    try {
      parsed = parseWalletAddress(str).address
    } catch (err) {
      skipped.push({
        walletAddress: str,
        reason: 'invalid_address',
        detail: (err as Error).message,
      })
      continue
    }
    if (seen.has(parsed)) {
      skipped.push({ walletAddress: parsed, reason: 'duplicate_in_batch' })
      continue
    }
    seen.add(parsed)
    normalized.push(parsed)
  }

  let inserted = 0
  let updated = 0

  for (let i = 0; i < normalized.length; i += CONCURRENCY) {
    const batch = normalized.slice(i, i + CONCURRENCY)
    await Promise.all(
      batch.map(async (walletAddress) => {
        try {
          const snapshot = await fetchEligibilitySnapshot(env, walletAddress)
          const result = await upsertAdminApplication(env, {
            walletAddress,
            qualifiedVia: 'admin_csv',
            markSelected,
            snapshot,
          })
          if (result.inserted) inserted++
          else if (result.updated) updated++
        } catch (err) {
          console.error('bulk upsert failed', walletAddress, err)
          skipped.push({
            walletAddress,
            reason: 'upsert_failed',
            detail: (err as Error).message,
          })
        }
      }),
    )
  }

  return Response.json(
    { inserted, updated, skipped },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
