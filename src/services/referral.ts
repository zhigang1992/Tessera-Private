import {
  fetchAffiliateStats,
  fetchUserRegistration,
  fetchSwapEvents,
  fetchUserTradingVolume,
  fetchUsersForCode,
  fetchRewardDetailsByCode,
  fetchTradingPointsByAccount,
  type AggregatedAffiliateStats,
  type TradingPointsByAccountData,
} from '@/features/referral/lib/graphql-client'
import { fromHasuraToNative, formatBigNumber, BigNumber, math, mathIs, type BigNumberSource, type BigNumberValue } from '@/lib/bignumber'
import {
  DEFAULT_BASE_TOKEN_ID,
  getAppToken,
  getTokenDlmmPoolAddress,
  getTokenIdByMint,
} from '@/config'

const BASE_TOKEN = getAppToken(DEFAULT_BASE_TOKEN_ID)

function getBasePoolAddress(): string | null {
  // Get network-aware pool address from config
  return getTokenDlmmPoolAddress(BASE_TOKEN.id)
}

function getSymbolForMint(mint: string): string {
  const tokenId = getTokenIdByMint(mint)
  if (!tokenId) {
    if (mint.length <= 8) return mint
    return `${mint.slice(0, 4)}...${mint.slice(-4)}`
  }
  return getAppToken(tokenId).symbol
}

// ============ Types ============

export interface RewardsData {
  rewards: number
  referralPoints: number | null
}

export interface TraderLayer {
  layer: string
  tradersReferred: number
  points: number
}

export interface ReferralCode {
  code: string
  totalVolume: number
  tradersReferred: number
  totalRewards: number
}

export interface RewardItem {
  amount: BigNumberValue
  mint: string
}

export interface ReferralUser {
  id: string
  email: string
  dateJoined: string
  layer: 'L1' | 'L2' | 'L3'
  rewards: RewardItem[]
  referredBy?: string // referrer's user id
}

// Traders tab types
export interface TradersOverviewData {
  tradingVolume: number
  activeReferralCode: string | null
  tradingPoints: number
}

export interface TradingHistoryItem {
  id: string
  token: string
  tokenIcon?: string
  amountIn: string
  amountOut: string
  type: 'Buy' | 'Sell'
  account: string
  time: string
}

