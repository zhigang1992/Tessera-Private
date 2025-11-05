/**
 * Admin Migration Types
 *
 * Types for migrating off-chain referral data to on-chain
 */

/**
 * Input: Data fetched from off-chain database
 */
export interface MigrationData {
  referralCodes: ReferralCodeData[]
  traderBindings: TraderBindingData[]
  metadata: {
    exportedAt: string
    totalCodes: number
    totalBindings: number
    dataSource: 'cloudflare-d1' | 'local' | 'api'
  }
}

/**
 * Individual referral code from database
 */
export interface ReferralCodeData {
  code: string // code_slug from referral_codes table
  ownerWallet: string // wallet_address from referral_codes table
  isActive: boolean // status === 'active'
  createdAt: string // ISO timestamp
}

/**
 * Individual trader binding (referral relationship)
 */
export interface TraderBindingData {
  userWallet: string // wallet_address from trader_bindings table
  referralCode: string // code_slug via JOIN with referral_codes
  referrerWallet: string // owner of the referral code
  boundAt: string // ISO timestamp
}

/**
 * Migration configuration
 */
export interface MigrationConfig {
  batchSize: number // Number of items per batch (max 10)
  skipExisting: boolean // Skip codes/users that already exist
}

/**
 * Batch execution state
 */
export interface BatchState {
  status: 'pending' | 'executing' | 'success' | 'failed'
  signature?: string
  error?: string
  timestamp?: string
}

/**
 * Migration progress state
 */
export interface MigrationProgress {
  phase: 'idle' | 'creating-codes' | 'registering-users' | 'completed' | 'failed'
  codesCreated: number
  codesTotal: number
  codesFailed: number
  usersRegistered: number
  usersTotal: number
  usersFailed: number
  currentBatch: number
  totalBatches: number
  estimatedTimeRemaining?: number // in seconds
}

/**
 * Individual transaction result
 */
export interface TransactionResult {
  type: 'code-creation' | 'user-registration'
  status: 'success' | 'failed' | 'pending'
  signature?: string
  error?: string
  timestamp: string
  data: {
    code?: string
    owner?: string
    user?: string
    referralCode?: string
  }
}

/**
 * Migration summary
 */
export interface MigrationSummary {
  startedAt: string
  completedAt?: string
  duration?: number // in seconds

  codes: {
    total: number
    successful: number
    failed: number
    skipped: number
  }

  users: {
    total: number
    successful: number
    failed: number
    skipped: number
  }

  costs: {
    codesRent: number // SOL
    usersRent: number // SOL
    transactionFees: number // SOL
    total: number // SOL
    estimatedUSD?: number
  }

  transactions: TransactionResult[]
}

/**
 * Migration log entry
 */
export interface MigrationLog {
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  timestamp: string
  data?: any
}

/**
 * Cost estimation
 */
export interface CostEstimate {
  codes: {
    count: number
    rentPerCode: number
    totalRent: number
  }
  users: {
    count: number
    rentPerUser: number
    totalRent: number
  }
  transactions: {
    count: number
    feePerTx: number
    totalFees: number
  }
  total: {
    sol: number
    usd?: number
  }
}
