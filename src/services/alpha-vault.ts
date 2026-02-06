/**
 * Alpha Vault Service
 *
 * Integrates with Meteora's Alpha Vault SDK to provide:
 * - Vault state management
 * - Deposit/withdraw operations
 * - Claim token operations
 * - Escrow information
 *
 * Uses the deployed Alpha Vault on Devnet for the T-SpaceX token launch.
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import AlphaVault, { VaultState as SdkVaultState, VaultMode as SdkVaultMode, type DepositWithProofParams } from '@meteora-ag/alpha-vault'
import DLMM, { getPriceOfBinByBinId } from '@meteora-ag/dlmm'
import BN from 'bn.js'
import {
  type AppTokenId,
  type ResolvedAlphaVaultConfig,
  type SolanaNetwork,
  DEFAULT_BASE_TOKEN_ID,
  getCurrentNetwork,
  getRpcEndpoint,
  getTokenAlphaVaultConfig,
} from '@/config'
import { estimateSlotDate } from './alpha-vault-helpers'

// ============ Configuration ============

export const DEFAULT_ALPHA_VAULT_TOKEN_ID: AppTokenId = DEFAULT_BASE_TOKEN_ID

function resolveAlphaVaultConfig(tokenId: AppTokenId, network: SolanaNetwork = getCurrentNetwork()): ResolvedAlphaVaultConfig {
  const config = getTokenAlphaVaultConfig(tokenId, network)

  if (!config) {
    throw new Error(`Alpha Vault configuration missing for token ${tokenId} on ${network}`)
  }

  return config
}

/**
 * Local merkle proofs for whitelisted wallets
 * Generated using Meteora's BalanceTree from @meteora-ag/alpha-vault
 * These are used because Meteora's API doesn't have our custom whitelist proofs
 *
 * Phase 2: Proofs are served via API endpoint /api/merkle-proof/{wallet}?vaultId={vaultId}
 * The full list is never exposed to clients for privacy and bandwidth optimization
 * Each vault has its own whitelist stored in functions/data/merkle-proofs-{vaultId}.json
 */

// ============ Types ============

export type VaultMode = 'fcfs' | 'prorata'

export type VaultStateType =
  | 'deposit_open'
  | 'purchasing'
  | 'deposit_closed'
  | 'vesting'
  | 'vesting_complete'
  | 'cancelled'

export interface VaultInfo {
  address: string
  mode: VaultMode
  state: VaultStateType
  // Timing
  activationType: 'slot' | 'timestamp' // How to interpret the time values below
  depositOpenSlot: number // Slot number OR Unix timestamp in seconds (depending on activationType)
  depositCloseSlot: number // Slot number OR Unix timestamp in seconds (depending on activationType)
  vestingStartSlot: number // Slot number OR Unix timestamp in seconds (depending on activationType)
  vestingEndSlot: number // Slot number OR Unix timestamp in seconds (depending on activationType)
  activationPoint: number
  // Amounts
  totalDeposited: string
  maxCap: string
  maxIndividualDeposit: string
  boughtToken: string // Amount of tokens purchased
  // Calculated
  isOversubscribed: boolean
  oversubscriptionRatio: number
  vestingDurationHours: number // Calculated from on-chain slots
  purchaseFailed: boolean // True if vault ended without purchasing tokens
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
      return 'purchasing'
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

export interface AlphaVaultClientOptions {
  tokenId?: AppTokenId
  connection?: Connection
  network?: SolanaNetwork
  vaultAddress?: string
}

export class AlphaVaultClient {
  private connection: Connection
  private vaultInstance: AlphaVaultInstance | null = null
  private vaultAddress: PublicKey
  readonly tokenId: AppTokenId
  readonly network: SolanaNetwork
  readonly config: ResolvedAlphaVaultConfig

