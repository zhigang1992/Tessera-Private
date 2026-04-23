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
import { decodeBase58, decodeBase64 } from './encoding'
import { isSocialCardTokenId, SOCIAL_CARD_SEARCH_QUERY } from '../../src/lib/social-card'
import { BigNumber, fromHasuraToNative, type BigNumberSource } from '../../src/lib/bignumber'

// ── Trading volume ────────────────────────────────────────────────────────────

type VolumeEnv = { DB: D1Database; APP_ENV?: string }

type VolumeAggregateResponse = {
  public_marts_total_trading_volume_by_account_aggregate: {
    aggregate: { sum: { total_volume: BigNumberSource | null } }
  }
}

const VOLUME_QUERY = `
  query GetTradingVolume($accounts: [String!]!) {
    public_marts_total_trading_volume_by_account_aggregate(
      where: { account: { _in: $accounts } }
    ) {
      aggregate {
        sum {
          total_volume
        }
      }
    }
  }
`

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
        accounts: hasuraSenders,
      })
      const rawSum =
        data.public_marts_total_trading_volume_by_account_aggregate.aggregate.sum.total_volume
      hasuraVolume = rawSum == null ? 0 : BigNumber.toNumber(fromHasuraToNative(rawSum))
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

// ── Snapshot trading volume (Pre-Sale 2 Option A) ─────────────────────────────

export type SnapshotVolumeResult =
  | {
      kind: 'ok'
      volumeUsd: number
      wallets: string[]
      linkedWalletCount: number
      mockedWalletCount: number
      linkedAsChild: boolean
    }
  | { kind: 'error'; reason: 'wallet_link_check_failed'; detail?: string }

export async function computeSnapshotVolume(
  env: VolumeEnv,
  parent: string,
): Promise<SnapshotVolumeResult> {
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
    console.error('Failed to check wallet_links child status (snapshot)', err)
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
    console.error('Failed to read wallet_links (snapshot)', err)
  }

  const senders = [parent, ...children]

  const mockMap = new Map<string, number>()
  try {
    const placeholders = senders.map(() => '?').join(',')
    const { results } = await env.DB
      .prepare(
        `SELECT wallet_address, snapshot_volume_usd
           FROM mock_trading_volumes
          WHERE wallet_address IN (${placeholders})
            AND snapshot_volume_usd IS NOT NULL`,
      )
      .bind(...senders)
      .all<{ wallet_address: string; snapshot_volume_usd: number }>()
    for (const row of results ?? []) {
      mockMap.set(row.wallet_address, row.snapshot_volume_usd)
    }
  } catch (err) {
    console.error('Failed to read mock snapshot volumes', err)
  }

  // TODO: replace with a real Hasura snapshot aggregation once the indexer
  // exposes a pre-event volume view. For now, any wallet without a mock row
  // contributes 0.
  const mockVolume = Array.from(mockMap.values()).reduce((sum, v) => sum + v, 0)

  return {
    kind: 'ok',
    volumeUsd: mockVolume,
    wallets: senders,
    linkedWalletCount: children.length,
    mockedWalletCount: mockMap.size,
    linkedAsChild: false,
  }
}

// ── Solana Mobile eligibility (Pre-Sale 2 Option B) ───────────────────────────

type SolanaMobileEnv = {
  DB: D1Database
  SOLANA_MAINNET_RPC_URL?: string
  HELIUS_API_KEY?: string
}

const SAGA_GENESIS_COLLECTION = '46pcSL5gmjBrPqGKFaLbbCmR6iVuLJbnQy13hAe7s6CC'
const CHAPTER_2_PREORDER_MINT = '2DMMamkkxQ6zDMBtkFp8KH7FoWzBMBA1CGTYwom4QH6Z'
const SEEKER_GENESIS_MINT_AUTHORITY = 'GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4'
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

type JsonRpcOk<T> = { jsonrpc: '2.0'; id: string | number; result: T }
type JsonRpcErr = { jsonrpc: '2.0'; id: string | number; error: { code: number; message: string } }
type JsonRpcResponse<T> = JsonRpcOk<T> | JsonRpcErr

async function rpc<T>(url: string, method: string, params: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
  })
  if (!res.ok) throw new Error(`RPC ${method} failed: ${res.status}`)
  const body = (await res.json()) as JsonRpcResponse<T>
  if ('error' in body) throw new Error(`RPC ${method}: ${body.error.message}`)
  return body.result
}

function resolveRpcUrl(env: SolanaMobileEnv): string | null {
  if (env.SOLANA_MAINNET_RPC_URL) return env.SOLANA_MAINNET_RPC_URL
  if (env.HELIUS_API_KEY) return `https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`
  return null
}

