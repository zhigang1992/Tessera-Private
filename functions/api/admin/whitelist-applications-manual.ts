/**
 * Admin manual-add for a single whitelist application.
 *
 *   POST /api/admin/whitelist-applications-manual
 *   body: { walletAddress, presale1Selected?, adminNote? }
 *
 * Upserts with qualified_via='admin_manual'. Eligibility snapshot fields are
 * fetched best-effort. Never flips presale_1_selected from 1 → 0 via this
 * endpoint; use the row-level toggle for that.
 */

import type { PagesFunction } from '@cloudflare/workers-types'
import { parseWalletAddress } from '../../lib/wallet-link'
import {
  type AdminWhitelistEnv,
  authorizeAdmin,
  fetchEligibilitySnapshot,
  upsertAdminApplication,
} from '../../lib/admin-whitelist'

type ManualBody = {
  walletAddress?: string
  presale1Selected?: boolean
  adminNote?: string | null
}

export const onRequestPost: PagesFunction<AdminWhitelistEnv> = async ({ request, env }) => {
  const unauthorized = authorizeAdmin(request, env)
  if (unauthorized) return unauthorized

  let body: ManualBody
  try {
    body = (await request.json()) as ManualBody
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

  const snapshot = await fetchEligibilitySnapshot(env, walletAddress)
  const result = await upsertAdminApplication(env, {
    walletAddress,
    qualifiedVia: 'admin_manual',
    markSelected: body.presale1Selected === true,
    adminNote: body.adminNote === undefined ? undefined : body.adminNote,
    snapshot,
  })

  return Response.json(
    { walletAddress, ...result },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
