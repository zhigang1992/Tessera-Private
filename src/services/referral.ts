import { sleep } from './utils'

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

export interface ReferralUser {
  id: string
  email: string
  dateJoined: string
  layer: 'L1' | 'L2' | 'L3'
  volume: number
  pointsEarned: number
  rewardEarned: number
  referredBy?: string // referrer's user id
}

// ============ Raw Mock Data (simulating backend raw data) ============

// Raw referral code data
interface RawReferralCode {
  code: string
  createdAt: string
}

const rawReferralCodes: RawReferralCode[] = [
  { code: 'JFHDKSKL9', createdAt: '2025-11-01' },
  { code: 'JFHDKSKL1', createdAt: '2025-11-15' },
  { code: 'JFHDKSKL2', createdAt: '2025-12-01' },
  { code: 'ABCD1234', createdAt: '2025-10-01' },
  { code: 'EFGH5678', createdAt: '2025-10-05' },
  { code: 'IJKL9012', createdAt: '2025-10-10' },
  { code: 'MNOP3456', createdAt: '2025-10-15' },
  { code: 'QRST7890', createdAt: '2025-10-20' },
  { code: 'UVWX1357', createdAt: '2025-10-25' },
  { code: 'YZAB2468', createdAt: '2025-10-28' },
  { code: 'CDEF3691', createdAt: '2025-11-02' },
  { code: 'GHIJ4820', createdAt: '2025-11-05' },
]

