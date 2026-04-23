/**
 * Unified whitelist application API.
 *
 *   GET  /api/whitelist/applications?wallet=…
 *        Public lookup. Returns the stored row (token-agnostic — one row per
 *        wallet) or `{ qualified: false, presale1Selected: false }` if none.
 *
 *   POST /api/whitelist/applications    body: { tokenId? }
 *        Session-authenticated. Runs all three eligibility options in parallel
 *        and, if ANY passes, upserts the application row. The `tokenId` is
 *        only used to opportunistically update social-card state; it is never
 *        stored on the row (the whitelist is global).
 *
 * Upsert semantics: on conflict, snapshot fields (volume, snapshot volume,
 * solana mobile, twitter) are refreshed, but first-pass `qualified_via` and
 * admin-controlled `presale_1_selected` are never overwritten.
 */

import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types'

import { authenticateRequest } from '../../lib/middleware'
import { parseWalletAddress } from '../../lib/wallet-link'
import {
  checkSocialPost,
  computeSnapshotVolume,
  computeSolanaMobileEligible,
  computeTradingVolume,
  lookupTwitterHandle,
} from '../../lib/eligibility'

type Env = {
  DB: D1Database
  SESSION_KV: KVNamespace
  TWITTERAPI_IO_KEY?: string
  SOLANA_MAINNET_RPC_URL?: string
  HELIUS_API_KEY?: string
  APP_ENV?: string
}

const LIFETIME_VOLUME_THRESHOLD_USD = 5000
const SNAPSHOT_VOLUME_THRESHOLD_USD = 1000

type QualifiedVia =
  | 'snapshot_volume'
  | 'solana_mobile'
  | 'volume_twitter'
  | 'admin_manual'
  | 'admin_csv'

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

function serialize(row: ApplicationRow) {
  return {
    qualified: true,
    walletAddress: row.wallet_address,
    qualifiedVia: row.qualified_via as QualifiedVia,
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

async function loadApplication(
  env: Env,
  walletAddress: string,
): Promise<ApplicationRow | null> {
  return await env.DB
    .prepare(
      `SELECT wallet_address, qualified_via, trading_volume_usd, snapshot_volume_usd,
              solana_mobile_eligible, twitter_handle, twitter_connected,
              social_post_found, social_post_tweet_url, presale_1_selected,
              admin_note, qualified_at, selected_at
         FROM presale_whitelist_applications
        WHERE wallet_address = ?`,
    )
    .bind(walletAddress)
    .first<ApplicationRow>()
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const walletParam = url.searchParams.get('wallet')

  let wallet: string
  try {
    wallet = parseWalletAddress(walletParam).address
  } catch (err) {
    return Response.json(
      { error: 'Invalid wallet address', detail: (err as Error).message },
      { status: 400 },
    )
  }

  const row = await loadApplication(env, wallet)
  if (!row) {
    return Response.json(
      { qualified: false, presale1Selected: false, walletAddress: wallet },
      { headers: NO_STORE },
    )
  }
  return Response.json(serialize(row), { headers: NO_STORE })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await authenticateRequest(request, env)
  if (!auth.authenticated) return auth.error

  const walletAddress = auth.context.walletAddress

  let body: { tokenId?: string } = {}
  try {
    const text = await request.text()
    body = text ? (JSON.parse(text) as typeof body) : {}
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const tokenId = body.tokenId?.trim() || undefined

  const [volumeResult, snapshotResult, solanaResult, twitterHandle] = await Promise.all([
    computeTradingVolume(env, walletAddress),
    computeSnapshotVolume(env, walletAddress),
    computeSolanaMobileEligible(env, walletAddress),
    lookupTwitterHandle(env, walletAddress),
  ])

  const twitterConnected = twitterHandle != null
  const lifetimeVolume =
    volumeResult.kind === 'ok' && !volumeResult.linkedAsChild ? volumeResult.volumeUsd : null
  const snapshotVolume =
    snapshotResult.kind === 'ok' && !snapshotResult.linkedAsChild
      ? snapshotResult.volumeUsd
      : null
  const solanaEligible = solanaResult.eligible

  const passesSnapshot =
    snapshotVolume != null && snapshotVolume >= SNAPSHOT_VOLUME_THRESHOLD_USD
  const passesSolana = solanaEligible
  const passesVolumeTwitter =
    lifetimeVolume != null && lifetimeVolume >= LIFETIME_VOLUME_THRESHOLD_USD && twitterConnected

  // First-pass wins on qualified_via: prefer snapshot > solana > volume_twitter.
  let qualifiedVia: QualifiedVia | null = null
  if (passesSnapshot) qualifiedVia = 'snapshot_volume'
  else if (passesSolana) qualifiedVia = 'solana_mobile'
  else if (passesVolumeTwitter) qualifiedVia = 'volume_twitter'

  // Opportunistic social-card refresh — never blocks qualification.
  let socialPostFound = 0
  let socialPostTweetUrl: string | null = null
  if (tokenId && twitterConnected) {
    try {
      const postResult = await checkSocialPost(env, walletAddress, tokenId)
      if (postResult.kind === 'ok' && postResult.record.found) {
        socialPostFound = 1
        socialPostTweetUrl = postResult.record.tweetUrl
      }
    } catch (err) {
      console.error('social-post check failed (non-fatal)', err)
    }
  }

  if (!qualifiedVia) {
    return Response.json(
      {
        qualified: false,
        reason: 'not_eligible',
        details: {
          tradingVolumeUsd: lifetimeVolume,
          snapshotVolumeUsd: snapshotVolume,
          solanaMobileEligible: solanaEligible,
          twitterConnected,
        },
      },
      { headers: NO_STORE },
    )
  }

  await env.DB
    .prepare(
      `INSERT INTO presale_whitelist_applications (
         wallet_address, qualified_via, trading_volume_usd, snapshot_volume_usd,
         solana_mobile_eligible, twitter_handle, twitter_connected,
         social_post_found, social_post_tweet_url
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
       ON CONFLICT(wallet_address) DO UPDATE SET
         trading_volume_usd     = excluded.trading_volume_usd,
         snapshot_volume_usd    = excluded.snapshot_volume_usd,
         solana_mobile_eligible = excluded.solana_mobile_eligible,
         twitter_handle         = excluded.twitter_handle,
         twitter_connected      = excluded.twitter_connected,
         social_post_found      = MAX(presale_whitelist_applications.social_post_found, excluded.social_post_found),
         social_post_tweet_url  = COALESCE(excluded.social_post_tweet_url, presale_whitelist_applications.social_post_tweet_url)`,
    )
    .bind(
      walletAddress,
      qualifiedVia,
      lifetimeVolume,
      snapshotVolume,
      solanaEligible ? 1 : 0,
      twitterHandle,
      twitterConnected ? 1 : 0,
      socialPostFound,
      socialPostTweetUrl,
    )
    .run()

  const row = await loadApplication(env, walletAddress)
  if (!row) return Response.json({ error: 'insert_failed' }, { status: 500 })
  return Response.json(serialize(row), { headers: NO_STORE })
}
