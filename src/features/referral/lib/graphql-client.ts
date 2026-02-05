/**
 * GraphQL client for fetching referral data from Hasura
 */

import { fromHasuraToNative, BigNumber, type BigNumberSource } from '@/lib/bignumber'

const GRAPHQL_ENDPOINT = 'https://tracker-gql-dev.tessera.fun/v1/graphql'

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

// ============ Trading Leaderboard ============

export interface TradingVolumeByAccount {
  account: string
  total_volume: string // numeric from GraphQL (18 decimals)
}

/**
 * Fetch trading volume leaderboard
 */
export async function fetchTradingVolumeLeaderboard(
  limit: number = 10,
  offset: number = 0
): Promise<{ items: TradingVolumeByAccount[]; total: number }> {
  const query = `
    query GetTradingVolumeLeaderboard($limit: Int!, $offset: Int!) {
      public_marts_total_trading_volume_by_account(
        limit: $limit
        offset: $offset
        order_by: { total_volume: desc }
      ) {
        account
        total_volume
      }
      public_marts_total_trading_volume_by_account_aggregate {
        aggregate {
          count
        }
      }
    }
  `

  const data = await graphqlRequest<{
    public_marts_total_trading_volume_by_account: TradingVolumeByAccount[]
    public_marts_total_trading_volume_by_account_aggregate: { aggregate: { count: number } }
  }>(query, { limit, offset })

  return {
    items: data.public_marts_total_trading_volume_by_account,
    total: data.public_marts_total_trading_volume_by_account_aggregate.aggregate.count,
  }
}

/**
 * Fetch a specific user's trading volume rank
 */