// Raw user data - includes referral relationships
const rawUsers: ReferralUser[] = [
  // JFHDKSKL9's L1 users
  { id: 'u1', email: 'm****@hotmail.com', dateJoined: 'Dec 12, 2025', layer: 'L1', volume: 50000, pointsEarned: 120, rewardEarned: 0.5 },
  { id: 'u2', email: 'a****@gmail.com', dateJoined: 'Dec 10, 2025', layer: 'L1', volume: 80000, pointsEarned: 200, rewardEarned: 0.8 },
  { id: 'u3', email: 'b****@yahoo.com', dateJoined: 'Dec 8, 2025', layer: 'L1', volume: 120000, pointsEarned: 300, rewardEarned: 1.2 },
  // JFHDKSKL9's L2 users (referred by u1, u2)
  { id: 'u4', email: 'c****@outlook.com', dateJoined: 'Dec 14, 2025', layer: 'L2', volume: 30000, pointsEarned: 60, rewardEarned: 0.3, referredBy: 'u1' },
  { id: 'u5', email: 'd****@gmail.com', dateJoined: 'Dec 15, 2025', layer: 'L2', volume: 45000, pointsEarned: 90, rewardEarned: 0.45, referredBy: 'u2' },
  // JFHDKSKL9's L3 users (referred by u4)
  { id: 'u6', email: 'e****@icloud.com', dateJoined: 'Dec 16, 2025', layer: 'L3', volume: 20000, pointsEarned: 30, rewardEarned: 0.2, referredBy: 'u4' },

  // JFHDKSKL1's users
  { id: 'u7', email: 'f****@gmail.com', dateJoined: 'Dec 5, 2025', layer: 'L1', volume: 200000, pointsEarned: 500, rewardEarned: 2.0 },
  { id: 'u8', email: 'g****@hotmail.com', dateJoined: 'Dec 7, 2025', layer: 'L1', volume: 150000, pointsEarned: 375, rewardEarned: 1.5 },
  { id: 'u9', email: 'h****@yahoo.com', dateJoined: 'Dec 10, 2025', layer: 'L2', volume: 60000, pointsEarned: 120, rewardEarned: 0.6, referredBy: 'u7' },
  { id: 'u10', email: 'i****@gmail.com', dateJoined: 'Dec 12, 2025', layer: 'L2', volume: 40000, pointsEarned: 80, rewardEarned: 0.4, referredBy: 'u8' },
  { id: 'u11', email: 'j****@outlook.com', dateJoined: 'Dec 14, 2025', layer: 'L3', volume: 25000, pointsEarned: 40, rewardEarned: 0.25, referredBy: 'u9' },

  // JFHDKSKL2's users
  { id: 'u12', email: 'k****@gmail.com', dateJoined: 'Dec 10, 2025', layer: 'L1', volume: 100000, pointsEarned: 250, rewardEarned: 1.0 },
  { id: 'u13', email: 'l****@hotmail.com', dateJoined: 'Dec 12, 2025', layer: 'L2', volume: 35000, pointsEarned: 70, rewardEarned: 0.35, referredBy: 'u12' },

  // ABCD1234's users
  { id: 'u14', email: 'n****@gmail.com', dateJoined: 'Oct 5, 2025', layer: 'L1', volume: 75000, pointsEarned: 180, rewardEarned: 0.75 },
  { id: 'u15', email: 'o****@yahoo.com', dateJoined: 'Oct 8, 2025', layer: 'L1', volume: 55000, pointsEarned: 130, rewardEarned: 0.55 },

  // EFGH5678's users
  { id: 'u16', email: 'p****@outlook.com', dateJoined: 'Oct 10, 2025', layer: 'L1', volume: 90000, pointsEarned: 220, rewardEarned: 0.9 },
  { id: 'u17', email: 'q****@gmail.com', dateJoined: 'Oct 12, 2025', layer: 'L2', volume: 25000, pointsEarned: 50, rewardEarned: 0.25, referredBy: 'u16' },

  // IJKL9012's users
  { id: 'u18', email: 'r****@hotmail.com', dateJoined: 'Oct 15, 2025', layer: 'L1', volume: 110000, pointsEarned: 275, rewardEarned: 1.1 },

  // MNOP3456's users
  { id: 'u19', email: 's****@gmail.com', dateJoined: 'Oct 18, 2025', layer: 'L1', volume: 65000, pointsEarned: 160, rewardEarned: 0.65 },
  { id: 'u20', email: 't****@yahoo.com', dateJoined: 'Oct 20, 2025', layer: 'L1', volume: 85000, pointsEarned: 210, rewardEarned: 0.85 },
  { id: 'u21', email: 'u****@outlook.com', dateJoined: 'Oct 22, 2025', layer: 'L2', volume: 30000, pointsEarned: 60, rewardEarned: 0.3, referredBy: 'u19' },

  // QRST7890's users
  { id: 'u22', email: 'v****@gmail.com', dateJoined: 'Oct 25, 2025', layer: 'L1', volume: 95000, pointsEarned: 240, rewardEarned: 0.95 },

  // UVWX1357's users
  { id: 'u23', email: 'w****@hotmail.com', dateJoined: 'Oct 28, 2025', layer: 'L1', volume: 70000, pointsEarned: 175, rewardEarned: 0.7 },
  { id: 'u24', email: 'x****@yahoo.com', dateJoined: 'Oct 30, 2025', layer: 'L2', volume: 35000, pointsEarned: 85, rewardEarned: 0.35, referredBy: 'u23' },
  { id: 'u25', email: 'y****@gmail.com', dateJoined: 'Nov 1, 2025', layer: 'L3', volume: 15000, pointsEarned: 30, rewardEarned: 0.15, referredBy: 'u24' },

  // YZAB2468's users
  { id: 'u26', email: 'z****@outlook.com', dateJoined: 'Nov 2, 2025', layer: 'L1', volume: 125000, pointsEarned: 310, rewardEarned: 1.25 },

  // CDEF3691's users
  { id: 'u27', email: 'aa***@gmail.com', dateJoined: 'Nov 5, 2025', layer: 'L1', volume: 60000, pointsEarned: 150, rewardEarned: 0.6 },
  { id: 'u28', email: 'bb***@yahoo.com', dateJoined: 'Nov 7, 2025', layer: 'L1', volume: 45000, pointsEarned: 110, rewardEarned: 0.45 },

  // GHIJ4820's users
  { id: 'u29', email: 'cc***@hotmail.com', dateJoined: 'Nov 8, 2025', layer: 'L1', volume: 80000, pointsEarned: 200, rewardEarned: 0.8 },
  { id: 'u30', email: 'dd***@gmail.com', dateJoined: 'Nov 10, 2025', layer: 'L2', volume: 40000, pointsEarned: 100, rewardEarned: 0.4, referredBy: 'u29' },
]

