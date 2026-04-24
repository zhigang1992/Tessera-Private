import type { D1Database } from '@cloudflare/workers-types'

import { graphqlRequest } from './graphql'

type AppEnvVars = { DB: D1Database }

// The card always describes SpaceX stats on mainnet, regardless of which
// auction page the share was initiated from.
const MAINNET_GRAPHQL_ENDPOINT = 'https://tracker-gql.tessera.fun/v1/graphql'
const SPACEX_MAINNET_MINT = 'TSPXcLV76s6V2zDiZQ18kBfcbnjaE2ZzNT3ga2Pd99v'
const VALUATION = '$800B'
const DASH = '—'
const TWITTER_HANDLE_REGEX = /^[A-Za-z0-9_]{1,15}$/

const STATS_QUERY = `
  query GetSocialCardStats($accounts: [String!]!, $mint: String!) {
    public_marts_wallet_token_pnl(
      where: { account: { _in: $accounts }, token: { _eq: $mint } }
    ) {
      account
      total_usdc_cost
      total_pnl_usdc
      total_amount_purchased
      first_purchase_block_time
    }
    public_marts_wallet_pnl_summary(
      where: { account: { _in: $accounts } }
    ) {
      account
      total_cost_usdc
      first_purchase_block_time
    }
  }
`

export type SocialCardStats = {
  entry: string
  gain: string
  held: string
  volumeUsd: number
  variant: 'a' | 'b' | 'c'
  valuation: string
  handle: string
}

// Hasura numeric columns arrive as string or (for values within the JS safe
// integer range) number — depending on the column and the client. Accept both.
type HasuraNumeric = string | number | null | undefined

type StatsQueryResponse = {
  public_marts_wallet_token_pnl: Array<{
    account: string
    total_usdc_cost: HasuraNumeric
    total_pnl_usdc: HasuraNumeric
    total_amount_purchased: HasuraNumeric
    first_purchase_block_time: HasuraNumeric
  }>
  public_marts_wallet_pnl_summary: Array<{
    account: string
    total_cost_usdc: HasuraNumeric
    first_purchase_block_time: HasuraNumeric
  }>
}

type WalletFamily = {
  ownerWallet: string
  handleCandidates: string[]
  statsAccounts: string[]
}

type AggregatedPnl = {
  totalTokenCostUsd: number
  totalTokenPnlUsd: number
  totalPurchasedAmount: number
  totalWalletCostUsd: number
  firstPurchaseTime: number | null
}

