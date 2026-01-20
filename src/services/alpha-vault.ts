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
import DLMM from '@meteora-ag/dlmm'
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
  vault: '6fwBYbM4e1NTwndKRdKyAZWSL5ohkgYsHkkYTtCZW6TM',

  // DLMM Pool
  dlmmPool: 'Dd6kCyHuaLStsXRnBpCXpDcLKhDud1VCS3rJjQ1cZnky',

  // Token addresses
  tessToken: '767VPk2vEyV8ujBQBJNsxewzdQZCna3sBpx2sfc7KcRj', // Token-2022
  usdcToken: 'ELFPGFJCALgJ12oAoLTyzPVxKEmKNFRz7GxMbQftpdzE', // Devnet USDC

  // Merkle root config for whitelisted wallets (version 0 - using Meteora's BalanceTree)
  merkleRootConfig: '83oewKfgQkGqGMmAKxJUF4rZLyQprM2Xwzym2DAPnmmF',

  // View on Meteora
  meteoraUrl: 'https://devnet.app.meteora.ag/vault/6fwBYbM4e1NTwndKRdKyAZWSL5ohkgYsHkkYTtCZW6TM',

  // Token decimals
  tessDecimals: 6,
  usdcDecimals: 6,
} as const

/**
 * Local merkle proofs for whitelisted wallets
 * Generated using Meteora's BalanceTree from @meteora-ag/alpha-vault
 * These are used because Meteora's API doesn't have our custom whitelist proofs
 */
