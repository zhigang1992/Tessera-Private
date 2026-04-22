/**
 * Shared eligibility-check helpers.
 *
 * Used by:
 *   - functions/api/eligibility/trading-volume.ts  (public GET handler)
 *   - functions/api/eligibility/social-post.ts     (public GET handler)
 *   - functions/api/whitelist/applications.ts      (apply-for-whitelist POST)
 *
 * Keeping the core logic here means the apply endpoint can re-run the exact
 * same checks the UI runs without an internal HTTP hop or duplicated SQL.
 */

import type { D1Database } from '@cloudflare/workers-types'
import { graphqlRequest, resolveGraphQLEndpoint } from './graphql'
import { searchTweetsByUser, TwitterApiError } from './twitter-api'
import { isSocialCardTokenId, SOCIAL_CARD_SEARCH_QUERY } from '../../src/lib/social-card'

// ── Trading volume ────────────────────────────────────────────────────────────

type VolumeEnv = { DB: D1Database; APP_ENV?: string }

type VolumeAggregateResponse = {
  facts_meteora_token_swap_events_aggregate: {
    aggregate: { sum: { amount_y: string | null } }
  }
}

const VOLUME_QUERY = `
  query GetTradingVolume($senders: [String!]!) {
    facts_meteora_token_swap_events_aggregate(where: { sender: { _in: $senders } }) {
      aggregate { sum { amount_y } }
    }
  }
`

function hasura18ToUsd(raw: string | null): number {
  if (!raw) return 0
  const cleaned = raw.split('.')[0]
  let asBigInt: bigint
  try {
    asBigInt = BigInt(cleaned)
  } catch {
    return 0
  }
  const cents = asBigInt / 10n ** 16n
  return Number(cents) / 100
}

export type TradingVolumeResult =
  | {
      kind: 'ok'
      volumeUsd: number
      wallets: string[]
      linkedWalletCount: number
      mockedWalletCount: number
      linkedAsChild: boolean
    }
  | { kind: 'error'; reason: 'wallet_link_check_failed' | 'graphql_failed'; detail?: string }

export async function computeTradingVolume(
  env: VolumeEnv,
  parent: string,
): Promise<TradingVolumeResult> {
  // If this wallet is already a child, its volume rolls up to its parent —
  // returning it here would double-count.
  try {
    const linkedAs = await env.DB
      .prepare('SELECT parent_wallet FROM wallet_links WHERE child_wallet = ?')
      .bind(parent)
      .first<{ parent_wallet: string }>()
    if (linkedAs) {
      return {
        kind: 'ok',
        volumeUsd: 0,
        wallets: [parent],
        linkedWalletCount: 0,
        mockedWalletCount: 0,
        linkedAsChild: true,
      }
    }
  } catch (err) {
    console.error('Failed to check wallet_links child status', err)
    return { kind: 'error', reason: 'wallet_link_check_failed' }
  }

  let children: string[] = []
  try {
    const { results } = await env.DB
      .prepare('SELECT child_wallet FROM wallet_links WHERE parent_wallet = ?')
      .bind(parent)
      .all<{ child_wallet: string }>()
    children = (results ?? []).map((r) => r.child_wallet)
  } catch (err) {
    console.error('Failed to read wallet_links', err)
  }

  const senders = [parent, ...children]

  const mockMap = new Map<string, number>()
  try {
    const placeholders = senders.map(() => '?').join(',')
    const { results } = await env.DB
      .prepare(
        `SELECT wallet_address, volume_usd FROM mock_trading_volumes WHERE wallet_address IN (${placeholders})`,
      )
      .bind(...senders)
      .all<{ wallet_address: string; volume_usd: number }>()
    for (const row of results ?? []) {
      mockMap.set(row.wallet_address, row.volume_usd)
    }
  } catch (err) {
    console.error('Failed to read mock_trading_volumes', err)
  }

  const hasuraSenders = senders.filter((w) => !mockMap.has(w))

  let hasuraVolume = 0
  if (hasuraSenders.length > 0) {
    try {
      const endpoint = resolveGraphQLEndpoint(env)
      const data = await graphqlRequest<VolumeAggregateResponse>(endpoint, VOLUME_QUERY, {
        senders: hasuraSenders,
      })
      hasuraVolume = hasura18ToUsd(
        data.facts_meteora_token_swap_events_aggregate.aggregate.sum.amount_y,
      )
    } catch (err) {
      console.error('Failed to fetch trading volume from GraphQL', err)
      return { kind: 'error', reason: 'graphql_failed', detail: (err as Error).message }
    }
  }

  const mockVolume = Array.from(mockMap.values()).reduce((sum, v) => sum + v, 0)

  return {
    kind: 'ok',
    volumeUsd: mockVolume + hasuraVolume,
    wallets: senders,
    linkedWalletCount: children.length,
    mockedWalletCount: mockMap.size,
    linkedAsChild: false,
  }
}

