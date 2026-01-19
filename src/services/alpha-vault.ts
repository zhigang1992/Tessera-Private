/**
 * Alpha Vault Service
 *
 * Integrates with Meteora's Alpha Vault SDK to provide:
 * - Vault state management
 * - Deposit/withdraw operations
 * - Claim token operations
 * - Escrow information
 *
 * Uses the deployed Alpha Vault on Devnet for TESS token launch.
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import AlphaVault, { VaultState as SdkVaultState, VaultMode as SdkVaultMode, type DepositWithProofParams } from '@meteora-ag/alpha-vault'
import BN from 'bn.js'
import { getRpcEndpoint } from '@/lib/solana/config'
import { estimateSlotDate } from './alpha-vault-helpers'

// ============ Configuration ============

/**
 * Alpha Vault Deployment Configuration
 * From the Token-2022 deployment summary
 */
export const ALPHA_VAULT_CONFIG = {
  // Vault address
  vault: 'B6sWUco8k3JRG3e8Y2XGXiFJBx7otS4rWAQXsL5QLn1F',

  // DLMM Pool
  dlmmPool: '4547V8RiCQNeRLmQtnCVkjWVBFQiVC2vBgWy2UPGS1tY',
  poolActivationSlot: 436450109,

  // Token addresses
  tessToken: '767VPk2vEyV8ujBQBJNsxewzdQZCna3sBpx2sfc7KcRj', // Token-2022
  usdcToken: '38Pfqg4F9YBTyzGxSY2WBih49ECuY7fivZqUh9vhfrfu', // Standard SPL

  // Token badge for verification
  tokenBadge: 'BxS7zDoBrtdQHL1YDozfs88kCZvWo9gcAoNiEqRkqf6y',

  // Merkle root config for whitelisted wallets (v1)
  merkleRootConfig: 'Hg1YrUWstdC65iMHnDdv2iBAJoi2zyDgcKWnDLdcyPtu',
  whitelistedWallets: 7,

  // View on Meteora
  meteoraUrl: 'https://devnet.app.meteora.ag/vault/B6sWUco8k3JRG3e8Y2XGXiFJBx7otS4rWAQXsL5QLn1F',

  // Token decimals
  tessDecimals: 6,
  usdcDecimals: 6,
} as const

// ============ Types ============

export type VaultMode = 'fcfs' | 'prorata'

export type VaultStateType =
  | 'deposit_open'
  | 'deposit_closed'
  | 'vesting'
  | 'vesting_complete'
  | 'cancelled'

export interface VaultInfo {
  address: string
  mode: VaultMode
  state: VaultStateType
  // Timing
  depositOpenSlot: number
  depositCloseSlot: number
  vestingStartSlot: number
  vestingEndSlot: number
  activationPoint: number
  // Amounts
  totalDeposited: string
  maxCap: string
  maxIndividualDeposit: string
  // Calculated
  isOversubscribed: boolean
  oversubscriptionRatio: number
  // Timestamps (estimated from slots)
  depositOpenTime: Date | null
  depositCloseTime: Date | null
  vestingStartTime: Date | null
  vestingEndTime: Date | null
}

export interface EscrowInfo {
  address: string
  owner: string
  totalDeposited: string
  claimedAmount: string
  // Calculated allocation (for prorata mode)
  estimatedAllocation: string
  estimatedRefund: string
  // Claimable now
  availableToClaim: string
  // Vesting progress
  vestingProgress: number
}

export interface DepositQuota {
  maxDeposit: string
  remainingQuota: string
  canDeposit: boolean
  reason?: string
}

export interface AlphaVaultClaimInfo {
  totalAllocation: string
  totalClaimed: string
  availableToClaim: string
  lockedAmount: string
  vestingProgress: number
  nextUnlockTime: Date | null
}

// ============ Temporary Hardcoded Merkle Proofs ============
// TODO: Remove once Meteora's worker-dev API has the whitelist data synced

/**
 * Hardcoded merkle proofs for whitelisted wallets
 * This is a temporary workaround while the Meteora API syncs
 */