export interface TradingHistoryResponse {
  items: TradingHistoryItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Store wallet address for service layer (set by components that have wallet context)
let currentWalletAddress: string | null = null

export function setCurrentWalletAddress(address: string | null) {
  currentWalletAddress = address
}

export function getCurrentWalletAddress(): string | null {
  return currentWalletAddress
}


// ============ Helper Functions (calculation logic) ============

function formatCurrency(value: number): string {
  return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatSOL(value: number): string {
  return `${value.toFixed(2)} SOL`
}

// ============ API Functions ============

// Cache for GraphQL stats to avoid repeated calls
let cachedAffiliateStats: AggregatedAffiliateStats | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 30000 // 30 seconds

// Cache for trading points
let cachedTradingPoints: TradingPointsByAccountData | null = null
let tradingPointsCacheTimestamp: number = 0
let tradingPointsCacheAddress: string | null = null

async function getCachedAffiliateStats(walletAddress?: string): Promise<AggregatedAffiliateStats | null> {
  const address = walletAddress || currentWalletAddress
  if (!address) return null

  const now = Date.now()
  if (cachedAffiliateStats && now - cacheTimestamp < CACHE_TTL) {
    return cachedAffiliateStats
  }

  cachedAffiliateStats = await fetchAffiliateStats(address)
  cacheTimestamp = now
  return cachedAffiliateStats
}

async function getCachedTradingPoints(walletAddress?: string): Promise<TradingPointsByAccountData | null> {
  const address = walletAddress || currentWalletAddress
  if (!address) return null

  const now = Date.now()
  // Check if cache is valid (same address and within TTL)
  if (cachedTradingPoints && tradingPointsCacheAddress === address && now - tradingPointsCacheTimestamp < CACHE_TTL) {
    return cachedTradingPoints
  }

  cachedTradingPoints = await fetchTradingPointsByAccount(address)
  tradingPointsCacheTimestamp = now
  tradingPointsCacheAddress = address
  return cachedTradingPoints
}

export async function getRewardsOverview(walletAddress?: string): Promise<RewardsData> {
  // Fetch affiliate stats and trading points in parallel
  const [stats, tradingPoints] = await Promise.all([
    getCachedAffiliateStats(walletAddress),
    getCachedTradingPoints(walletAddress),
  ])

  // Get referral points from trading_points_by_account (referral_trading_points)
  let referralPoints: number | null = null
  if (tradingPoints?.referral_trading_points) {
    referralPoints = Math.round(BigNumber.toNumber(fromHasuraToNative(tradingPoints.referral_trading_points)))
  }

  // Get rewards from affiliate stats
  if (stats) {
    return {
      rewards: stats.totalRewardsUsd,
      referralPoints,
    }
  }

  // Return zeros when no wallet connected or GraphQL failed
  return {
    rewards: 0,
    referralPoints,
  }
}

export async function getTraderLayers(walletAddress?: string): Promise<TraderLayer[]> {
  // Fetch affiliate stats and trading points in parallel
  const [stats, tradingPoints] = await Promise.all([
    getCachedAffiliateStats(walletAddress),
    getCachedTradingPoints(walletAddress),
  ])

  // Get tier points from trading_points_by_account
  const tier1Points = tradingPoints?.tier1_referral_points
    ? Math.round(BigNumber.toNumber(fromHasuraToNative(tradingPoints.tier1_referral_points)))
    : 0
  const tier2Points = tradingPoints?.tier2_referral_points
    ? Math.round(BigNumber.toNumber(fromHasuraToNative(tradingPoints.tier2_referral_points)))
    : 0
  const tier3Points = tradingPoints?.tier3_referral_points
    ? Math.round(BigNumber.toNumber(fromHasuraToNative(tradingPoints.tier3_referral_points)))
    : 0

  // Get traders referred count from affiliate stats
  if (stats) {
    return [
      { layer: 'L1', tradersReferred: stats.tier1Referrals, points: tier1Points },
      { layer: 'L2', tradersReferred: stats.tier2Referrals, points: tier2Points },
      { layer: 'L3', tradersReferred: stats.tier3Referrals, points: tier3Points },
    ]
  }

  // Return zeros when no wallet connected or GraphQL failed
  return [
    { layer: 'L1', tradersReferred: 0, points: tier1Points },
    { layer: 'L2', tradersReferred: 0, points: tier2Points },
    { layer: 'L3', tradersReferred: 0, points: tier3Points },
  ]
}

export async function getReferralCodes(): Promise<ReferralCode[]> {
  const stats = await getCachedAffiliateStats()

  if (stats && stats.codes.length > 0) {
    return stats.codes.map((c) => ({
      code: c.code,
      totalVolume: c.tradingVolume,
      tradersReferred: c.referralCount,
      totalRewards: c.rewardsUsd,
    }))
  }

  // Return empty array when no codes exist or GraphQL failed
  return []
}

/**
 * Format a wallet address for display (truncate middle)
 */
function formatWalletAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}


/**
 * Map level label string to layer type
 */
function levelLabelToLayer(levelLabel: string): 'L1' | 'L2' | 'L3' {
  if (levelLabel === 'L1') return 'L1'
  if (levelLabel === 'L2') return 'L2'
  if (levelLabel === 'L3') return 'L3'
  return 'L1' // Default fallback
}

/**
 * Format block number to readable date
 * Note: block_number is used as timestamp in seconds
 */
function formatBlockNumber(blockNumber: number): string {
  const date = new Date(blockNumber * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export async function getReferralUsersByCode(code: string): Promise<ReferralUser[]> {
  // Fetch all users registered under this code and their reward details in parallel
  const [users, rewardDetails] = await Promise.all([
    fetchUsersForCode(code),
    fetchRewardDetailsByCode(code),
  ])

  if (users.length === 0) {
    return []
  }

  // Build a lookup map: referral wallet address -> reward items
  const rewardsByReferral = new Map<string, RewardItem[]>()
  for (const detail of rewardDetails) {
    const items: RewardItem[] = []
    if (detail.fees_by_token) {
      for (const feeEntry of detail.fees_by_token) {
        const amount = fromHasuraToNative(feeEntry.fee)
        if (mathIs`${amount} > ${0}`) {
          items.push({ amount, mint: feeEntry.mint })
        }
      }
    }
    // Merge with any existing entries (a referral can appear in multiple tiers)
    const existing = rewardsByReferral.get(detail.referral) ?? []
    rewardsByReferral.set(detail.referral, mergeRewardItems(existing, items))
  }

  // Map all users with their tier labels and rewards
  return users.map((user, index) => {
    const walletAddress = user.user_address
    const layer = levelLabelToLayer(user.level_label)

    return {
      id: `${code}-${walletAddress}-${index}`,
      email: formatWalletAddress(walletAddress),
      dateJoined: formatBlockNumber(user.block_number),
      layer,
      rewards: rewardsByReferral.get(walletAddress) ?? [],
    }
  })
}

/**
 * Merge reward items by mint, summing amounts for the same mint
 */
function mergeRewardItems(existing: RewardItem[], incoming: RewardItem[]): RewardItem[] {
  const byMint = new Map<string, BigNumberValue>()
  for (const item of [...existing, ...incoming]) {
    const prev = byMint.get(item.mint)
    byMint.set(item.mint, prev ? math`${prev} + ${item.amount}` : item.amount)
  }
  return Array.from(byMint.entries()).map(([mint, amount]) => ({ amount, mint }))
}

// Clear cache when wallet changes
export function clearAffiliateStatsCache() {
  cachedAffiliateStats = null
  cacheTimestamp = 0
  cachedTradingPoints = null
  tradingPointsCacheTimestamp = 0
  tradingPointsCacheAddress = null
}

// ============ Traders Tab Data ============

// Base pool address for filtering
const BASE_POOL_ADDRESS = getBasePoolAddress()

// Format block time to readable date with time
function formatBlockTimeWithTime(blockTime: number): string {
  const date = new Date(blockTime * 1000)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  if (isToday) {
    return `Today at ${timeStr}`
  } else if (isYesterday) {
    return `Yesterday at ${timeStr}`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${timeStr}`
  }
}

// Format amount from raw value (accounting for 18 decimal precision from GraphQL)
function formatSwapAmount(rawAmount: BigNumberSource): string {
  const bigNum = fromHasuraToNative(rawAmount)
  return formatBigNumber(bigNum)
}

// ============ Traders Tab API Functions ============

export async function getTradersOverview(walletAddress?: string): Promise<TradersOverviewData> {
  const address = walletAddress || currentWalletAddress
  if (!address) {
    // Return zeros when no wallet connected
    return {
      tradingVolume: 0,
      activeReferralCode: null,
      tradingPoints: 0,
    }
  }

  // Fetch user registration, trading volume, and trading points in parallel
  const [registration, volumeData, tradingPoints] = await Promise.all([
    fetchUserRegistration(address),
    fetchUserTradingVolume(address),
    getCachedTradingPoints(address),
  ])

  const activeReferralCode = registration?.referral_code ?? null

  // Get own trading points from trading_points_by_account
  let ownTradingPoints = 0
  if (tradingPoints?.own_trading_points) {
    ownTradingPoints = Math.round(BigNumber.toNumber(fromHasuraToNative(tradingPoints.own_trading_points)))
  }

  return {
    tradingVolume: volumeData.totalVolumeUsd,
    activeReferralCode,
    tradingPoints: ownTradingPoints,
  }
}

export async function getTradingHistory(
  page: number = 1,
  pageSize: number = 10
): Promise<TradingHistoryResponse> {
  if (!BASE_POOL_ADDRESS) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }

  const offset = (page - 1) * pageSize
  // Filter to only show trades from the configured base/quote pool
  const { events, total } = await fetchSwapEvents(pageSize, offset, BASE_POOL_ADDRESS)

  const items: TradingHistoryItem[] = events.map((event) => {
    const isBuy = event.type === 'swap-y-for-x' // Quote -> base is a buy
    const symbolX = getSymbolForMint(event.mint_x)
    const symbolY = getSymbolForMint(event.mint_y)

    const amountX = formatSwapAmount(event.amount_x)
    const amountY = formatSwapAmount(event.amount_y)

    return {
      id: event.signature,
      token: symbolX, // Base token is always the main token
      amountIn: isBuy ? `${amountY} ${symbolY}` : `${amountX} ${symbolX}`,
      amountOut: isBuy ? `${amountX} ${symbolX}` : `${amountY} ${symbolY}`,
      type: isBuy ? 'Buy' : 'Sell',
      account: formatWalletAddress(event.sender),
      time: formatBlockTimeWithTime(event.block_time),
    }
  })

  const totalPages = Math.ceil(total / pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

// ============ Export Helper Functions (for formatting in components) ============

export { formatCurrency, formatSOL }
