import type { D1Database } from '@cloudflare/workers-types'

import { graphqlRequest, resolveGraphQLEndpoint } from './graphql'

type AppEnvVars = { DB: D1Database; APP_ENV?: string }
const MAINNET_GRAPHQL_ENDPOINT = 'https://tracker-gql.tessera.fun/v1/graphql'

export type SocialCardTokenId = 'T-SpaceX' | 'T-Kalshi'

const TOKEN_MINTS: Record<SocialCardTokenId, { devnet: string; mainnet: string }> = {
  'T-SpaceX': {
    devnet: '767VPk2vEyV8ujBQBJNsxewzdQZCna3sBpx2sfc7KcRj',
    mainnet: 'TSPXcLV76s6V2zDiZQ18kBfcbnjaE2ZzNT3ga2Pd99v',
  },
  'T-Kalshi': {
    devnet: 'ARYx1wGLzm9QrRXeMQ11kDNxvtvUk4VDqBg3uCXx8BG5',
    mainnet: 'TODO_KALSHI_MAINNET_MINT',
  },
}

export function resolveTokenMint(env: { APP_ENV?: string }, tokenId: SocialCardTokenId): string {
  const appEnv = (env.APP_ENV ?? 'development').toLowerCase()
  return appEnv === 'production' ? TOKEN_MINTS[tokenId].mainnet : TOKEN_MINTS[tokenId].devnet
}

export function isSocialCardTokenId(value: string): value is SocialCardTokenId {
  return value === 'T-SpaceX' || value === 'T-Kalshi'
}

export type SocialCardStats = {
  entry: string
  gain: string
  held: string
  volumeUsd: number
  variant: 'a' | 'b' | 'c'
  valuation: string
  handle: string
}

// Valuation headline text is currently static per token.
const VALUATION_BY_TOKEN: Record<SocialCardTokenId, string> = {
  'T-Kalshi': '$2B',
  'T-SpaceX': '$800B',
}

