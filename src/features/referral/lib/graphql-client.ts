/**
 * GraphQL client for fetching referral data from Hasura
 */

import { fromHasuraToNative, BigNumber, type BigNumberSource } from '@/lib/bignumber'

const GRAPHQL_ENDPOINT = 'https://tracker-gql-dev.tessera.fun/v1/graphql'
const HASURA_ADMIN_SECRET = 'xRkifHbnNykgVkQ6r7Ns'

/**
 * Convert Hasura 18-decimal numeric value to native number
 */
function hasuraToNumber(value: BigNumberSource): number {
  return BigNumber.toNumber(fromHasuraToNative(value))
}

// Types for GraphQL responses
export interface ReferralCodeStats {
  account: string
  code: string
  total_referrals: number
}

export interface ReferralTierStats {
  account: string
  tier: number
  total_referrals: number
}

export interface TradingVolumeStats {
  account: string
  code: string
  tier1_volume: number
  tier2_volume: number
  tier3_volume: number
  total_volume: number
}

export interface RewardStats {
  account: string
  code: string
  tier1_rewards_usd: number
  tier2_rewards_usd: number
  tier3_rewards_usd: number
  total_rewards_usd: number
}

export interface OwnerReferralStats {
  owner: string
  invited_count: number
}

// Trade/Swap event types
export interface MeteoraSwapEvent {
  signature: string
  sender: string
  mint_x: string
  mint_y: string
  amount_x: string // numeric type comes as string from GraphQL
  amount_y: string
  type: string // 'swap-x-for-y' or 'swap-y-for-x'
  block_time: number
  pool_address: string
}

export interface SwapEventsQueryResult {
  facts_meteora_token_swap_events: MeteoraSwapEvent[]
  facts_meteora_token_swap_events_aggregate: {
    aggregate: {
      count: number
    }
  }
}

export interface ReferralCodeCreatedEvent {
  signature: string
  event_index: number
  code: string
  owner: string
  block_time: number
}

export interface UserRegisteredEvent {
  signature: string
  user: string
  referral_code: string
  referral_code_key: string
  tier1_referrer: string
  tier2_referrer: string
  tier3_referrer: string
  is_new_registration: boolean
  block_time: number
}

// Query result types
export interface AffiliateStatsQueryResult {
  public_marts_referral_count_by_code_account: ReferralCodeStats[]
  public_marts_attributed_trading_volume_by_code_account: TradingVolumeStats[]
  public_marts_reward_usd_by_code_account: RewardStats[]
  public_marts_referral_count_by_tier_account: ReferralTierStats[]
}

export interface ReferralCodesQueryResult {
  facts_referral_system_referral_code_created_events: ReferralCodeCreatedEvent[]
}

export interface UserRegistrationQueryResult {
  facts_referral_system_user_registered_events: UserRegisteredEvent[]
}

// Aggregated affiliate data
export interface AggregatedAffiliateStats {
  walletAddress: string
  totalReferrals: number
  totalTradingVolume: number
  totalRewardsUsd: number
  tier1Referrals: number
  tier2Referrals: number
  tier3Referrals: number
  tier1Volume: number
  tier2Volume: number
  tier3Volume: number
  tier1Rewards: number
  tier2Rewards: number
  tier3Rewards: number
  codes: Array<{
    code: string
    referralCount: number
    tradingVolume: number
    rewardsUsd: number
  }>
}