// ── Twitter link + social post ────────────────────────────────────────────────

type SocialEnv = { DB: D1Database; TWITTERAPI_IO_KEY?: string }

export type SocialPostRecord = {
  found: boolean
  tweetId: string | null
  tweetUrl: string | null
  tweetCreatedAt: string | null
  checkedAt: string
}

export type SocialPostResult =
  | { kind: 'ok'; handle: string; record: SocialPostRecord }
  | { kind: 'rate_limited'; retryAfterSeconds: number }
  | { kind: 'twitter_not_verified' }
  | { kind: 'invalid_token_id' }
  | { kind: 'twitter_api_not_configured' }
  | { kind: 'twitter_api_error'; status?: number }

type PostCheckRow = {
  found: number
  tweet_id: string | null
  tweet_url: string | null
  tweet_created_at: string | null
  checked_at: string
}

const RATE_LIMIT_SECONDS = 30
const POSITIVE_TTL_SECONDS = 24 * 60 * 60

function secondsSince(iso: string): number {
  const t = Date.parse(iso.replace(' ', 'T') + 'Z')
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY
  return (Date.now() - t) / 1000
}

function toRecord(row: PostCheckRow): SocialPostRecord {
  return {
    found: row.found === 1,
    tweetId: row.tweet_id,
    tweetUrl: row.tweet_url,
    tweetCreatedAt: row.tweet_created_at,
    checkedAt: row.checked_at,
  }
}

export async function lookupTwitterHandle(
  env: SocialEnv,
  walletAddress: string,
): Promise<string | null> {
  const account = await env.DB
    .prepare('SELECT twitter_handle FROM user_twitter_accounts WHERE wallet_address = ?')
    .bind(walletAddress)
    .first<{ twitter_handle: string }>()
  return account?.twitter_handle ?? null
}

export async function checkSocialPost(
  env: SocialEnv,
  walletAddress: string,
  tokenId: string,
): Promise<SocialPostResult> {
  const apiKey = env.TWITTERAPI_IO_KEY?.trim()
  if (!apiKey) {
    console.error('TWITTERAPI_IO_KEY is not configured')
    return { kind: 'twitter_api_not_configured' }
  }

  if (!isSocialCardTokenId(tokenId)) {
    return { kind: 'invalid_token_id' }
  }

  const handle = await lookupTwitterHandle(env, walletAddress)
  if (!handle) return { kind: 'twitter_not_verified' }

  const cached = await env.DB
    .prepare(
      'SELECT found, tweet_id, tweet_url, tweet_created_at, checked_at FROM social_post_checks WHERE wallet_address = ? AND token_id = ?',
    )
    .bind(walletAddress, tokenId)
    .first<PostCheckRow>()

  if (cached) {
    const age = secondsSince(cached.checked_at)
    if (cached.found === 1 && age < POSITIVE_TTL_SECONDS) {
      return { kind: 'ok', handle, record: toRecord(cached) }
    }
    if (cached.found === 0 && age < RATE_LIMIT_SECONDS) {
      return { kind: 'rate_limited', retryAfterSeconds: Math.ceil(RATE_LIMIT_SECONDS - age) }
    }
  }

  let searchResult
  try {
    searchResult = await searchTweetsByUser({ apiKey, handle, query: SOCIAL_CARD_SEARCH_QUERY })
  } catch (err) {
    if (err instanceof TwitterApiError) {
      console.error('twitterapi.io error', err)
      return { kind: 'twitter_api_error', status: err.status }
    }
    console.error('twitterapi.io unexpected error', err)
    return { kind: 'twitter_api_error' }
  }

  const found = searchResult.found ? 1 : 0
  const tweetId = searchResult.tweet?.id ?? null
  const tweetUrl = searchResult.tweet?.url ?? null
  const tweetCreatedAt = searchResult.tweet?.createdAt ?? null

  await env.DB
    .prepare(
      `INSERT INTO social_post_checks
         (wallet_address, token_id, twitter_handle, found, tweet_id, tweet_url, tweet_created_at, checked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(wallet_address, token_id) DO UPDATE SET
         twitter_handle = excluded.twitter_handle,
         found = excluded.found,
         tweet_id = excluded.tweet_id,
         tweet_url = excluded.tweet_url,
         tweet_created_at = excluded.tweet_created_at,
         checked_at = datetime('now')`,
    )
    .bind(walletAddress, tokenId, handle, found, tweetId, tweetUrl, tweetCreatedAt)
    .run()

  const updated = await env.DB
    .prepare(
      'SELECT found, tweet_id, tweet_url, tweet_created_at, checked_at FROM social_post_checks WHERE wallet_address = ? AND token_id = ?',
    )
    .bind(walletAddress, tokenId)
    .first<PostCheckRow>()

  return { kind: 'ok', handle, record: toRecord(updated!) }
}