// Deterministic per user: same volume → same variant, so the X preview card
// doesn't shuffle between posts.
function pickVariant(volumeUsd: number): 'a' | 'b' | 'c' {
  const bucket = Math.abs(Math.floor(volumeUsd)) % 3
  return (['a', 'b', 'c'] as const)[bucket]
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 10) return wallet
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`
}

function normalizeTwitterHandle(value: string | null | undefined): string | null {
  if (!value) return null
  const cleaned = value.trim().replace(/^@+/, '')
  if (!cleaned) return null
  return /^[A-Za-z0-9_]{1,15}$/.test(cleaned) ? cleaned : null
}

async function findParentWallet(env: AppEnvVars, wallet: string): Promise<string | null> {
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

async function listChildWallets(env: AppEnvVars, wallet: string): Promise<string[]> {
  try {
    const { results } = await env.DB
      .prepare('SELECT child_wallet FROM wallet_links WHERE parent_wallet = ?')
      .bind(wallet)
      .all<{ child_wallet: string }>()
    return (results ?? []).map((r) => r.child_wallet)
  } catch {
    // Best-effort only; local DB may not have this table yet.
    return []
  }
}

async function findTwitterHandleInLinkedAccounts(env: AppEnvVars, wallet: string): Promise<string | null> {
  try {
    const row = await env.DB
      .prepare('SELECT twitter_handle FROM user_twitter_accounts WHERE wallet_address = ? LIMIT 1')
      .bind(wallet)
      .first<{ twitter_handle: string }>()
    return normalizeTwitterHandle(row?.twitter_handle)
  } catch {
    // Best-effort only; local DB may not have this table yet.
    return null
  }
}

async function findTwitterHandleInWhitelist(env: AppEnvVars, wallet: string): Promise<string | null> {
  try {
    const row = await env.DB
      .prepare(
        `SELECT twitter_handle
         FROM presale_whitelist_applications
         WHERE wallet_address = ? AND twitter_handle IS NOT NULL AND twitter_handle != ''
         LIMIT 1`,
      )
      .bind(wallet)
      .first<{ twitter_handle: string }>()
    return normalizeTwitterHandle(row?.twitter_handle)
  } catch {
    // Best-effort only; local DB may not have this table yet.
    return null
  }
}

async function findTwitterHandleInSocialPostChecks(
  env: AppEnvVars,
  wallet: string,
  tokenId: SocialCardTokenId,
): Promise<string | null> {
  try {
    const byToken = await env.DB
      .prepare(
        `SELECT twitter_handle
         FROM social_post_checks
         WHERE wallet_address = ? AND token_id = ? AND twitter_handle != ''
         ORDER BY checked_at DESC
         LIMIT 1`,
      )
      .bind(wallet, tokenId)
      .first<{ twitter_handle: string }>()
    const exact = normalizeTwitterHandle(byToken?.twitter_handle)
    if (exact) return exact

    const latest = await env.DB
      .prepare(
        `SELECT twitter_handle
         FROM social_post_checks
         WHERE wallet_address = ? AND twitter_handle != ''
         ORDER BY checked_at DESC
         LIMIT 1`,
      )
      .bind(wallet)
      .first<{ twitter_handle: string }>()
    return normalizeTwitterHandle(latest?.twitter_handle)
  } catch {
    // Best-effort only; local DB may not have this table yet.
    return null
  }
}

async function resolveHandle(
  env: AppEnvVars,
  wallet: string,
  tokenId: SocialCardTokenId,
  preferredHandle?: string | null,
): Promise<string> {
  const fromRequest = normalizeTwitterHandle(preferredHandle)
  if (fromRequest) return `@${fromRequest}`

  const parentWallet = await findParentWallet(env, wallet)
  const family = parentWallet
    ? [wallet, parentWallet]
    : [wallet, ...(await listChildWallets(env, wallet))]
  const candidates = Array.from(new Set(family))

  for (const candidate of candidates) {
    const handle = await findTwitterHandleInLinkedAccounts(env, candidate)
    if (handle) return `@${handle}`
  }

  for (const candidate of candidates) {
    const handle = await findTwitterHandleInWhitelist(env, candidate)
    if (handle) return `@${handle}`
  }

  for (const candidate of candidates) {
    const handle = await findTwitterHandleInSocialPostChecks(env, candidate, tokenId)
    if (handle) return `@${handle}`
  }

  const fallbackWallet = parentWallet ?? wallet
  return `@${truncateWallet(fallbackWallet)}`
}

async function resolveStatsOwnerWallet(env: AppEnvVars, wallet: string): Promise<string | null> {
  try {
    const row = await env.DB
      .prepare('SELECT parent_wallet FROM wallet_links WHERE child_wallet = ? LIMIT 1')
      .bind(wallet)
      .first<{ parent_wallet: string }>()
    return row?.parent_wallet ?? null
  } catch {
    return null
  }
}

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

const DASH = '—'

// Hasura numeric values carry an 18-decimal scale. Accept either fixed-scale
// strings ("1500000000000000000000", "1500.000000000000000000") or JSON numbers
// and return a plain USD-scale float. Lossy for huge magnitudes, which is fine
// for display values we format to 2dp anyway.
function hasura18ToNumber(raw: HasuraNumeric): number {
  if (raw === null || raw === undefined) return 0
  const asString = typeof raw === 'number' ? raw.toString() : raw
  const cleaned = asString.split('.')[0]
  let asBigInt: bigint
  try {
    asBigInt = BigInt(cleaned)
  } catch {
    return 0
  }
  const cents = asBigInt / 10n ** 16n
  return Number(cents) / 100
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
  const months = Math.floor(days / 30)
  return `${months}mo`
}

function emptyStats(valuation: string, handle: string, volumeUsd = 0): SocialCardStats {
  return {
    entry: DASH,
    gain: DASH,
    held: DASH,
    volumeUsd,
    variant: pickVariant(volumeUsd),
    valuation,
    handle,
  }
}

export async function getSocialCardStats(
  env: AppEnvVars,
  wallet: string,
  tokenId: SocialCardTokenId,
  preferredHandle?: string | null,
): Promise<SocialCardStats> {
  // If this wallet is linked as a child, its position rolls up to the parent.
  // Use the parent as the owner so child links render the same aggregate stats.
  const valuation = VALUATION_BY_TOKEN[tokenId]
  const handle = await resolveHandle(env, wallet, tokenId, preferredHandle)
  const statsOwner = (await resolveStatsOwnerWallet(env, wallet)) ?? wallet

  // Include child wallets in the query so linked wallets contribute to the position.
  let children: string[] = []
  try {
    const { results } = await env.DB
      .prepare('SELECT child_wallet FROM wallet_links WHERE parent_wallet = ?')
      .bind(statsOwner)
      .all<{ child_wallet: string }>()
    children = (results ?? []).map((r) => r.child_wallet)
  } catch (err) {
    console.error('Failed to read wallet_links for social card stats', err)
  }

  const accounts = Array.from(new Set([statsOwner, ...children]))
  const mint = resolveTokenMint(env, tokenId)

  let data: StatsQueryResponse
  try {
    data = await graphqlRequest<StatsQueryResponse>(
      resolveGraphQLEndpoint(env),
      STATS_QUERY,
      { accounts, mint },
    )
  } catch (err) {
    const appEnv = (env.APP_ENV ?? 'development').toLowerCase()
    if (appEnv === 'production') {
      console.error('Failed to fetch social card stats from GraphQL', err)
      return emptyStats(valuation, handle)
    }

    const mainnetMint = TOKEN_MINTS[tokenId].mainnet
    if (mainnetMint.startsWith('TODO_')) {
      console.error('Mainnet mint missing for social card fallback', { tokenId, mainnetMint })
      return emptyStats(valuation, handle)
    }

    try {
      data = await graphqlRequest<StatsQueryResponse>(
        MAINNET_GRAPHQL_ENDPOINT,
        STATS_QUERY,
        { accounts, mint: mainnetMint },
      )
    } catch (fallbackErr) {
      console.error('Failed to fetch social card stats from fallback mainnet GraphQL', fallbackErr)
      return emptyStats(valuation, handle)
    }
  }

  const tokenRows = data.public_marts_wallet_token_pnl ?? []
  const walletRows = data.public_marts_wallet_pnl_summary ?? []

  let totalTokenCostUsd = 0
  let totalTokenPnlUsd = 0
  let totalPurchasedAmount = 0
  let firstPurchaseTime: number | null = null

  for (const row of tokenRows) {
    totalTokenCostUsd += hasura18ToNumber(row.total_usdc_cost)
    totalTokenPnlUsd += hasura18ToNumber(row.total_pnl_usdc)
    totalPurchasedAmount += hasura18ToNumber(row.total_amount_purchased)
    const ts = parseUnixSeconds(row.first_purchase_block_time)
    if (ts && (firstPurchaseTime === null || ts < firstPurchaseTime)) {
      firstPurchaseTime = ts
    }
  }

  // Use wallet summary for background variant selection even if token row is absent.
  let totalWalletCostUsd = 0
  for (const row of walletRows) {
    totalWalletCostUsd += hasura18ToNumber(row.total_cost_usdc)
    const ts = parseUnixSeconds(row.first_purchase_block_time)
    if (ts && (firstPurchaseTime === null || ts < firstPurchaseTime)) {
      firstPurchaseTime = ts
    }
  }

  const variantBaseUsd = totalWalletCostUsd > 0 ? totalWalletCostUsd : totalTokenCostUsd
  if (totalTokenCostUsd <= 0 || totalPurchasedAmount <= 0) {
    return emptyStats(valuation, handle, variantBaseUsd)
  }

  const entryPrice = totalTokenCostUsd / totalPurchasedAmount
  const gainPct = (totalTokenPnlUsd / totalTokenCostUsd) * 100

  const heldSeconds = firstPurchaseTime
    ? Math.max(0, Math.floor(Date.now() / 1000) - firstPurchaseTime)
    : 0
  const heldDays = heldSeconds / 86400

  return {
    entry: formatUsd(entryPrice),
    gain: formatPct(gainPct),
    held: firstPurchaseTime ? formatHeld(heldDays) : DASH,
    volumeUsd: variantBaseUsd,
    variant: pickVariant(variantBaseUsd),
    valuation,
    handle,
  }
}