// Mapping between referral codes and users
const codeUserMapping: Record<string, string[]> = {
  JFHDKSKL9: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
  JFHDKSKL1: ['u7', 'u8', 'u9', 'u10', 'u11'],
  JFHDKSKL2: ['u12', 'u13'],
  ABCD1234: ['u14', 'u15'],
  EFGH5678: ['u16', 'u17'],
  IJKL9012: ['u18'],
  MNOP3456: ['u19', 'u20', 'u21'],
  QRST7890: ['u22'],
  UVWX1357: ['u23', 'u24', 'u25'],
  YZAB2468: ['u26'],
  CDEF3691: ['u27', 'u28'],
  GHIJ4820: ['u29', 'u30'],
}

// ============ Helper Functions (calculation logic) ============

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatSOL(value: number): string {
  return `${value.toFixed(2)} SOL`
}

function getUsersByCode(code: string): ReferralUser[] {
  const userIds = codeUserMapping[code] || []
  return rawUsers.filter((u) => userIds.includes(u.id))
}

function calculateCodeStats(code: string): ReferralCode {
  const users = getUsersByCode(code)
  const totalVolume = users.reduce((sum, u) => sum + u.volume, 0)
  const totalRewards = users.reduce((sum, u) => sum + u.rewardEarned, 0)

  return {
    code,
    totalVolume,
    tradersReferred: users.length,
    totalRewards,
  }
}

function calculateTraderLayers(): TraderLayer[] {
  const layers: Record<string, { count: number; points: number }> = {
    L1: { count: 0, points: 0 },
    L2: { count: 0, points: 0 },
    L3: { count: 0, points: 0 },
  }

  rawUsers.forEach((user) => {
    layers[user.layer].count++
    layers[user.layer].points += user.pointsEarned
  })

  return Object.entries(layers).map(([layer, data]) => ({
    layer,
    tradersReferred: data.count,
    points: data.points,
  }))
}

function calculateRewardsOverview(): RewardsData {
  const totalRewards = rawUsers.reduce((sum, u) => sum + u.rewardEarned, 0)
  const totalPoints = rawUsers.reduce((sum, u) => sum + u.pointsEarned, 0)

  return {
    rewards: totalRewards,
    referralPoints: totalPoints,
  }
}

// ============ API Functions ============

export async function getRewardsOverview(): Promise<RewardsData> {
  await sleep(500)
  return calculateRewardsOverview()
}

export async function getTraderLayers(): Promise<TraderLayer[]> {
  await sleep(600)
  return calculateTraderLayers()
}

export async function getReferralCodes(): Promise<ReferralCode[]> {
  await sleep(400)
  return rawReferralCodes.map((rc) => calculateCodeStats(rc.code))
}

export async function getReferralUsersByCode(code: string): Promise<ReferralUser[]> {
  await sleep(300)
  return getUsersByCode(code)
}

export async function createReferralCode(): Promise<ReferralCode> {
  await sleep(800)
  const newCode = `CODE${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  return {
    code: newCode,
    totalVolume: 0,
    tradersReferred: 0,
    totalRewards: 0,
  }
}

export async function deleteReferralCode(code: string): Promise<boolean> {
  await sleep(300)
  console.log(`Deleting code: ${code}`)
  return true
}

// ============ Export Helper Functions (for formatting in components) ============

export { formatCurrency, formatSOL }