const HARDCODED_MERKLE_PROOFS: Record<string, { proof: string[]; maxCap: string }> = {
  // Kyle's wallet - 10,000 USDC cap
  'Hzu1F1HF9ZEd7ezokS6ePUP5gP3p1UkdnoU7rKYS2xPu': {
    proof: [
      '5e60840cf6ad418fa3b5fdf1c3fad1f686be678d37fdcfe8d5dfd418a689ded3',
      'c12af0d171c26f20c39e27cae747641277a4c20923793f21788aeb957bc2991a',
      'cd9be9d4714936ca124cdb7918e74f6d07ef5649ebd67d7f260ebbf038027958',
    ],
    maxCap: '10000000000', // 10,000 USDC (6 decimals)
  },
}

function getHardcodedMerkleProof(wallet: string): DepositWithProofParams | null {
  const data = HARDCODED_MERKLE_PROOFS[wallet]
  if (!data) return null

  return {
    merkleRootConfig: new PublicKey(ALPHA_VAULT_CONFIG.merkleRootConfig),
    maxCap: new BN(data.maxCap),
    proof: data.proof,
  }
}

// ============ Helper to map SDK types to our types ============

function mapSdkVaultState(sdkState: SdkVaultState): VaultStateType {
  switch (sdkState) {
    case SdkVaultState.PREPARING:
    case SdkVaultState.DEPOSITING:
      return 'deposit_open'
    case SdkVaultState.PURCHASING:
    case SdkVaultState.LOCKING:
      return 'deposit_closed'
    case SdkVaultState.VESTING:
      return 'vesting'
    case SdkVaultState.ENDED:
      return 'vesting_complete'
    default:
      return 'deposit_open'
  }
}

function mapSdkVaultMode(sdkMode: SdkVaultMode): VaultMode {
  switch (sdkMode) {
    case SdkVaultMode.PRORATA:
      return 'prorata'
    case SdkVaultMode.FCFS:
      return 'fcfs'
    default:
      return 'fcfs'
  }
}

// ============ Alpha Vault Client ============

// Type for the AlphaVault instance
type AlphaVaultInstance = Awaited<ReturnType<typeof AlphaVault.create>>

export class AlphaVaultClient {
  private connection: Connection
  private vaultInstance: AlphaVaultInstance | null = null
  private vaultAddress: PublicKey

  constructor(
    connection?: Connection,
    vaultAddress: string = ALPHA_VAULT_CONFIG.vault
  ) {
    this.connection = connection || new Connection(getRpcEndpoint(), 'confirmed')
    this.vaultAddress = new PublicKey(vaultAddress)
  }

  /**
   * Initialize the Alpha Vault instance
   */
  async initialize(): Promise<AlphaVaultInstance> {
    if (!this.vaultInstance) {
      this.vaultInstance = await AlphaVault.create(this.connection, this.vaultAddress, {
        cluster: 'devnet',
      })
    }
    return this.vaultInstance
  }

