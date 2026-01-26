import {
  fetchAuctionTotalRaised,
  fetchAuctionDepositEvents,
} from '@/features/referral/lib/graphql-client'
import { fromHasuraToNative, BigNumber } from '@/lib/bignumber'
import { ALPHA_VAULT_CONFIG } from './alpha-vault'
import { sleep } from './utils'

// ============ Constants ============

// Use the Alpha Vault DLMM pool for auction data
const AUCTION_POOL = ALPHA_VAULT_CONFIG.dlmmPool

// ============ Types ============

export interface AuctionStats {
  title: string
  isOfficial: boolean
  totalRaised: number
  targetRaise: number
  oversubscribedRatio: number
  percentageOfTarget: number
  status: 'live' | 'upcoming' | 'ended'
  auctionEndsIn: {
    hours: number
    minutes: number
    seconds: number
  }
  poolStartsIn: {
    hours: number
    minutes: number
    seconds: number
  }
}

export interface AuctionPosition {
  isActive: boolean
  deposited: number
  estAllocation: number
  estRefund: number
}

export interface AuctionValuation {
  fdv: string
  yoetPrice: number
}

export interface AuctionProgress {
  oversubscribedRatio: number
  chartData: AuctionChartDataPoint[]
}

export interface AuctionChartDataPoint {
  hour: number
  value: number
}

export type AuctionChartData = AuctionChartDataPoint[]

export interface DepositInfo {
  status: 'open' | 'closed'
  maxDeposit: number
  currentDeposit: number
  estAllocation: number
  poolAddress: string
  targetRaise: number
  currentRaise: number
}

export interface AuctionTokenInfo {
  name: string
  type: string
  website: string
  description: string
  vestingTerms: string
  auctionMechanism: string
}

export interface VestingStatus {
  title: string
  isOfficial: boolean
  status: 'in_progress' | 'completed' | 'not_started'
  progressPercent: number
  startDate: string
  endDate: string
  unlockRate: string
}

export interface VestingPosition {
  isEligible: boolean
  totalAllocation: number
  unlockedPercent: number
  unlockedAmount: number
  lockedPercent: number
  lockedAmount: number
}

export interface ClaimInfo {
  availableToClaim: number
  tokenSymbol: string
  nextUnlockIn: string
}

export interface VestingChartDataPoint {
  hour: number
  value: number
}

export interface VestingChartData {
  totalTokens: number
  currentProgressHours: number
  totalHours: number
  data: VestingChartDataPoint[]
}

// ============ Mock Data ============

const auctionStats: AuctionStats = {
  title: 'T-SpaceX Liquidity Auction',
  isOfficial: true,
  totalRaised: 142500,
  targetRaise: 58000,
  oversubscribedRatio: 2.46,
  percentageOfTarget: 246,
  status: 'live',
  auctionEndsIn: { hours: 14, minutes: 12, seconds: 30 },
  poolStartsIn: { hours: 14, minutes: 35, seconds: 58 },
}

const auctionPosition: AuctionPosition = {
  isActive: true,
  deposited: 1200,
  estAllocation: 1.22,
  estRefund: 731.03,
}

const auctionValuation: AuctionValuation = {
  fdv: '$800B',
  yoetPrice: 400.0,
}

const auctionProgress: AuctionProgress = {
  oversubscribedRatio: 2.46,
  chartData: [],
}

// Chart data matching Figma design: 11/10 14:00 to 11/11 05:00
// Y-axis: $0k to $190k, target line at $120k (blue dashed)
// Curve starts at ~$40k, rises steeply then flattens near $180k
const auctionChartData: AuctionChartData = [
  // 11/10 14:00 - Start
  { hour: 0, value: 38000 },
  { hour: 0.5, value: 52000 },
  { hour: 1, value: 68000 },
  { hour: 1.5, value: 85000 },
  { hour: 2, value: 100000 },
  { hour: 2.5, value: 112000 },
  // 11/10 17:00 - Crosses target line (~$120k)
  { hour: 3, value: 122000 },
  { hour: 3.5, value: 132000 },
  { hour: 4, value: 140000 },
  { hour: 4.5, value: 148000 },
  { hour: 5, value: 154000 },
  { hour: 5.5, value: 159000 },
  // 11/10 20:00 - Curve starts flattening
  { hour: 6, value: 163000 },
  { hour: 6.5, value: 166000 },
  { hour: 7, value: 168000 },
  { hour: 7.5, value: 170000 },
  { hour: 8, value: 172000 },
  { hour: 8.5, value: 173500 },
  // 11/10 23:00
  { hour: 9, value: 175000 },
  { hour: 9.5, value: 176000 },
  { hour: 10, value: 177000 },
  { hour: 10.5, value: 178000 },
  { hour: 11, value: 179000 },
  { hour: 11.5, value: 179800 },
  // 11/11 02:00
  { hour: 12, value: 180500 },
  { hour: 12.5, value: 181000 },
  { hour: 13, value: 181500 },
  { hour: 13.5, value: 182000 },
  { hour: 14, value: 182300 },
  { hour: 14.5, value: 182500 },
  // 11/11 05:00 - Current (~$183k)
  { hour: 15, value: 183000 },
]