// Deterministic per user: same volume -> same variant, so the X preview card
// doesn't shuffle between posts.
function pickVariant(volumeUsd: number): 'a' | 'b' | 'c' {
  const bucket = Math.abs(Math.floor(volumeUsd)) % 3
  return (['a', 'b', 'c'] as const)[bucket]
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 10) return wallet
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`
}

function normalizeTwitterHandle(value: string | null | undefined): string | null {
  if (!value) return null
  const cleaned = value.trim().replace(/^@+/, '')
  if (!cleaned) return null
  return TWITTER_HANDLE_REGEX.test(cleaned) ? cleaned : null
}

// Hasura numeric values carry an 18-decimal scale. Accept JSON strings or
// numbers (including scientific-notation numbers produced when the raw value
// exceeds Number.MAX_SAFE_INTEGER) and return a plain USD-scale float.
function hasura18ToNumber(raw: HasuraNumeric): number {
  if (raw === null || raw === undefined) return 0
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return 0
  return n / 1e18
}

function parseUnixSeconds(raw: HasuraNumeric): number | null {
  if (raw === null || raw === undefined) return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.floor(n)
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatPct(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatHeld(days: number): string {
  if (days < 1) return '<1d'
  if (days < 30) return `${Math.floor(days)}d`
  return `${Math.floor(days / 30)}mo`
}

function emptyStats(handle: string, volumeUsd = 0): SocialCardStats {
  return {
    entry: DASH,
    gain: DASH,
    held: DASH,
    volumeUsd,
    variant: pickVariant(volumeUsd),
    valuation: VALUATION,
    handle,
  }
}

async function queryTwitterHandle(
  env: AppEnvVars,
  sql: string,
  bindings: string[],
): Promise<string | null> {
  try {
    const row = await env.DB
      .prepare(sql)
      .bind(...bindings)
      .first<{ twitter_handle: string }>()
    return normalizeTwitterHandle(row?.twitter_handle)
  } catch {
    // Best-effort only; local DB may not have this table yet.
    return null
  }
}

async function queryParentWallet(env: AppEnvVars, wallet: string): Promise<string | null> {
  try {
    const row = await env.DB
      .prepare('SELECT parent_wallet FROM wallet_links WHERE child_wallet = ? LIMIT 1')
      .bind(wallet)
      .first<{ parent_wallet: string }>()
    return row?.parent_wallet ?? null
  } catch {
    // Best-effort only; local DB may not have this table yet.
    return null
  }
}

async function queryChildWallets(env: AppEnvVars, parentWallet: string): Promise<string[]> {
  try {
    const { results } = await env.DB
      .prepare('SELECT child_wallet FROM wallet_links WHERE parent_wallet = ?')
      .bind(parentWallet)
      .all<{ child_wallet: string }>()
    return (results ?? []).map((r) => r.child_wallet)
  } catch {
    // Best-effort only; local DB may not have this table yet.
    return []
  }
}

async function resolveWalletFamily(env: AppEnvVars, wallet: string): Promise<WalletFamily> {
  const parentWallet = await queryParentWallet(env, wallet)
  const ownerWallet = parentWallet ?? wallet
  const children = await queryChildWallets(env, ownerWallet)
  const statsAccounts = unique([ownerWallet, ...children])
  const handleCandidates = parentWallet
    ? unique([wallet, parentWallet])
    : statsAccounts

  return { ownerWallet, handleCandidates, statsAccounts }
}

async function resolveHandleFromSources(
  env: AppEnvVars,
  preferredHandle: string | null | undefined,
  candidates: string[],
  fallbackWallet: string,
): Promise<string> {
  const fromRequest = normalizeTwitterHandle(preferredHandle)
  if (fromRequest) return `@${fromRequest}`

  const linkedQuery = 'SELECT twitter_handle FROM user_twitter_accounts WHERE wallet_address = ? LIMIT 1'
  const whitelistQuery = `
    SELECT twitter_handle
    FROM presale_whitelist_applications
    WHERE wallet_address = ? AND twitter_handle IS NOT NULL AND twitter_handle != ''
    LIMIT 1
  `
  const socialPostLatestQuery = `
    SELECT twitter_handle
    FROM social_post_checks
    WHERE wallet_address = ? AND twitter_handle != ''
    ORDER BY checked_at DESC
    LIMIT 1
  `

  for (const wallet of candidates) {
    const handle = await queryTwitterHandle(env, linkedQuery, [wallet])
    if (handle) return `@${handle}`
  }

  for (const wallet of candidates) {
    const handle = await queryTwitterHandle(env, whitelistQuery, [wallet])
    if (handle) return `@${handle}`
  }

  for (const wallet of candidates) {
    const handle = await queryTwitterHandle(env, socialPostLatestQuery, [wallet])
    if (handle) return `@${handle}`
  }

  return `@${truncateWallet(fallbackWallet)}`
}

async function fetchStatsData(
  accounts: string[],
): Promise<StatsQueryResponse | null> {
  try {
    return await graphqlRequest<StatsQueryResponse>(
      MAINNET_GRAPHQL_ENDPOINT,
      STATS_QUERY,
      { accounts, mint: SPACEX_MAINNET_MINT },
    )
  } catch (err) {
    console.error('Failed to fetch social card stats from mainnet GraphQL', err)
    return null
  }
}

function aggregatePnl(data: StatsQueryResponse): AggregatedPnl {
  let totalTokenCostUsd = 0
  let totalTokenPnlUsd = 0
  let totalPurchasedAmount = 0
  let totalWalletCostUsd = 0
  let firstPurchaseTime: number | null = null

  for (const row of data.public_marts_wallet_token_pnl ?? []) {
    totalTokenCostUsd += hasura18ToNumber(row.total_usdc_cost)
    totalTokenPnlUsd += hasura18ToNumber(row.total_pnl_usdc)
    totalPurchasedAmount += hasura18ToNumber(row.total_amount_purchased)
    const ts = parseUnixSeconds(row.first_purchase_block_time)
    if (ts !== null && (firstPurchaseTime === null || ts < firstPurchaseTime)) {
      firstPurchaseTime = ts
    }
  }

  for (const row of data.public_marts_wallet_pnl_summary ?? []) {
    totalWalletCostUsd += hasura18ToNumber(row.total_cost_usdc)
    const ts = parseUnixSeconds(row.first_purchase_block_time)
    if (ts !== null && (firstPurchaseTime === null || ts < firstPurchaseTime)) {
      firstPurchaseTime = ts
    }
  }

  return {
    totalTokenCostUsd,
    totalTokenPnlUsd,
    totalPurchasedAmount,
    totalWalletCostUsd,
    firstPurchaseTime,
  }
}

export async function getSocialCardStats(
  env: AppEnvVars,
  wallet: string,
  preferredHandle?: string | null,
): Promise<SocialCardStats> {
  const family = await resolveWalletFamily(env, wallet)
  const handle = await resolveHandleFromSources(
    env,
    preferredHandle,
    family.handleCandidates,
    family.ownerWallet,
  )

  const data = await fetchStatsData(family.statsAccounts)
  if (!data) return emptyStats(handle)

  const aggregates = aggregatePnl(data)
  const variantBaseUsd = aggregates.totalWalletCostUsd > 0
    ? aggregates.totalWalletCostUsd
    : aggregates.totalTokenCostUsd

  if (aggregates.totalTokenCostUsd <= 0 || aggregates.totalPurchasedAmount <= 0) {
    return emptyStats(handle, variantBaseUsd)
  }

  const entryPrice = aggregates.totalTokenCostUsd / aggregates.totalPurchasedAmount
  const gainPct = (aggregates.totalTokenPnlUsd / aggregates.totalTokenCostUsd) * 100
  const heldDays = aggregates.firstPurchaseTime === null
    ? 0
    : Math.max(0, Math.floor(Date.now() / 1000) - aggregates.firstPurchaseTime) / 86400

  return {
    entry: formatUsd(entryPrice),
    gain: formatPct(gainPct),
    held: aggregates.firstPurchaseTime === null ? DASH : formatHeld(heldDays),
    volumeUsd: variantBaseUsd,
    variant: pickVariant(variantBaseUsd),
    valuation: VALUATION,
    handle,
  }
}
