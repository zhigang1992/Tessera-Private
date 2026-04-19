import type { D1Database } from '@cloudflare/workers-types'

import { graphqlRequest, resolveGraphQLEndpoint } from './graphql'

type AppEnvVars = { DB: D1Database; APP_ENV?: string }

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
}

const STATS_QUERY = `
  query GetSocialCardStats($senders: [String!]!, $mint: String!) {
    facts_meteora_token_swap_events(
      where: { sender: { _in: $senders }, mint_x: { _eq: $mint } }
      order_by: { block_time: asc }
    ) {
      type
      amount_x
      amount_y
      block_time
    }
    public_marts_token_details(where: { token: { _eq: $mint } }, limit: 1) {
      price
    }
  }
`

// Hasura numeric columns arrive as string or (for values within the JS safe
// integer range) number — depending on the column and the client. Accept both.
type HasuraNumeric = string | number | null | undefined

type StatsQueryResponse = {
  facts_meteora_token_swap_events: Array<{
    type: string
    amount_x: HasuraNumeric
    amount_y: HasuraNumeric
    block_time: number
  }>
  public_marts_token_details: Array<{ price: HasuraNumeric }>
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

export async function getSocialCardStats(
  env: AppEnvVars,
  wallet: string,
  tokenId: SocialCardTokenId,
): Promise<SocialCardStats> {
  // Include child wallets in the query so linked wallets contribute to the position.
  let children: string[] = []
  try {
    const { results } = await env.DB
      .prepare('SELECT child_wallet FROM wallet_links WHERE parent_wallet = ?')
      .bind(wallet)
      .all<{ child_wallet: string }>()
    children = (results ?? []).map((r) => r.child_wallet)
  } catch (err) {
    console.error('Failed to read wallet_links for social card stats', err)
  }

  const senders = [wallet, ...children]
  const mint = resolveTokenMint(env, tokenId)

  let data: StatsQueryResponse
  try {
    data = await graphqlRequest<StatsQueryResponse>(
      resolveGraphQLEndpoint(env),
      STATS_QUERY,
      { senders, mint },
    )
  } catch (err) {
    console.error('Failed to fetch social card stats from GraphQL', err)
    return { entry: DASH, gain: DASH, held: DASH }
  }

  const buys = data.facts_meteora_token_swap_events.filter((e) => e.type === 'swap-y-for-x')
  if (buys.length === 0) {
    return { entry: DASH, gain: DASH, held: DASH }
  }

  // Both amount_x and amount_y are Hasura numeric(.., 18). The 18-decimal scale
  // cancels in the ratio, so VWAP = sum(amount_y) / sum(amount_x) gives the
  // true USD-per-token price.
  let sumUsd = 0
  let sumTokens = 0
  for (const buy of buys) {
    sumUsd += hasura18ToNumber(buy.amount_y)
    sumTokens += hasura18ToNumber(buy.amount_x)
  }

  if (sumTokens <= 0) {
    return { entry: DASH, gain: DASH, held: DASH }
  }

  const entryPrice = sumUsd / sumTokens
  const currentPrice = hasura18ToNumber(data.public_marts_token_details[0]?.price ?? null)

  const gainPct = entryPrice > 0 && currentPrice > 0
    ? ((currentPrice - entryPrice) / entryPrice) * 100
    : 0

  const firstBuyTime = buys[0].block_time
  const heldSeconds = Math.max(0, Math.floor(Date.now() / 1000) - firstBuyTime)
  const heldDays = heldSeconds / 86400

  return {
    entry: formatUsd(entryPrice),
    gain: currentPrice > 0 ? formatPct(gainPct) : DASH,
    held: formatHeld(heldDays),
  }
}