  /**
   * Get current vault information
   */
  async getVaultInfo(): Promise<VaultInfo> {
    const vault = await this.initialize()

    const vaultData = vault.vault
    const mode = mapSdkVaultMode(vault.mode)
    const sdkState = vault.vaultState
    const state = mapSdkVaultState(sdkState)

    // Get current slot for time estimation
    const currentSlot = await this.connection.getSlot()

    // Extract vault configuration - use any to handle SDK type variations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vaultDataAny = vaultData as any
    const depositOpenSlot = vaultDataAny.depositingPoint?.toNumber() ?? 0
    const depositCloseSlot = vaultDataAny.startVestingPoint?.toNumber() ?? 0
    const vestingStartSlot = vaultDataAny.startVestingPoint?.toNumber() ?? 0
    const vestingEndSlot = vaultDataAny.endVestingPoint?.toNumber() ?? 0
    const activationPoint = vault.activationPoint?.toNumber() ?? 0

    // Calculate amounts
    const totalDeposited = vaultDataAny.totalDeposit?.toString() ?? '0'
    const maxCap = vaultDataAny.maxDepositingCap?.toString() ?? '0'
    const maxIndividualDeposit = vaultDataAny.individualDepositingCap?.toString() ?? '0'

    // Calculate oversubscription
    const totalDepositedNum = parseFloat(totalDeposited) / 10 ** ALPHA_VAULT_CONFIG.usdcDecimals
    const maxCapNum = parseFloat(maxCap) / 10 ** ALPHA_VAULT_CONFIG.usdcDecimals
    const isOversubscribed = maxCapNum > 0 && totalDepositedNum > maxCapNum
    const oversubscriptionRatio = maxCapNum > 0 ? totalDepositedNum / maxCapNum : 0

    // Estimate times from slots
    const estimateTime = (slot: number) => estimateSlotDate(currentSlot, slot)

    return {
      address: this.vaultAddress.toBase58(),
      mode,
      state,
      depositOpenSlot,
      depositCloseSlot,
      vestingStartSlot,
      vestingEndSlot,
      activationPoint,
      totalDeposited,
      maxCap,
      maxIndividualDeposit,
      isOversubscribed,
      oversubscriptionRatio,
      depositOpenTime: estimateTime(depositOpenSlot),
      depositCloseTime: estimateTime(depositCloseSlot),
      vestingStartTime: estimateTime(vestingStartSlot),
      vestingEndTime: estimateTime(vestingEndSlot),
    }
  }

  /**
   * Get escrow information for a specific owner
   */
  async getEscrowInfo(owner: PublicKey): Promise<EscrowInfo | null> {
    const vault = await this.initialize()

    try {
      const escrow = await vault.getEscrow(owner)
      if (!escrow) return null

      // Get claim info for available amounts
      const claimInfo = vault.getClaimInfo(escrow)

      const totalDeposited = escrow.totalDeposit?.toString() ?? '0'
      const claimedAmount = escrow.claimedToken?.toString() ?? '0'

      // Calculate allocation and refund for prorata mode
      const vaultInfo = await this.getVaultInfo()
      let estimatedAllocation = '0'
      let estimatedRefund = '0'

      if (vaultInfo.mode === 'prorata' && vaultInfo.isOversubscribed) {
        const depositNum = parseFloat(totalDeposited) / 10 ** ALPHA_VAULT_CONFIG.usdcDecimals
        const allocationRatio = 1 / vaultInfo.oversubscriptionRatio
        const allocatedUsdc = depositNum * allocationRatio
        estimatedAllocation = (allocatedUsdc * allocationRatio).toFixed(6)
        estimatedRefund = ((depositNum - allocatedUsdc) * 10 ** ALPHA_VAULT_CONFIG.usdcDecimals).toFixed(0)
      }

      const availableToClaim = claimInfo?.totalClaimable?.toString() ?? '0'

      // Calculate vesting progress
      const totalAllocation = claimInfo?.totalAllocated?.toString() ?? '0'
      const totalClaimed = parseFloat(claimedAmount)
      const totalAllocationNum = parseFloat(totalAllocation)
      const vestingProgress = totalAllocationNum > 0
        ? (totalClaimed / totalAllocationNum) * 100
        : 0

      return {
        address: '',
        owner: owner.toBase58(),
        totalDeposited,
        claimedAmount,
        estimatedAllocation,
        estimatedRefund,
        availableToClaim,
        vestingProgress,
      }
    } catch {
      return null
    }
  }