async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`)
  }

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL query failed')
  }

  return result.data
}

/**
 * Fetch all affiliate stats for a given wallet address
 */
export async function fetchAffiliateStats(walletAddress: string): Promise<AggregatedAffiliateStats> {
  const query = `
    query GetAffiliateStats($account: String!) {
      public_marts_referral_count_by_code_account(where: { account: { _eq: $account } }) {
        account
        code
        total_referrals
      }
      public_marts_attributed_trading_volume_by_code_account(where: { account: { _eq: $account } }) {
        account
        code
        tier1_volume
        tier2_volume
        tier3_volume
        total_volume
      }
      public_marts_reward_usd_by_code_account(where: { account: { _eq: $account } }) {
        account
        code
        tier1_rewards_usd
        tier2_rewards_usd
        tier3_rewards_usd
        total_rewards_usd
      }
      public_marts_referral_count_by_tier_account(where: { account: { _eq: $account } }) {
        account
        tier
        total_referrals
      }
    }
  `

  const data = await graphqlRequest<AffiliateStatsQueryResult>(query, { account: walletAddress })

  // Aggregate data by code
  const codeMap = new Map<
    string,
    { referralCount: number; tradingVolume: number; rewardsUsd: number }
  >()

  // Process referral counts
  for (const item of data.public_marts_referral_count_by_code_account) {
    const existing = codeMap.get(item.code) || { referralCount: 0, tradingVolume: 0, rewardsUsd: 0 }
    existing.referralCount = Number(item.total_referrals) || 0
    codeMap.set(item.code, existing)
  }

  // Process trading volumes (values are stored with 18-decimal precision)
  for (const item of data.public_marts_attributed_trading_volume_by_code_account) {
    const existing = codeMap.get(item.code) || { referralCount: 0, tradingVolume: 0, rewardsUsd: 0 }
    existing.tradingVolume = hasuraToNumber(item.total_volume)
    codeMap.set(item.code, existing)
  }

  // Process rewards (values are stored with 18-decimal precision)
  for (const item of data.public_marts_reward_usd_by_code_account) {
    const existing = codeMap.get(item.code) || { referralCount: 0, tradingVolume: 0, rewardsUsd: 0 }
    existing.rewardsUsd = hasuraToNumber(item.total_rewards_usd)
    codeMap.set(item.code, existing)
  }

  // Convert to array
  const codes = Array.from(codeMap.entries()).map(([code, stats]) => ({
    code,
    ...stats,
  }))

  // Calculate tier totals
  let tier1Referrals = 0
  let tier2Referrals = 0
  let tier3Referrals = 0

  for (const item of data.public_marts_referral_count_by_tier_account) {
    const count = Number(item.total_referrals) || 0
    if (item.tier === 1) tier1Referrals = count
    else if (item.tier === 2) tier2Referrals = count
    else if (item.tier === 3) tier3Referrals = count
  }

  // Calculate volume and reward tier totals (values are stored with 18-decimal precision)
  let tier1Volume = 0
  let tier2Volume = 0
  let tier3Volume = 0
  let tier1Rewards = 0
  let tier2Rewards = 0
  let tier3Rewards = 0

  for (const item of data.public_marts_attributed_trading_volume_by_code_account) {
    tier1Volume += hasuraToNumber(item.tier1_volume)
    tier2Volume += hasuraToNumber(item.tier2_volume)
    tier3Volume += hasuraToNumber(item.tier3_volume)
  }

  for (const item of data.public_marts_reward_usd_by_code_account) {
    tier1Rewards += hasuraToNumber(item.tier1_rewards_usd)
    tier2Rewards += hasuraToNumber(item.tier2_rewards_usd)
    tier3Rewards += hasuraToNumber(item.tier3_rewards_usd)
  }

  // Calculate totals
  const totalReferrals = tier1Referrals + tier2Referrals + tier3Referrals
  const totalTradingVolume = tier1Volume + tier2Volume + tier3Volume
  const totalRewardsUsd = tier1Rewards + tier2Rewards + tier3Rewards

  return {
    walletAddress,
    totalReferrals,
    totalTradingVolume,
    totalRewardsUsd,
    tier1Referrals,
    tier2Referrals,
    tier3Referrals,
    tier1Volume,
    tier2Volume,
    tier3Volume,
    tier1Rewards,
    tier2Rewards,
    tier3Rewards,
    codes,
  }
}

/**
 * Fetch referral codes created by a wallet
 */
export async function fetchReferralCodesByOwner(
  ownerAddress: string
): Promise<ReferralCodeCreatedEvent[]> {
  const query = `
    query GetReferralCodes($owner: String!) {
      facts_referral_system_referral_code_created_events(
        where: { owner: { _eq: $owner } }
        order_by: { block_time: desc }
      ) {
        signature
        event_index
        code
        owner
        block_time
      }
    }
  `

  const data = await graphqlRequest<ReferralCodesQueryResult>(query, { owner: ownerAddress })
  return data.facts_referral_system_referral_code_created_events
}

/**
 * Fetch user registration info (what referral code they're bound to)
 */
export async function fetchUserRegistration(userAddress: string): Promise<UserRegisteredEvent | null> {
  const query = `
    query GetUserRegistration($user: String!) {
      facts_referral_system_user_registered_events(
        where: { user: { _eq: $user } }
        order_by: { block_time: desc }
        limit: 1
      ) {
        signature
        user
        referral_code
        referral_code_key
        tier1_referrer
        tier2_referrer
        tier3_referrer
        is_new_registration
        block_time
      }
    }
  `

  const data = await graphqlRequest<UserRegistrationQueryResult>(query, { user: userAddress })
  return data.facts_referral_system_user_registered_events[0] || null
}

/**
 * Fetch traders registered under a specific referral code
 */
export async function fetchTradersForCode(referralCode: string): Promise<UserRegisteredEvent[]> {
  const query = `
    query GetTradersForCode($code: String!) {
      facts_referral_system_user_registered_events(
        where: { referral_code: { _eq: $code } }
        order_by: { block_time: desc }
      ) {
        signature
        user
        referral_code
        referral_code_key
        tier1_referrer
        tier2_referrer
        tier3_referrer
        is_new_registration
        block_time
      }
    }
  `

  const data = await graphqlRequest<UserRegistrationQueryResult>(query, { code: referralCode })
  return data.facts_referral_system_user_registered_events
}

/**
 * Fetch global referral stats for leaderboard
 */
export async function fetchGlobalReferralStats(limit: number = 10, offset: number = 0) {
  const query = `
    query GetGlobalStats($limit: Int!, $offset: Int!) {
      view_owner_referral_stats(
        limit: $limit
        offset: $offset
        order_by: { invited_count: desc }
      ) {
        owner
        invited_count
      }
      view_owner_referral_stats_aggregate {
        aggregate {
          count
        }
      }
    }
  `

  return graphqlRequest<{
    view_owner_referral_stats: OwnerReferralStats[]
    view_owner_referral_stats_aggregate: { aggregate: { count: number } }
  }>(query, { limit, offset })
}

/**
 * Fetch swap events for trade history with pagination
 */
export async function fetchSwapEvents(
  limit: number = 10,
  offset: number = 0,
  poolAddress?: string
): Promise<{ events: MeteoraSwapEvent[]; total: number }> {
  const whereClause = poolAddress
    ? `where: { pool_address: { _eq: $poolAddress } }`
    : ''
  const variables: Record<string, unknown> = { limit, offset }
  if (poolAddress) {
    variables.poolAddress = poolAddress
  }

  const query = `
    query GetSwapEvents($limit: Int!, $offset: Int!${poolAddress ? ', $poolAddress: String!' : ''}) {
      facts_meteora_token_swap_events(
        limit: $limit
        offset: $offset
        order_by: { block_time: desc }
        ${whereClause}
      ) {
        signature
        sender
        mint_x
        mint_y
        amount_x
        amount_y
        type
        block_time
        pool_address
      }
      facts_meteora_token_swap_events_aggregate${poolAddress ? '(where: { pool_address: { _eq: $poolAddress } })' : ''} {
        aggregate {
          count
        }
      }
    }
  `

  const data = await graphqlRequest<SwapEventsQueryResult>(query, variables)
  return {
    events: data.facts_meteora_token_swap_events,
    total: data.facts_meteora_token_swap_events_aggregate.aggregate.count,
  }
}