export async function fetchUserTradingVolumeRank(
  walletAddress: string
): Promise<{ rank: number; totalVolume: number } | null> {
  // First, get the user's total volume
  const userQuery = `
    query GetUserTradingVolume($account: String!) {
      public_marts_total_trading_volume_by_account(
        where: { account: { _eq: $account } }
      ) {
        account
        total_volume
      }
    }
  `

  const userData = await graphqlRequest<{
    public_marts_total_trading_volume_by_account: TradingVolumeByAccount[]
  }>(userQuery, { account: walletAddress })

  if (userData.public_marts_total_trading_volume_by_account.length === 0) {
    return null
  }

  const userVolume = userData.public_marts_total_trading_volume_by_account[0].total_volume

  // Count how many accounts have higher volume to determine rank
  const rankQuery = `
    query GetUserRank($volume: numeric!) {
      public_marts_total_trading_volume_by_account_aggregate(
        where: { total_volume: { _gt: $volume } }
      ) {
        aggregate {
          count
        }
      }
    }
  `

  const rankData = await graphqlRequest<{
    public_marts_total_trading_volume_by_account_aggregate: { aggregate: { count: number } }
  }>(rankQuery, { volume: userVolume })

  const rank = rankData.public_marts_total_trading_volume_by_account_aggregate.aggregate.count + 1

  return {
    rank,
    totalVolume: hasuraToNumber(userVolume),
  }
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

// Dashboard statistics types
export interface DashboardStatsResult {
  totalTradingVolume: number
  totalTraders: number
}

/**
 * Fetch dashboard statistics: total trading volume and active traders
 */
export async function fetchDashboardStats(): Promise<DashboardStatsResult> {
  const query = `
    query GetDashboardStats {
      public_marts_attributed_trading_volume_by_code_account_aggregate {
        aggregate {
          sum {
            total_volume
          }
        }
      }
      facts_referral_system_user_registered_events_aggregate {
        aggregate {
          count
        }
      }
    }
  `

  const data = await graphqlRequest<{
    public_marts_attributed_trading_volume_by_code_account_aggregate: {
      aggregate: {
        sum: {
          total_volume: string | null
        }
      }
    }
    facts_referral_system_user_registered_events_aggregate: {
      aggregate: {
        count: number
      }
    }
  }>(query)

  const totalVolume = data.public_marts_attributed_trading_volume_by_code_account_aggregate.aggregate.sum.total_volume

  return {
    totalTradingVolume: totalVolume ? hasuraToNumber(totalVolume) : 0,
    totalTraders: data.facts_referral_system_user_registered_events_aggregate.aggregate.count,
  }
}

/**
 * Fetch user-specific swap events (trade history) with pagination
 */
export async function fetchUserSwapEvents(
  userAddress: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ events: MeteoraSwapEvent[]; total: number }> {
  const query = `
    query GetUserSwapEvents($sender: String!, $limit: Int!, $offset: Int!) {
      facts_meteora_token_swap_events(
        where: { sender: { _eq: $sender } }
        limit: $limit
        offset: $offset
        order_by: { block_time: desc }
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
      facts_meteora_token_swap_events_aggregate(where: { sender: { _eq: $sender } }) {
        aggregate {
          count
        }
      }
    }
  `

  const data = await graphqlRequest<SwapEventsQueryResult>(query, {
    sender: userAddress,
    limit,
    offset,
  })

  return {
    events: data.facts_meteora_token_swap_events,
    total: data.facts_meteora_token_swap_events_aggregate.aggregate.count,
  }
}

export interface UserTradingVolumeResult {
  totalVolumeUsd: number
}

/**
 * Fetch user's total trading volume (sum of USDC amounts from all swaps)
 * This represents the user's own trading volume, not volume from their referrals
 */
export async function fetchUserTradingVolume(userAddress: string): Promise<UserTradingVolumeResult> {
  const query = `
    query GetUserTradingVolume($sender: String!) {
      facts_meteora_token_swap_events_aggregate(where: { sender: { _eq: $sender } }) {
        aggregate {
          sum {
            amount_y
          }
        }
      }
    }
  `

  const data = await graphqlRequest<{
    facts_meteora_token_swap_events_aggregate: {
      aggregate: {
        sum: {
          amount_y: string | null
        }
      }
    }
  }>(query, { sender: userAddress })

  const totalVolumeRaw = data.facts_meteora_token_swap_events_aggregate.aggregate.sum.amount_y

  return {
    totalVolumeUsd: totalVolumeRaw ? hasuraToNumber(totalVolumeRaw) : 0,
  }
}

// ============ Token Price Data ============

export interface TokenPriceDaily {
  date: string
  day_timestamp: number
  price: string // numeric from GraphQL
  token: string
}

export interface TokenPrice24hOHLC {
  token: string
  open_price_24h: string | null
  high_price_24h: string | null
  low_price_24h: string | null
  close_price_24h: string | null
  price_change_24h: string | null
  price_change_pct_24h: string | null
  swap_count_24h: number | null
}

interface TokenPricesQueryResult {
  public_marts_token_prices_daily: TokenPriceDaily[]
}

interface TokenPrice24hQueryResult {
  public_marts_token_prices_24h_ohlc: TokenPrice24hOHLC[]
}

interface SwapEventsForPriceQueryResult {
  facts_meteora_token_swap_events: Array<{
    block_time: number
    amount_x: string
    amount_y: string
    type: string
  }>
}

/**
 * Fetch daily price data for a token
 */
export async function fetchTokenPricesDaily(
  tokenMint: string,
  limit: number = 365
): Promise<TokenPriceDaily[]> {
  const query = `
    query GetTokenPricesDaily($token: String!, $limit: Int!) {
      public_marts_token_prices_daily(
        where: { token: { _eq: $token } }
        order_by: { day_timestamp: desc }
        limit: $limit
      ) {
        date
        day_timestamp
        price
        token
      }
    }
  `

  const data = await graphqlRequest<TokenPricesQueryResult>(query, {
    token: tokenMint,
    limit,
  })

  return data.public_marts_token_prices_daily
}

/**
 * Fetch 24h OHLC data for a token
 */
export async function fetchTokenPrice24hOHLC(
  tokenMint: string
): Promise<TokenPrice24hOHLC | null> {
  const query = `
    query GetTokenPrice24hOHLC($token: String!) {
      public_marts_token_prices_24h_ohlc(
        where: { token: { _eq: $token } }
        limit: 1
      ) {
        token
        open_price_24h
        high_price_24h
        low_price_24h
        close_price_24h
        price_change_24h
        price_change_pct_24h
        swap_count_24h
      }
    }
  `

  const data = await graphqlRequest<TokenPrice24hQueryResult>(query, {
    token: tokenMint,
  })

  return data.public_marts_token_prices_24h_ohlc[0] ?? null
}

/**
 * Fetch swap events for price chart (ordered by time)
 * Returns events that can be used to calculate price at each swap
 */
export async function fetchSwapEventsForPrice(
  poolAddress: string,
  limit: number = 500
): Promise<Array<{ block_time: number; amount_x: string; amount_y: string; type: string }>> {
  const query = `
    query GetSwapEventsForPrice($poolAddress: String!, $limit: Int!) {
      facts_meteora_token_swap_events(
        where: { pool_address: { _eq: $poolAddress } }
        order_by: { block_time: asc }
        limit: $limit
      ) {
        block_time
        amount_x
        amount_y
        type
      }
    }
  `

  const data = await graphqlRequest<SwapEventsForPriceQueryResult>(query, {
    poolAddress,
    limit,
  })

  return data.facts_meteora_token_swap_events
}

/**
 * Fetch swap events from the last 24 hours for OHLC calculation
 */
export async function fetchSwapEventsLast24h(
  poolAddress: string
): Promise<Array<{ block_time: number; amount_x: string; amount_y: string; type: string }>> {
  // Calculate timestamp for 24 hours ago
  const now = Math.floor(Date.now() / 1000)
  const twentyFourHoursAgo = now - 24 * 60 * 60

  const query = `
    query GetSwapEventsLast24h($poolAddress: String!, $since: Int!) {
      facts_meteora_token_swap_events(
        where: {
          pool_address: { _eq: $poolAddress }
          block_time: { _gte: $since }
        }
        order_by: { block_time: asc }
      ) {
        block_time
        amount_x
        amount_y
        type
      }
    }
  `

  const data = await graphqlRequest<SwapEventsForPriceQueryResult>(query, {
    poolAddress,
    since: twentyFourHoursAgo,
  })

  return data.facts_meteora_token_swap_events
}

// ============ Market Cap & Token Stats ============

export interface TotalMarketCapData {
  latest_price_block: number
  token_count: number
  total_market_cap: string // numeric from GraphQL (18 decimals)
}

export interface TokenMarketCapData {
  token: string
  circulating_supply: string // numeric from GraphQL (18 decimals)
  market_cap: string // numeric from GraphQL (18 decimals)
  price: string // numeric from GraphQL (18 decimals)
}

/**
 * Fetch total market cap and assets tokenized count
 */
export async function fetchTotalMarketCap(): Promise<TotalMarketCapData | null> {
  const query = `
    query GetTotalMarketCap {
      public_marts_total_market_cap(limit: 1) {
        latest_price_block
        token_count
        total_market_cap
      }
    }
  `

  const data = await graphqlRequest<{
    public_marts_total_market_cap: TotalMarketCapData[]
  }>(query)

  return data.public_marts_total_market_cap[0] ?? null
}

/**
 * Fetch token market cap data for a specific token
 */
export async function fetchTokenMarketCap(tokenMint: string): Promise<TokenMarketCapData | null> {
  const query = `
    query GetTokenMarketCap($token: String!) {
      public_marts_token_market_cap(where: { token: { _eq: $token } }, limit: 1) {
        token
        circulating_supply
        market_cap
        price
      }
    }
  `

  const data = await graphqlRequest<{
    public_marts_token_market_cap: TokenMarketCapData[]
  }>(query, { token: tokenMint })

  return data.public_marts_token_market_cap[0] ?? null
}

/**
 * Fetch all token market cap data
 */
export async function fetchAllTokenMarketCaps(): Promise<TokenMarketCapData[]> {
  const query = `
    query GetAllTokenMarketCaps {
      public_marts_token_market_cap {
        token
        circulating_supply
        market_cap
        price
      }
    }
  `

  const data = await graphqlRequest<{
    public_marts_token_market_cap: TokenMarketCapData[]
  }>(query)

  return data.public_marts_token_market_cap
}

// ============ Token Details (with holder count) ============

export interface TokenDetailsData {
  token: string
  circulating_supply: string // numeric from GraphQL (18 decimals)
  holder_count: number // bigint from GraphQL
  market_cap: string // numeric from GraphQL (18 decimals)
  price: string // numeric from GraphQL (18 decimals)
  price_block: number // bigint from GraphQL
}

/**
 * Fetch all token details including holder count
 */
export async function fetchAllTokenDetails(): Promise<TokenDetailsData[]> {
  const query = `
    query GetAllTokenDetails {
      public_marts_token_details {
        token
        circulating_supply
        holder_count
        market_cap
        price
        price_block
      }
    }
  `

  const data = await graphqlRequest<{
    public_marts_token_details: TokenDetailsData[]
  }>(query)

  return data.public_marts_token_details
}

/**
 * Fetch token details for a specific token
 */
export async function fetchTokenDetails(tokenMint: string): Promise<TokenDetailsData | null> {
  const query = `
    query GetTokenDetails($token: String!) {
      public_marts_token_details(where: { token: { _eq: $token } }, limit: 1) {
        token
        circulating_supply
        holder_count
        market_cap
        price
        price_block
      }
    }
  `

  const data = await graphqlRequest<{
    public_marts_token_details: TokenDetailsData[]
  }>(query, { token: tokenMint })

  return data.public_marts_token_details[0] ?? null
}

// ============ Auction Data ============

export interface AuctionTotalRaisedData {
  pool: string
  total_raised_amount: string // numeric from GraphQL (18 decimals)
}

export interface EscrowDepositEvent {
  amount: string // numeric from GraphQL (18 decimals)
  block_time: number
  owner: string
  pool: string
  signature: string
}

/**
 * Fetch total raised amount for an auction pool
 */
export async function fetchAuctionTotalRaised(poolAddress: string): Promise<AuctionTotalRaisedData | null> {
  const query = `
    query GetAuctionTotalRaised($pool: String!) {
      public_marts_auction_total_raised(where: { pool: { _eq: $pool } }, limit: 1) {
        pool
        total_raised_amount
      }
    }
  `

  const data = await graphqlRequest<{
    public_marts_auction_total_raised: AuctionTotalRaisedData[]
  }>(query, { pool: poolAddress })

  return data.public_marts_auction_total_raised[0] ?? null
}

/**
 * Fetch all escrow deposit events for an auction pool (for chart data)
 * Returns events ordered by block_time ascending
 */
export async function fetchAuctionDepositEvents(
  poolAddress: string,
  limit: number = 1000
): Promise<EscrowDepositEvent[]> {
  const query = `
    query GetAuctionDepositEvents($pool: String!, $limit: Int!) {
      facts_meteora_escrow_deposited_events(
        where: { pool: { _eq: $pool } }
        order_by: { block_time: asc }
        limit: $limit
      ) {
        amount
        block_time
        owner
        pool
        signature
      }
    }
  `

  const data = await graphqlRequest<{
    facts_meteora_escrow_deposited_events: EscrowDepositEvent[]
  }>(query, { pool: poolAddress, limit })

  return data.facts_meteora_escrow_deposited_events
}

// ============ Dashboard Summary ============

export interface DashboardSummaryData {
  total_active_traders: number // bigint from GraphQL
  total_assets_tokenized: number // bigint from GraphQL
  total_market_cap: string // numeric from GraphQL (18 decimals)
  total_market_cap_24h_change: string | null // numeric from GraphQL (18 decimals)
  total_market_cap_24h_change_pct: string | null // numeric from GraphQL (18 decimals)
  total_traders_24h_change: number | null // bigint from GraphQL
  total_trading_volume: string // numeric from GraphQL (18 decimals)
  total_volume_24h_change: string | null // numeric from GraphQL (18 decimals)
  total_volume_24h_change_pct: string | null // numeric from GraphQL (18 decimals)
}

/**
 * Fetch dashboard summary with all 24h change data
 */
export async function fetchDashboardSummary(): Promise<DashboardSummaryData | null> {
  const query = `
    query GetDashboardSummary {
      public_marts_dashboard_summary(limit: 1) {
        total_active_traders
        total_assets_tokenized
        total_market_cap
        total_market_cap_24h_change
        total_market_cap_24h_change_pct
        total_traders_24h_change
        total_trading_volume
        total_volume_24h_change
        total_volume_24h_change_pct
      }
    }
  `

  const data = await graphqlRequest<{
    public_marts_dashboard_summary: DashboardSummaryData[]
  }>(query)

  return data.public_marts_dashboard_summary[0] ?? null
}

// ============ Trading Points by Account ============

export interface TradingPointsByAccountData {
  account: string
  own_trading_points: string // numeric from GraphQL (18 decimals)
  referral_trading_points: string // numeric from GraphQL (18 decimals)
  tier1_referral_points: string // numeric from GraphQL (18 decimals)
  tier2_referral_points: string // numeric from GraphQL (18 decimals)
  tier3_referral_points: string // numeric from GraphQL (18 decimals)
  total_trading_points: string // numeric from GraphQL (18 decimals)
}

/**
 * Fetch trading points for a specific account
 * Returns referral points breakdown (own, referral total, tier1/2/3)
 */
export async function fetchTradingPointsByAccount(
  account: string
): Promise<TradingPointsByAccountData | null> {
  const query = `
    query GetTradingPointsByAccount($account: String!) {
      public_marts_trading_points_by_account(
        where: { account: { _eq: $account } }
        limit: 1
      ) {
        account
        own_trading_points
        referral_trading_points
        tier1_referral_points
        tier2_referral_points
        tier3_referral_points
        total_trading_points
      }
    }
  `

  const data = await graphqlRequest<{
    public_marts_trading_points_by_account: TradingPointsByAccountData[]
  }>(query, { account })

  return data.public_marts_trading_points_by_account[0] ?? null
}

// ============ Reward Details by Code/Referral ============

export interface FeeByToken {
  fee: string // numeric from GraphQL (18 decimals)
  mint: string
}

export interface RewardDetailByCodeReferral {
  code: string
  referral: string
  tier: number
  total_rewards_usd: string // numeric from GraphQL (18 decimals)
  fees_by_token: FeeByToken[] | null // jsonb array of {fee, mint}
}

/**
 * Fetch reward details for all referrals under a specific code
 * Returns reward data per referral (user) for the given code
 */
export async function fetchRewardDetailsByCode(
  code: string
): Promise<RewardDetailByCodeReferral[]> {
  const query = `
    query GetRewardDetailsByCode($code: String!) {
      public_marts_reward_detail_by_code_referral(
        where: { code: { _eq: $code } }
      ) {
        code
        referral
        tier
        total_rewards_usd
        fees_by_token
      }
    }
  `

  const data = await graphqlRequest<{
    public_marts_reward_detail_by_code_referral: RewardDetailByCodeReferral[]
  }>(query, { code })

  return data.public_marts_reward_detail_by_code_referral
}