  /**
   * Get available deposit quota for a user
   * For permissioned vaults, merkle proof is required to get the correct quota
   */
  async getDepositQuota(owner: PublicKey): Promise<DepositQuota> {
    const vault = await this.initialize()

    try {
      const escrow = await vault.getEscrow(owner)

      // For permissioned vaults, we need to fetch the merkle proof to get correct quota
      let merkleProof: DepositWithProofParams | null = null

      // TODO: Temporarily use hardcoded proof while Meteora API syncs
      // Once Meteora's worker-dev API has the whitelist data, remove this and use SDK method
      const hardcodedProof = getHardcodedMerkleProof(owner.toBase58())
      if (hardcodedProof) {
        console.log('[AlphaVault] Using hardcoded merkle proof for:', owner.toBase58())
        merkleProof = hardcodedProof
      } else {
        // Fallback to SDK method (will call Meteora API)
        try {
          console.log('[AlphaVault] Fetching merkle proof from API for:', owner.toBase58())
          merkleProof = await vault.getMerkleProofForDeposit(owner)
          console.log('[AlphaVault] Merkle proof received:', merkleProof ? 'yes' : 'no')
        } catch (proofErr) {
          // If no merkle proof available, user might not be whitelisted
          console.log('[AlphaVault] Merkle proof fetch failed:', proofErr)
        }
      }

      const quota = vault.getAvailableDepositQuota(escrow, merkleProof ?? undefined)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vaultData = vault.vault as any
      const maxDeposit = vaultData.individualDepositingCap?.toString() ?? '0'
      const remainingQuota = quota?.toString() ?? '0'

      const canDeposit = parseFloat(remainingQuota) > 0

      // Determine reason if can't deposit
      let reason: string | undefined
      if (!canDeposit) {
        if (!merkleProof) {
          reason = 'Wallet not whitelisted'
        } else {
          reason = 'Deposit quota exhausted'
        }
      }

      return {
        maxDeposit,
        remainingQuota,
        canDeposit,
        reason,
      }
    } catch (err) {
      console.error('getDepositQuota error:', err)
      return {
        maxDeposit: '0',
        remainingQuota: '0',
        canDeposit: false,
        reason: 'Unable to fetch deposit quota',
      }
    }
  }

  /**
   * Get detailed claim information
   */
  async getClaimInfoForOwner(owner: PublicKey): Promise<AlphaVaultClaimInfo | null> {
    const vault = await this.initialize()

    try {
      const escrow = await vault.getEscrow(owner)
      if (!escrow) return null

      const claimInfo = vault.getClaimInfo(escrow)
      if (!claimInfo) return null

      const totalAllocation = claimInfo.totalAllocated?.toString() ?? '0'
      const totalClaimed = escrow.claimedToken?.toString() ?? '0'
      const availableToClaim = claimInfo.totalClaimable?.toString() ?? '0'

      const totalAllocationNum = parseFloat(totalAllocation)
      const totalClaimedNum = parseFloat(totalClaimed)
      const availableNum = parseFloat(availableToClaim)
      const lockedAmount = Math.max(0, totalAllocationNum - totalClaimedNum - availableNum).toFixed(0)

      const vestingProgress = totalAllocationNum > 0
        ? ((totalClaimedNum + availableNum) / totalAllocationNum) * 100
        : 0

      // Estimate next unlock time
      const vaultInfo = await this.getVaultInfo()
      const currentSlot = await this.connection.getSlot()
      const nextUnlockTime = vaultInfo.vestingEndSlot > currentSlot
        ? estimateSlotDate(currentSlot, vaultInfo.vestingEndSlot)
        : null

      return {
        totalAllocation,
        totalClaimed,
        availableToClaim,
        lockedAmount,
        vestingProgress,
        nextUnlockTime,
      }
    } catch {
      return null
    }
  }

  /**
   * Create deposit transaction
   * Note: For permissioned vaults with merkle proof, additional proof data is required
   */
  async createDepositTransaction(
    owner: PublicKey,
    amount: BN,
    merkleProof?: DepositWithProofParams
  ): Promise<Transaction> {
    const vault = await this.initialize()

    const tx = await vault.deposit(amount, owner, merkleProof)

    return tx
  }

  /**
   * Create withdraw transaction (only available during deposit phase in prorata mode)
   */
  async createWithdrawTransaction(
    owner: PublicKey,
    amount: BN
  ): Promise<Transaction> {
    const vault = await this.initialize()

    const tx = await vault.withdraw(amount, owner)

    return tx
  }

