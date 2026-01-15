import { sleep } from './utils'

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

export interface DepositInfo {
  status: 'open' | 'closed'
  maxDeposit: number
  currentDeposit: number
  estAllocation: number
  poolAddress: string
  targetRaise: number
  currentRaise: number
}

export interface TokenInfo {
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
  chartData: [
    { hour: 0, value: 22000 },
    { hour: 1, value: 28000 },
    { hour: 2, value: 38000 },
    { hour: 3, value: 52000 },
    { hour: 4, value: 68000 },
    { hour: 5, value: 85000 },
    { hour: 6, value: 105000 },
    { hour: 7, value: 118000 },
    { hour: 8, value: 128000 },
    { hour: 9, value: 138000 },
    { hour: 10, value: 148000 },
    { hour: 11, value: 158000 },
    { hour: 12, value: 165000 },
    { hour: 13, value: 172000 },
    { hour: 14, value: 178000 },
    { hour: 15, value: 182000 },
  ],
}

const depositInfo: DepositInfo = {
  status: 'open',
  maxDeposit: 5000,
  currentDeposit: 1200,
  estAllocation: 0.0,
  poolAddress: 'Bu879R...',
  targetRaise: 58000,
  currentRaise: 142500,
}

const tokenInfo: TokenInfo = {
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

// ============ API Functions ============

export async function getAuctionStats(): Promise<AuctionStats> {
  await sleep(300)
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

export async function getAuctionTokenInfo(): Promise<TokenInfo> {
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