export const LOCAL_MERKLE_PROOFS: Record<string, { proof: string[]; maxCap: string }> = {
  'Hg1YrUWstdC65iMHnDdv2iBAJoi2zyDgcKWnDLdcyPtu': {
    proof: [
      '5e096bb18896ee9008efae23165be20a53144e8e321da839ca7658f5fda85713',
      'bf1be92705411da7b569867376466352341c2fa3da0117a4fb89f8a4aa11ee3a',
      'f1a55e6facdfb92eeea5930b5e67f2def16ad9b2f36f36489ba42758292f2d7e',
    ],
    maxCap: '10000000000',
  },
  'Hzu1F1HF9ZEd7ezokS6ePUP5gP3p1UkdnoU7rKYS2xPu': {
    proof: [
      'bda2d70ee9047728d171335cd979871d17fb0b88ba92a038e65c147955fe6ad4',
      'c4a27535958110a9c730304ce1d7e8ba902c9f50f862e2add6a2393f75ce85ef',
      '7c61303308de99f00d3501fc2af18a17b12c40e262ef2fa55332fb595f063557',
    ],
    maxCap: '10000000000',
  },
  '9KjD5Gm8FufT2i9Lf4XYaxqaRXSVbqA7M1qcEY9CCNcq': {
    proof: [
      '7849a2d6ff3add9ae59551ae229a7c58a538e4eb694c65b0153db3c8c4eca1ad',
      'c4a27535958110a9c730304ce1d7e8ba902c9f50f862e2add6a2393f75ce85ef',
      '7c61303308de99f00d3501fc2af18a17b12c40e262ef2fa55332fb595f063557',
    ],
    maxCap: '1000000000',
  },
  '83ysBV2FDx8jrue3kyysHmvsi97A4HsxdxuYnG5hjFXr': {
    proof: [
      '031b10c525b01d98d40d0332348d7e18f59280f5d3a66d038b4e2942570216ad',
      '7c61303308de99f00d3501fc2af18a17b12c40e262ef2fa55332fb595f063557',
    ],
    maxCap: '1000000000',
  },
  'DggQxEHkKEDk5SV8U5s8UUHLQJfX8UAdzF8ReGxRCQra': {
    proof: [
      '34d847d7cef22f2be06111d3e3c799b628dc7c9f43ed599bc9b7b70a8d495333',
      'a2e7748e4c9a04d1b5713f955098b16d764b31e11568d2c29d5f9bc20d0065d9',
      'f1a55e6facdfb92eeea5930b5e67f2def16ad9b2f36f36489ba42758292f2d7e',
    ],
    maxCap: '1000000000',
  },
  'BsKe2xMv3Lnb3tBse23jUcnJBerBTzdTCqe6EZ4YtZco': {
    proof: [
      '6a22346856b05e74908de8e6bb22b69a266938919d7c8043de3c472a4d0cc9b5',
      'bf1be92705411da7b569867376466352341c2fa3da0117a4fb89f8a4aa11ee3a',
      'f1a55e6facdfb92eeea5930b5e67f2def16ad9b2f36f36489ba42758292f2d7e',
    ],
    maxCap: '1000000000',
  },
  'BY8VLftdzQUKMFmc3t42XNufktmDLornLhDvMbFXxrwM': {
    proof: [
      '4a5d9f896e81deee6560c807c5943b801a2fd8b88fbd963561e48f15c9202cec',
      'a2e7748e4c9a04d1b5713f955098b16d764b31e11568d2c29d5f9bc20d0065d9',
      'f1a55e6facdfb92eeea5930b5e67f2def16ad9b2f36f36489ba42758292f2d7e',
    ],
    maxCap: '1000000000',
  },
}

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
  vestingDurationHours: number // Calculated from on-chain slots
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
    // For Pro Rata vaults, maxBuyingCap is the target raise (max USDC the vault will spend)
    // maxDepositingCap is 0 for unlimited deposits in Pro Rata mode
    const maxCap = vaultDataAny.maxBuyingCap?.toString() ?? vaultDataAny.maxDepositingCap?.toString() ?? '0'
    const maxIndividualDeposit = vaultDataAny.individualDepositingCap?.toString() ?? '0'

    // Calculate oversubscription
    const totalDepositedNum = parseFloat(totalDeposited) / 10 ** ALPHA_VAULT_CONFIG.usdcDecimals
    const maxCapNum = parseFloat(maxCap) / 10 ** ALPHA_VAULT_CONFIG.usdcDecimals
    const isOversubscribed = maxCapNum > 0 && totalDepositedNum > maxCapNum
    const oversubscriptionRatio = maxCapNum > 0 ? totalDepositedNum / maxCapNum : 0

    // Calculate vesting duration from on-chain slots
    // Approximate: 400ms per slot = 2.5 slots per second
    const vestingDurationSlots = vestingEndSlot - vestingStartSlot
    const vestingDurationSeconds = vestingDurationSlots / 2.5
    const vestingDurationHours = Math.round(vestingDurationSeconds / 3600)

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
      vestingDurationHours,
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vaultData = vault.vault as any
      const boughtToken = parseFloat(vaultData.boughtToken?.toString() ?? '0')

      if (boughtToken > 0) {
        // Vault has already bought tokens - use actual allocation from claimInfo
        estimatedAllocation = claimInfo?.totalAllocated?.toString() ?? '0'
      } else if (vaultInfo.mode === 'prorata') {
        // During deposit period, estimate based on pool liquidity
        const tessAvailable = await this.getPoolTessReserve()
        const userDepositNum = parseFloat(totalDeposited) / 10 ** ALPHA_VAULT_CONFIG.usdcDecimals
        const totalDepositsNum = parseFloat(vaultInfo.totalDeposited) / 10 ** ALPHA_VAULT_CONFIG.usdcDecimals
        const maxCapNum = parseFloat(vaultInfo.maxCap) / 10 ** ALPHA_VAULT_CONFIG.usdcDecimals

        if (totalDepositsNum > 0) {
          // User's share of deposits
          const userShare = userDepositNum / totalDepositsNum

          // Effective USDC that will be used (capped by maxBuyingCap)
          const effectiveUsdc = Math.min(totalDepositsNum, maxCapNum)

          // Estimate TESS allocation based on available pool liquidity
          // The vault buys at pool price (currently 1:1)
          const estimatedTessForVault = Math.min(tessAvailable, effectiveUsdc)
          const userTessAllocation = userShare * estimatedTessForVault

          estimatedAllocation = (userTessAllocation * 10 ** ALPHA_VAULT_CONFIG.tessDecimals).toFixed(0)

          // Calculate refund if oversubscribed
          if (totalDepositsNum > maxCapNum) {
            const usedRatio = maxCapNum / totalDepositsNum
            const usedUsdc = userDepositNum * usedRatio
            estimatedRefund = ((userDepositNum - usedUsdc) * 10 ** ALPHA_VAULT_CONFIG.usdcDecimals).toFixed(0)
          }
        }
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
   * Get TESS reserve from the DLMM pool
   * This is the amount of TESS available for the vault to purchase
   */
  async getPoolTessReserve(): Promise<number> {
    try {
      const poolAddress = new PublicKey(ALPHA_VAULT_CONFIG.dlmmPool)
      const dlmmPool = await DLMM.create(this.connection, poolAddress, { cluster: 'devnet' })

      // Get the reserve X (TESS) balance
      const reserveXBalance = await this.connection.getTokenAccountBalance(dlmmPool.lbPair.reserveX)
      return parseFloat(reserveXBalance.value.uiAmountString || '0')
    } catch (error) {
      console.error('Failed to get pool TESS reserve:', error)
      return 0
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
      // Use our getMerkleProof method which falls back to local proofs
      const merkleProof = await this.getMerkleProof(owner)

      const quota = vault.getAvailableDepositQuota(escrow, merkleProof ?? undefined)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vaultData = vault.vault as any
      const maxDeposit = merkleProof?.maxCap?.toString() ?? vaultData.individualDepositingCap?.toString() ?? '0'
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
   * First tries Meteora's API, then falls back to local proofs
   */
  async getMerkleProof(owner: PublicKey): Promise<DepositWithProofParams | null> {
    const vault = await this.initialize()

    // First try Meteora's API
    try {
      const proof = await vault.getMerkleProofForDeposit(owner)
      if (proof) return proof
    } catch {
      // API doesn't have our proofs, fall through to local
    }

    // Fall back to local merkle proofs
    const ownerStr = owner.toBase58()
    const localProof = LOCAL_MERKLE_PROOFS[ownerStr]

    if (localProof) {
      return {
        merkleRootConfig: new PublicKey(ALPHA_VAULT_CONFIG.merkleRootConfig),
        maxCap: new BN(localProof.maxCap),
        proof: localProof.proof.map((p) => Array.from(Buffer.from(p, 'hex'))),
      }
    }

    return null
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