  constructor(options: AlphaVaultClientOptions = {}) {
    const { tokenId = DEFAULT_ALPHA_VAULT_TOKEN_ID, connection, network = getCurrentNetwork(), vaultAddress } = options

    this.tokenId = tokenId
    this.network = network
    this.config = resolveAlphaVaultConfig(tokenId, network)
    this.connection = connection || new Connection(getRpcEndpoint(network), 'confirmed')
    this.vaultAddress = new PublicKey(vaultAddress ?? this.config.vault)
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

    // Read activation type from SDK: 0 = SLOT, 1 = TIMESTAMP
    const activationTypeValue = vaultDataAny.activationType ?? 0
    const activationType: 'slot' | 'timestamp' = activationTypeValue === 0 ? 'slot' : 'timestamp'

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
    const boughtToken = vaultDataAny.boughtToken?.toString() ?? '0'

    // Check if purchase failed (vault ended but no tokens purchased)
    const purchaseFailed = (sdkState === SdkVaultState.ENDED || sdkState === SdkVaultState.VESTING) &&
                          parseFloat(totalDeposited) > 0 &&
                          parseFloat(boughtToken) === 0

    // Calculate oversubscription
    const totalDepositedNum = parseFloat(totalDeposited) / 10 ** this.config.quoteDecimals
    const maxCapNum = parseFloat(maxCap) / 10 ** this.config.quoteDecimals
    const isOversubscribed = maxCapNum > 0 && totalDepositedNum > maxCapNum
    const oversubscriptionRatio = maxCapNum > 0 ? totalDepositedNum / maxCapNum : 0

    // Calculate vesting duration based on activation type
    let vestingDurationHours: number
    if (activationType === 'slot') {
      // For slot-based: approximate 400ms per slot = 2.5 slots per second
      const vestingDurationSlots = vestingEndSlot - vestingStartSlot
      const vestingDurationSeconds = vestingDurationSlots / 2.5
      vestingDurationHours = Math.round(vestingDurationSeconds / 3600)
    } else {
      // For timestamp-based: values are Unix timestamps in seconds
      const vestingDurationSeconds = vestingEndSlot - vestingStartSlot
      vestingDurationHours = Math.round(vestingDurationSeconds / 3600)
    }

    // Estimate times based on activation type
    const estimateTime = (point: number): Date | null => {
      if (activationType === 'slot') {
        // Point is a slot number - estimate timestamp from current slot
        return estimateSlotDate(currentSlot, point)
      } else {
        // Point is already a Unix timestamp in seconds - convert to milliseconds
        return new Date(point * 1000)
      }
    }

    return {
      address: this.vaultAddress.toBase58(),
      mode,
      state,
      activationType,
      depositOpenSlot,
      depositCloseSlot,
      vestingStartSlot,
      vestingEndSlot,
      activationPoint,
      totalDeposited,
      maxCap,
      maxIndividualDeposit,
      boughtToken,
      isOversubscribed,
      oversubscriptionRatio,
      vestingDurationHours,
      purchaseFailed,
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
        // During deposit period, estimate based on pool liquidity and price
        const tessAvailable = await this.getPoolTessReserve()
        const poolPrice = await this.getPoolPrice()
        const userDepositNum = parseFloat(totalDeposited) / 10 ** this.config.quoteDecimals
        const totalDepositsNum = parseFloat(vaultInfo.totalDeposited) / 10 ** this.config.quoteDecimals
        const maxCapNum = parseFloat(vaultInfo.maxCap) / 10 ** this.config.quoteDecimals

        if (totalDepositsNum > 0 && poolPrice > 0) {
          // User's share of deposits
          const userShare = userDepositNum / totalDepositsNum

          // Effective USDC that will be used (capped by maxBuyingCap)
          const effectiveUsdc = Math.min(totalDepositsNum, maxCapNum)

          // Calculate how much T-SpaceX can be bought with effective USDC at current pool price
          // poolPrice is in USDC per T-SpaceX, so: allocation = USDC / price
          const estimatedTessForVault = Math.min(tessAvailable, effectiveUsdc / poolPrice)
          const userTessAllocation = userShare * estimatedTessForVault

          estimatedAllocation = (userTessAllocation * 10 ** this.config.baseDecimals).toFixed(0)

          // Calculate refund if oversubscribed
          if (totalDepositsNum > maxCapNum) {
            const usedRatio = maxCapNum / totalDepositsNum
            const usedUsdc = userDepositNum * usedRatio
            estimatedRefund = ((userDepositNum - usedUsdc) * 10 ** this.config.quoteDecimals).toFixed(0)
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
   * Get base token reserve from the DLMM pool
   * This is the amount of T-SpaceX available for the vault to purchase
   */
  async getPoolTessReserve(): Promise<number> {
    try {
      const poolAddress = new PublicKey(this.config.dlmmPool)
      const dlmmPool = await DLMM.create(this.connection, poolAddress, { cluster: 'devnet' })

      // Get the reserve X (base token) balance
      const reserveXBalance = await this.connection.getTokenAccountBalance(dlmmPool.lbPair.reserveX)
      return parseFloat(reserveXBalance.value.uiAmountString || '0')
    } catch (error) {
      console.error('Failed to get pool base token reserve:', error)
      return 0
    }
  }

  /**
   * Get current pool price (USDC per T-SpaceX)
   * Returns the price at the active bin in the DLMM pool
   */
  async getPoolPrice(): Promise<number> {
    try {
      const poolAddress = new PublicKey(this.config.dlmmPool)
      const dlmmPool = await DLMM.create(this.connection, poolAddress, { cluster: 'devnet' })

      // Get the active bin ID and bin step
      const activeId = dlmmPool.lbPair.activeId
      const binStep = dlmmPool.lbPair.binStep

      // Get price at the active bin using the standalone function
      // Returns price as Y per X (USDC per T-SpaceX)
      const price = getPriceOfBinByBinId(activeId, binStep)

      return parseFloat(price.toString())
    } catch (error) {
      console.error('Failed to get pool price:', error)
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
   * Phase 2: Uses vault-specific API endpoint to fetch only the specific wallet's proof
   */
  async getMerkleProof(owner: PublicKey): Promise<DepositWithProofParams | null> {
    const ownerStr = owner.toBase58()
    const vaultId = this.config.vault

    try {
      // Fetch proof for this specific wallet from vault-specific API
      const response = await fetch(`/api/merkle-proof/${ownerStr}?vaultId=${vaultId}`)

      if (response.status === 404) {
        // Wallet not whitelisted or vault has no whitelist
        return null
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch merkle proof: ${response.statusText}`)
      }

      const result = await response.json()
      const merkleRoot = result.merkleRootConfig ?? this.config.merkleRootConfig

      if (!merkleRoot) {
        return null
      }

      return {
        merkleRootConfig: new PublicKey(merkleRoot),
        maxCap: new BN(result.maxCap),
        proof: result.proof.map((p: number[]) => Array.from(p)),
      }
    } catch (error) {
      console.error('Error fetching merkle proof from API:', error)
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

const alphaVaultClients = new Map<string, AlphaVaultClient>()

export function getAlphaVaultClient(
  tokenId: AppTokenId = DEFAULT_ALPHA_VAULT_TOKEN_ID,
  options: Omit<AlphaVaultClientOptions, 'tokenId'> = {}
): AlphaVaultClient {
  const network = options.network ?? getCurrentNetwork()
  const key = `${tokenId}:${network}`

  if (!alphaVaultClients.has(key)) {
    alphaVaultClients.set(key, new AlphaVaultClient({ tokenId, ...options, network }))
  }

  return alphaVaultClients.get(key)!
}

// ============ Utility Functions ============

/**
 * Format vault amount to human readable string
 */
export function formatVaultAmount(amount: string | BN, decimals: number = 6): string {
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
export function parseVaultAmount(amount: string, decimals: number = 6): BN {
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
    case 'purchasing':
      return { label: 'PURCHASING', color: '#f97316' }
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