  /**
   * Create claim token transaction
   */
  async createClaimTransaction(owner: PublicKey): Promise<Transaction> {
    const vault = await this.initialize()

    const tx = await vault.claimToken(owner)

    return tx
  }

  /**
   * Create withdraw remaining quote transaction (for refunds in prorata mode)
   */
  async createWithdrawRemainingTransaction(owner: PublicKey): Promise<Transaction> {
    const vault = await this.initialize()

    const tx = await vault.withdrawRemainingQuote(owner)

    return tx
  }

  /**
   * Get merkle proof for a whitelisted user
   * This requires the vault to have a merkle proof metadata URL set
   */
  async getMerkleProof(owner: PublicKey): Promise<DepositWithProofParams | null> {
    // TODO: Temporarily use hardcoded proof while Meteora API syncs
    const hardcodedProof = getHardcodedMerkleProof(owner.toBase58())
    if (hardcodedProof) {
      return hardcodedProof
    }

    // Fallback to SDK method
    const vault = await this.initialize()
    try {
      const proof = await vault.getMerkleProofForDeposit(owner)
      return proof
    } catch {
      return null
    }
  }

  /**
   * Refresh vault state from chain
   */
  async refreshState(): Promise<void> {
    // Re-initialize to get fresh state
    this.vaultInstance = null
    await this.initialize()
  }

  /**
   * Get the underlying AlphaVault instance for advanced operations
   */
  getVaultInstance(): AlphaVaultInstance | null {
    return this.vaultInstance
  }
}

// ============ Singleton Instance ============

let alphaVaultClient: AlphaVaultClient | null = null

export function getAlphaVaultClient(connection?: Connection): AlphaVaultClient {
  if (!alphaVaultClient) {
    alphaVaultClient = new AlphaVaultClient(connection)
  }
  return alphaVaultClient
}

// ============ Utility Functions ============

/**
 * Format vault amount to human readable string
 */
export function formatVaultAmount(
  amount: string | BN,
  decimals: number = ALPHA_VAULT_CONFIG.usdcDecimals
): string {
  const amountStr = amount instanceof BN ? amount.toString() : amount
  const num = parseFloat(amountStr) / 10 ** decimals
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

/**
 * Parse human readable amount to BN
 */
export function parseVaultAmount(
  amount: string,
  decimals: number = ALPHA_VAULT_CONFIG.usdcDecimals
): BN {
  const [intPart, decPart = ''] = amount.split('.')
  const paddedDec = decPart.padEnd(decimals, '0').slice(0, decimals)
  const fullAmount = intPart + paddedDec
  return new BN(fullAmount)
}

/**
 * Get vault state display text
 */
export function getVaultStateDisplay(state: VaultStateType): {
  label: string
  color: string
} {
  switch (state) {
    case 'deposit_open':
      return { label: 'LIVE', color: '#06a800' }
    case 'deposit_closed':
      return { label: 'CLOSED', color: '#f59e0b' }
    case 'vesting':
      return { label: 'VESTING', color: '#3b82f6' }
    case 'vesting_complete':
      return { label: 'COMPLETE', color: '#10b981' }
    case 'cancelled':
      return { label: 'CANCELLED', color: '#ef4444' }
    default:
      return { label: 'UNKNOWN', color: '#6b7280' }
  }
}

/**
 * Calculate time remaining until a specific slot
 */
export async function getTimeUntilSlot(
  connection: Connection,
  targetSlot: number
): Promise<{ hours: number; minutes: number; seconds: number } | null> {
  const currentSlot = await connection.getSlot()
  if (targetSlot <= currentSlot) return null

  const slotsRemaining = targetSlot - currentSlot
  // Approximate: 400ms per slot = 2.5 slots per second
  const secondsRemaining = slotsRemaining / 2.5

  const hours = Math.floor(secondsRemaining / 3600)
  const minutes = Math.floor((secondsRemaining % 3600) / 60)
  const seconds = Math.floor(secondsRemaining % 60)

  return { hours, minutes, seconds }
}
