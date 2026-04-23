/**
 * Shared helpers for the admin whitelist-applications endpoints.
 *
 * Both the CSV-bulk and manual-add endpoints need to:
 *   1. Authorize via ADMIN_MOCK_SECRET (same scheme as the main admin endpoint).
 *   2. Best-effort fetch eligibility snapshot fields for a wallet.
 *   3. Upsert into presale_whitelist_applications without clobbering admin state.
 */

import type { D1Database } from '@cloudflare/workers-types'
import {
  computeSnapshotVolume,
  computeSolanaMobileEligible,
  computeTradingVolume,
  lookupTwitterHandle,
} from './eligibility'

export type AdminWhitelistEnv = {
  DB: D1Database
  ADMIN_MOCK_SECRET?: string
  SOLANA_MAINNET_RPC_URL?: string
  HELIUS_API_KEY?: string
  APP_ENV?: string
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export function authorizeAdmin(request: Request, env: AdminWhitelistEnv): Response | null {
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

export type EligibilitySnapshot = {
  tradingVolumeUsd: number | null
  snapshotVolumeUsd: number | null
  solanaMobileEligible: number | null
  twitterHandle: string | null
  twitterConnected: number
}

export async function fetchEligibilitySnapshot(
  env: AdminWhitelistEnv,
  walletAddress: string,
): Promise<EligibilitySnapshot> {
  const [volumeResult, snapshotResult, solanaResult, twitterHandle] = await Promise.all([
    computeTradingVolume(env, walletAddress).catch((err) => {
      console.error('admin: computeTradingVolume failed', err)
      return null
    }),
    computeSnapshotVolume(env, walletAddress).catch((err) => {
      console.error('admin: computeSnapshotVolume failed', err)
      return null
    }),
    computeSolanaMobileEligible(env, walletAddress).catch((err) => {
      console.error('admin: computeSolanaMobileEligible failed', err)
      return null
    }),
    lookupTwitterHandle(env, walletAddress).catch((err) => {
      console.error('admin: lookupTwitterHandle failed', err)
      return null
    }),
  ])

  const tradingVolumeUsd =
    volumeResult?.kind === 'ok' && !volumeResult.linkedAsChild ? volumeResult.volumeUsd : null
  const snapshotVolumeUsd =
    snapshotResult?.kind === 'ok' && !snapshotResult.linkedAsChild
      ? snapshotResult.volumeUsd
      : null
  const solanaMobileEligible = solanaResult == null ? null : solanaResult.eligible ? 1 : 0

  return {
    tradingVolumeUsd,
    snapshotVolumeUsd,
    solanaMobileEligible,
    twitterHandle: twitterHandle ?? null,
    twitterConnected: twitterHandle ? 1 : 0,
  }
}

export type UpsertResult = { inserted: boolean; updated: boolean }

/**
 * Upsert an admin-driven application row.
 *
 * - On insert: writes all provided fields, stamps `selected_at` if selected.
 * - On conflict: never overwrites `qualified_via` (first-pass wins), never
 *   flips `presale_1_selected` from 1 → 0 via admin mass ops (only via the
 *   row-level toggle endpoint). Refreshes snapshot fields.
 */
export async function upsertAdminApplication(
  env: AdminWhitelistEnv,
  input: {
    walletAddress: string
    qualifiedVia: 'admin_manual' | 'admin_csv'
    markSelected: boolean
    adminNote?: string | null
    snapshot: EligibilitySnapshot
  },
): Promise<UpsertResult> {
  const existing = await env.DB
    .prepare(
      `SELECT presale_1_selected FROM presale_whitelist_applications WHERE wallet_address = ?`,
    )
    .bind(input.walletAddress)
    .first<{ presale_1_selected: number }>()

  const { snapshot } = input
  const noteBind = input.adminNote === undefined ? null : input.adminNote

  if (!existing) {
    const selected = input.markSelected ? 1 : 0
    await env.DB
      .prepare(
        `INSERT INTO presale_whitelist_applications (
           wallet_address, qualified_via, trading_volume_usd, snapshot_volume_usd,
           solana_mobile_eligible, twitter_handle, twitter_connected,
           presale_1_selected, admin_note, selected_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ${selected === 1 ? "datetime('now')" : 'NULL'})`,
      )
      .bind(
        input.walletAddress,
        input.qualifiedVia,
        snapshot.tradingVolumeUsd,
        snapshot.snapshotVolumeUsd,
        snapshot.solanaMobileEligible,
        snapshot.twitterHandle,
        snapshot.twitterConnected,
        selected,
        noteBind,
      )
      .run()
    return { inserted: true, updated: false }
  }

  const setFragments = [
    'trading_volume_usd = ?',
    'snapshot_volume_usd = ?',
    'solana_mobile_eligible = ?',
    'twitter_handle = ?',
    'twitter_connected = ?',
  ]
  const binds: unknown[] = [
    snapshot.tradingVolumeUsd,
    snapshot.snapshotVolumeUsd,
    snapshot.solanaMobileEligible,
    snapshot.twitterHandle,
    snapshot.twitterConnected,
  ]

  // Never flip 1 → 0 via bulk/manual. Only stamp selected_at on 0 → 1.
  if (input.markSelected && existing.presale_1_selected === 0) {
    setFragments.push('presale_1_selected = 1')
    setFragments.push("selected_at = datetime('now')")
  }

  if (input.adminNote !== undefined) {
    setFragments.push('admin_note = ?')
    binds.push(noteBind)
  }

  binds.push(input.walletAddress)
  await env.DB
    .prepare(
      `UPDATE presale_whitelist_applications SET ${setFragments.join(', ')} WHERE wallet_address = ?`,
    )
    .bind(...binds)
    .run()

  return { inserted: false, updated: true }
}