async function ownsCollectionViaDas(
  rpcUrl: string,
  owner: string,
  collection: string,
): Promise<boolean> {
  type SearchAssetsResult = { total: number }
  try {
    const result = await rpc<SearchAssetsResult>(rpcUrl, 'searchAssets', {
      ownerAddress: owner,
      grouping: ['collection', collection],
      page: 1,
      limit: 1,
    })
    return (result?.total ?? 0) > 0
  } catch (err) {
    console.error(`DAS searchAssets failed for collection ${collection}`, err)
    return false
  }
}

async function holdsTokenBalance(
  rpcUrl: string,
  owner: string,
  mint: string,
): Promise<boolean> {
  type TokenAccount = {
    account: { data: { parsed: { info: { tokenAmount: { uiAmount: number | null } } } } }
  }
  type TokenAccountsResult = { value: TokenAccount[] }
  try {
    const result = await rpc<TokenAccountsResult>(rpcUrl, 'getTokenAccountsByOwner', [
      owner,
      { mint },
      { encoding: 'jsonParsed' },
    ])
    return result.value.some((a) => (a.account.data.parsed.info.tokenAmount.uiAmount ?? 0) > 0)
  } catch (err) {
    console.error(`getTokenAccountsByOwner failed for mint ${mint}`, err)
    return false
  }
}

async function ownsSeekerGenesisToken(rpcUrl: string, owner: string): Promise<boolean> {
  type TokenAccount = {
    pubkey: string
    account: {
      data: {
        parsed: { info: { mint: string; tokenAmount: { uiAmount: number | null } } }
      }
    }
  }
  type TokenAccountsResult = { value: TokenAccount[] }

  let accounts: TokenAccount[]
  try {
    const result = await rpc<TokenAccountsResult>(rpcUrl, 'getTokenAccountsByOwner', [
      owner,
      { programId: TOKEN_2022_PROGRAM },
      { encoding: 'jsonParsed' },
    ])
    accounts = result.value
  } catch (err) {
    console.error('getTokenAccountsByOwner (Token-2022) failed', err)
    return false
  }

  const heldMints = accounts
    .filter((a) => (a.account.data.parsed.info.tokenAmount.uiAmount ?? 0) > 0)
    .map((a) => a.account.data.parsed.info.mint)
  if (heldMints.length === 0) return false

  type MultipleAccountsResult = {
    value: ({ data: [string, 'base64'] } | null)[]
  }

  const expectedAuthority = decodeBase58(SEEKER_GENESIS_MINT_AUTHORITY)

  const BATCH = 100
  for (let i = 0; i < heldMints.length; i += BATCH) {
    const batch = heldMints.slice(i, i + BATCH)
    let result: MultipleAccountsResult
    try {
      result = await rpc<MultipleAccountsResult>(rpcUrl, 'getMultipleAccounts', [
        batch,
        { encoding: 'base64' },
      ])
    } catch (err) {
      console.error('getMultipleAccounts (Token-2022 mints) failed', err)
      continue
    }

    for (const entry of result.value) {
      if (!entry) continue
      const [base64] = entry.data
      let bytes: Uint8Array
      try {
        bytes = decodeBase64(base64)
      } catch {
        continue
      }
      if (bytes.length < 36) continue
      const optionTag = bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)
      if (optionTag !== 1) continue
      let match = true
      for (let k = 0; k < 32; k++) {
        if (bytes[4 + k] !== expectedAuthority[k]) {
          match = false
          break
        }
      }
      if (match) return true
    }
  }

  return false
}

export type SolanaMobileResult = {
  eligible: boolean
  source: 'mock' | 'on-chain' | 'unavailable'
  details?: {
    sagaGenesis?: boolean
    chapter2Preorder?: boolean
    seekerGenesis?: boolean
  }
}

export async function computeSolanaMobileEligible(
  env: SolanaMobileEnv,
  wallet: string,
): Promise<SolanaMobileResult> {
  try {
    const mock = await env.DB
      .prepare('SELECT eligible FROM mock_solana_mobile WHERE wallet_address = ?')
      .bind(wallet)
      .first<{ eligible: number }>()
    if (mock) {
      return { eligible: mock.eligible === 1, source: 'mock' }
    }
  } catch (err) {
    console.error('Failed to read mock_solana_mobile', err)
  }

  const rpcUrl = resolveRpcUrl(env)
  if (!rpcUrl) return { eligible: false, source: 'unavailable' }

  const [sagaGenesis, chapter2Preorder, seekerGenesis] = await Promise.all([
    ownsCollectionViaDas(rpcUrl, wallet, SAGA_GENESIS_COLLECTION),
    holdsTokenBalance(rpcUrl, wallet, CHAPTER_2_PREORDER_MINT),
    ownsSeekerGenesisToken(rpcUrl, wallet),
  ])

  return {
    eligible: sagaGenesis || chapter2Preorder || seekerGenesis,
    source: 'on-chain',
    details: { sagaGenesis, chapter2Preorder, seekerGenesis },
  }
}