const depositInfo: DepositInfo = {
  status: 'open',
  maxDeposit: 5000,
  currentDeposit: 1200,
  estAllocation: 0.0,
  poolAddress: 'Bu879R...',
  targetRaise: 58000,
  currentRaise: 142500,
}

const tokenInfo: AuctionTokenInfo = {
  name: 'T-SpaceX Token',
  type: 'PRE-IPO DERIVATIVE',
  website: 'https://spacex.com',
  description:
    'TspaceX is a synthetic asset engineered to track the valuation of SpaceX equity in private secondary markets. It provides institutional-grade price exposure to the space economy before public listing.',
  vestingTerms:
    'Tokens claimed from the vault are subject to a 24-hour lockup post-auction to ensure market stability during the initial discovery phase.',
  auctionMechanism:
    'Funds are deposited into a single liquidity bin. The auction runs for a set duration. If oversubscribed, participants receive a pro-rata share based on their contribution share.',
}

const vestingStatus: VestingStatus = {
  title: 'TspaceX Vesting',
  isOfficial: true,
  status: 'in_progress',
  progressPercent: 10,
  startDate: 'Nov 20, 12:00 PM',
  endDate: 'Nov 21, 12:00 PM',
  unlockRate: 'Linear / 24h',
}

const vestingPosition: VestingPosition = {
  isEligible: true,
  totalAllocation: 1.22,
  unlockedPercent: 10,
  unlockedAmount: 0.12,
  lockedPercent: 90,
  lockedAmount: 1.1,
}

const claimInfo: ClaimInfo = {
  availableToClaim: 0.12,
  tokenSymbol: 'TSX',
  nextUnlockIn: '58h 12s',
}

// Vesting chart data matching Figma design
// X-axis: 1h to 24h, Y-axis: 0 to 1.5
// Linear unlock from 0 to 1.22 tokens over 24 hours
// Current progress: ~2.4h (10%)
const vestingChartData: VestingChartData = {
  totalTokens: 1.22,
  currentProgressHours: 2.4, // 10% of 24h
  totalHours: 24,
  data: Array.from({ length: 25 }, (_, i) => ({
    hour: i,
    value: (1.22 / 24) * i,
  })),
}

// ============ API Functions ============

export async function getAuctionStats(): Promise<AuctionStats> {
  const totalRaisedData = await fetchAuctionTotalRaised(AUCTION_POOL)

  if (totalRaisedData) {
    const totalRaised = BigNumber.toNumber(fromHasuraToNative(totalRaisedData.total_raised_amount))
    const targetRaise = auctionStats.targetRaise
    const oversubscribedRatio = targetRaise > 0 ? totalRaised / targetRaise : 0
    const percentageOfTarget = oversubscribedRatio * 100

    return {
      ...auctionStats,
      totalRaised,
      oversubscribedRatio: Math.round(oversubscribedRatio * 100) / 100,
      percentageOfTarget: Math.round(percentageOfTarget),
    }
  }

  return auctionStats
}

export async function getAuctionPosition(): Promise<AuctionPosition> {
  await sleep(300)
  return auctionPosition
}

export async function getAuctionValuation(): Promise<AuctionValuation> {
  await sleep(300)
  return auctionValuation
}

export async function getAuctionProgress(): Promise<AuctionProgress> {
  await sleep(400)
  return auctionProgress
}

export async function getDepositInfo(): Promise<DepositInfo> {
  await sleep(300)
  return depositInfo
}

export async function getAuctionTokenInfo(): Promise<AuctionTokenInfo> {
  await sleep(400)
  return tokenInfo
}

export async function getVestingStatus(): Promise<VestingStatus> {
  await sleep(300)
  return vestingStatus
}

export async function getVestingPosition(): Promise<VestingPosition> {
  await sleep(300)
  return vestingPosition
}

export async function getClaimInfo(): Promise<ClaimInfo> {
  await sleep(300)
  return claimInfo
}

export async function getAuctionChartData(): Promise<AuctionChartData> {
  const events = await fetchAuctionDepositEvents(AUCTION_POOL)

  if (events.length === 0) {
    // Return mock data if no events found
    return auctionChartData
  }

  // Sort events by block_time and calculate cumulative totals
  const sortedEvents = [...events].sort((a, b) => a.block_time - b.block_time)

  // Get the start time (first deposit)
  const startTime = sortedEvents[0].block_time

  // Build cumulative chart data
  let cumulativeTotal = BigNumber.from(0)
  const chartPoints: AuctionChartDataPoint[] = []

  for (const event of sortedEvents) {
    const amount = fromHasuraToNative(event.amount)
    cumulativeTotal = BigNumber.add(cumulativeTotal, amount)

    // Calculate hours since start
    const hoursSinceStart = (event.block_time - startTime) / 3600

    chartPoints.push({
      hour: hoursSinceStart,
      value: BigNumber.toNumber(cumulativeTotal),
    })
  }

  // If we have data points, return them
  if (chartPoints.length > 0) {
    return chartPoints
  }

  // Fallback to mock data
  return auctionChartData
}

export async function getVestingChartData(): Promise<VestingChartData> {
  await sleep(400)
  return vestingChartData
}
