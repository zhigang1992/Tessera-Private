/**
 * Presale Vault Service
 *
 * Integrates with Meteora's Presale SDK (@meteora-ag/presale) to provide:
 * - Presale vault state management
 * - Deposit/withdraw operations
 * - Claim token operations
 * - Escrow information
 *
 * This is separate from the Alpha Vault and runs alongside it.
 * The presale vault is a standalone product that accepts quote tokens
 * and distributes base tokens after the presale ends.
 */

import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
import {
  Presale,
  PresaleProgress,
  DEFAULT_PERMISSIONLESS_REGISTRY_INDEX,
  deriveEscrow,
  createPermissionedEscrowWithMerkleProofIx,
  createDepositIx,
  type ICreatePermissionedEscrowWithMerkleProofParams,
  type IDepositParams,
} from '@meteora-ag/presale'
import BN from 'bn.js'
import {
  type AppTokenId,
  type ResolvedPresaleVaultEntry,
  type SolanaNetwork,
  getCurrentNetwork,
  getRpcEndpoint,
} from '@/config'
import { fromTokenAmount, type BigNumberValue } from '@/lib/bignumber'
import { BigNumber, math, mathIs } from 'math-literal'

// ============ Types ============

export interface PresaleMerkleProofParams {
  merkleRootConfig: PublicKey
  depositCap: BN
  proof: number[][]
  registryIndex: BN
}

export type PresaleStateType =
  | 'not_started'
  | 'deposit_open'
  | 'completed'
  | 'failed'

export interface PresaleVaultInfo {
  address: string
  mode: 'fcfs' | 'prorata' | 'fixed_price'
  state: PresaleStateType
  isPermissionless: boolean
  // Timing
  presaleStartTime: Date | null
  presaleEndTime: Date | null
  vestingStartTime: Date | null
  vestingEndTime: Date | null
  subjectToEarlyEnd: boolean
  // Amounts
  totalDeposited: string // raw
  maximumCap: string // raw
  minimumCap: string // raw
  // Per-user caps from registry
  buyerMinDeposit: string // raw
  buyerMaxDeposit: string // raw
  // Progress
  progressPercentage: number
  averageTokenPrice: number
  // Vesting
  immediateReleasePercentage: number
}

export interface PresaleEscrowInfo {
  owner: string
  totalDeposited: BigNumberValue
  claimedAmount: BigNumberValue
  availableToClaim: BigNumberValue
  remainingDeposit: BigNumberValue
  depositCap: BigNumberValue
}

export interface PresaleDepositQuota {
  maxDeposit: string
  remainingQuota: string
  canDeposit: boolean
  reason?: string
}

export interface PresaleClaimInfo {
  totalClaimable: BigNumberValue
  pendingClaimable: BigNumberValue
  claimed: BigNumberValue
  canClaim: boolean
}

// ============ State mapping ============

function mapPresaleProgress(progress: PresaleProgress): PresaleStateType {
  switch (progress) {
    case PresaleProgress.NotStarted:
      return 'not_started'
    case PresaleProgress.Ongoing:
      return 'deposit_open'
    case PresaleProgress.Completed:
      return 'completed'
    case PresaleProgress.Failed:
      return 'failed'
    default:
      return 'not_started'
  }
}

// ============ Presale Vault Client ============

export interface PresaleVaultClientOptions {
  tokenId: AppTokenId
  presaleConfig: ResolvedPresaleVaultEntry
  connection?: Connection
  network?: SolanaNetwork
}

type PresaleWrapperType = ReturnType<Presale['getParsedPresale']>
type EscrowWrapperType = Awaited<ReturnType<Presale['getPresaleEscrowByOwner']>>[number]

export class PresaleVaultClient {
  private connection: Connection
  private presaleInstance: Presale | null = null
  private presaleWrapper: PresaleWrapperType | null = null
  private presaleAddress: PublicKey
  readonly tokenId: AppTokenId
  readonly network: SolanaNetwork
  readonly config: ResolvedPresaleVaultEntry

  constructor(options: PresaleVaultClientOptions) {
    const { tokenId, presaleConfig, connection, network = getCurrentNetwork() } = options

    this.tokenId = tokenId
    this.network = network
    this.config = presaleConfig
    this.connection = connection || new Connection(getRpcEndpoint(), 'confirmed')
    this.presaleAddress = new PublicKey(presaleConfig.presaleAddress)
  }

  async initialize(): Promise<Presale> {
    if (!this.presaleInstance) {
      this.presaleInstance = await Presale.create(
        this.connection,
        this.presaleAddress,
      )
      this.presaleWrapper = this.presaleInstance.getParsedPresale()
    }
    return this.presaleInstance
  }

  private getWrapper(): PresaleWrapperType {
    if (!this.presaleWrapper) {
      throw new Error('Presale not initialized. Call initialize() first.')
    }
    return this.presaleWrapper
  }

  async getVaultInfo(): Promise<PresaleVaultInfo> {
    await this.initialize()
    const wrapper = this.getWrapper()

    const progress = wrapper.getPresaleProgressState()
    const state = mapPresaleProgress(progress)
    const timings = wrapper.getTimings()
    const modeName = wrapper.getPresaleModeName()

    const mode = modeName === 'FixedPrice' ? 'fixed_price'
      : modeName === 'Prorata' ? 'prorata'
      : 'fcfs'

    const isPermissionless = wrapper.getWhitelistModeName() === 'Permissionless'

    const totalDeposited = wrapper.getTotalDepositRawAmount().toString()
    const maximumCap = wrapper.getPresaleMaximumRawCap().toString()
    const minimumCap = wrapper.getPresaleMinimumRawCap().toString()

    // Get per-user caps from the first registry (index 0)
    const registries = wrapper.getAllPresaleRegistries()
    const firstRegistry = registries[0]
    const buyerMinDeposit = firstRegistry?.getBuyerMinimumRawDepositCap().toString() ?? '0'
    const buyerMaxDeposit = firstRegistry?.getBuyerMaximumRawDepositCap().toString() ?? '0'

    const progressPercentage = wrapper.getPresaleProgressPercentage()
    const averageTokenPrice = wrapper.getAverageTokenPrice()
    const immediateReleasePercentage = wrapper.getImmediateReleasePercentage()

    return {
      address: this.presaleAddress.toBase58(),
      mode,
      state,
      isPermissionless,
      presaleStartTime: timings.presaleStartTime ? new Date(timings.presaleStartTime * 1000) : null,
      presaleEndTime: timings.presaleEndTime ? new Date(timings.presaleEndTime * 1000) : null,
      vestingStartTime: timings.vestingStartTime ? new Date(timings.vestingStartTime * 1000) : null,
      vestingEndTime: timings.vestingEndTime ? new Date(timings.vestingEndTime * 1000) : null,
      subjectToEarlyEnd: timings.subjectToEarlyEnd,
      totalDeposited,
      maximumCap,
      minimumCap,
      buyerMinDeposit,
      buyerMaxDeposit,
      progressPercentage,
      averageTokenPrice,
      immediateReleasePercentage,
    }
  }

  async getEscrowInfo(owner: PublicKey): Promise<PresaleEscrowInfo | null> {
    const presale = await this.initialize()
    const wrapper = this.getWrapper()

    try {
      const escrows = await presale.getPresaleEscrowByOwner(owner)
      if (!escrows || escrows.length === 0) return null

      const escrow = escrows[0] as EscrowWrapperType
      const quoteDecimals = this.config.quoteDecimals
      const baseDecimals = this.config.baseDecimals

      const totalDeposited = fromTokenAmount(escrow.getDepositRawAmount().toString(), quoteDecimals)
      const claimedAmount = fromTokenAmount(escrow.getClaimedRawAmount().toString(), baseDecimals)

      const currentTs = Math.floor(Date.now() / 1000)
      const pendingClaimable = fromTokenAmount(
        escrow.getPendingClaimableRawAmount(wrapper, currentTs).toString(),
        baseDecimals
      )

      const remaining = fromTokenAmount(
        escrow.getRemainingDepositAmount(wrapper).toString(),
        quoteDecimals
      )

      const depositCap = fromTokenAmount(
        escrow.getIndividualDepositCap().toString(),
        quoteDecimals
      )

      return {
        owner: owner.toBase58(),
        totalDeposited,
        claimedAmount,
        availableToClaim: pendingClaimable,
        remainingDeposit: remaining,
        depositCap,
      }
    } catch (err) {
      console.error('Failed to get presale escrow info:', err)
      return null
    }
  }

  async getDepositQuota(owner: PublicKey): Promise<PresaleDepositQuota> {
    const presale = await this.initialize()
    const wrapper = this.getWrapper()
    const quoteDecimals = this.config.quoteDecimals

    try {
      const canDeposit = wrapper.canDeposit()
      if (!canDeposit) {
        return {
          maxDeposit: '0',
          remainingQuota: '0',
          canDeposit: false,
          reason: 'Presale is not open for deposits',
        }
      }

      const escrows = await presale.getPresaleEscrowByOwner(owner)
      const escrow = escrows?.[0] as EscrowWrapperType | undefined

      if (escrow) {
        const remaining = escrow.getRemainingDepositAmount(wrapper)
        const cap = escrow.getIndividualDepositCap()

        return {
          maxDeposit: cap.toString(),
          remainingQuota: remaining.toString(),
          canDeposit: remaining.gt(new BN(0)),
          reason: remaining.gt(new BN(0)) ? undefined : 'Deposit cap reached',
        }
      }

      // No escrow yet - get from registry
      const registries = wrapper.getAllPresaleRegistries()
      const firstRegistry = registries[0]
      const maxDeposit = firstRegistry?.getBuyerMaximumRawDepositCap().toString() ?? '0'

      return {
        maxDeposit,
        remainingQuota: maxDeposit,
        canDeposit: true,
      }
    } catch (err) {
      console.error('Failed to get presale deposit quota:', err)
      return {
        maxDeposit: '0',
        remainingQuota: '0',
        canDeposit: false,
        reason: 'Unable to fetch deposit quota',
      }
    }
  }

  async getClaimInfo(owner: PublicKey): Promise<PresaleClaimInfo | null> {
    const presale = await this.initialize()
    const wrapper = this.getWrapper()
    const baseDecimals = this.config.baseDecimals

    try {
      const escrows = await presale.getPresaleEscrowByOwner(owner)
      if (!escrows || escrows.length === 0) return null

      const escrow = escrows[0] as EscrowWrapperType
      const currentTs = Math.floor(Date.now() / 1000)

      const totalClaimable = fromTokenAmount(
        escrow.getTotalClaimableRawAmount(wrapper).toString(),
        baseDecimals
      )
      const pendingClaimable = fromTokenAmount(
        escrow.getPendingClaimableRawAmount(wrapper, currentTs).toString(),
        baseDecimals
      )
      const claimed = fromTokenAmount(
        escrow.getClaimedRawAmount().toString(),
        baseDecimals
      )
      const canClaim = wrapper.canClaim() && mathIs`${pendingClaimable} > ${0}`

      return { totalClaimable, pendingClaimable, claimed, canClaim }
    } catch (err) {
      console.error('Failed to get presale claim info:', err)
      return null
    }
  }

  /**
   * Fetch merkle proof for a wallet from the worker API.
   * Returns null if the vault is permissionless or the wallet is not whitelisted.
   */
  async getMerkleProof(owner: PublicKey): Promise<PresaleMerkleProofParams | null> {
    const vaultId = this.presaleAddress.toBase58()
    const ownerStr = owner.toBase58()

    try {
      const response = await fetch(`/api/merkle-proof/${ownerStr}?vaultId=${vaultId}&registryIndex=0`)
      if (!response.ok) return null

      const result = await response.json() as {
        proof: number[][]
        depositCap: number
        merkleRootConfig: string
        registryIndex: number
      }

      return {
        merkleRootConfig: new PublicKey(result.merkleRootConfig),
        depositCap: new BN(result.depositCap),
        proof: result.proof.map((p: number[]) => Array.from(p)),
        registryIndex: new BN(result.registryIndex),
      }
    } catch {
      return null
    }
  }

  async createDepositTransaction(
    owner: PublicKey,
    amount: BN,
    merkleProof?: PresaleMerkleProofParams,
  ): Promise<Transaction> {
    const presale = await this.initialize()
    const registryIndex = merkleProof?.registryIndex ?? DEFAULT_PERMISSIONLESS_REGISTRY_INDEX

    if (merkleProof) {
      // For permissioned vaults we bypass the SDK's deposit() wrapper entirely
      // because it auto-fetches proofs from Meteora's server (unreliable on devnet).
      // Instead we build the transaction manually using our own proof from the worker API.
      const instructions: TransactionInstruction[] = []

      // 1. Check if escrow already exists (idempotent — skip if already created)
      const escrowPda = deriveEscrow(
        this.presaleAddress,
        owner,
        registryIndex,
        presale.program.programId,
      )
      const escrowAccount = await presale.program.account.escrow.fetchNullable(escrowPda)

      if (!escrowAccount) {
        const initEscrowIx = await createPermissionedEscrowWithMerkleProofIx({
          presaleProgram: presale.program,
          presaleAddress: this.presaleAddress,
          owner,
          payer: owner,
          merkleRootConfig: merkleProof.merkleRootConfig,
          registryIndex,
          depositCap: merkleProof.depositCap,
          proof: merkleProof.proof,
        } as ICreatePermissionedEscrowWithMerkleProofParams)
        instructions.push(initEscrowIx)
      }

      // 2. Build raw deposit instruction (bypasses SDK auto-fetch)
      const depositIxs = await createDepositIx({
        presaleProgram: presale.program,
        presaleAddress: this.presaleAddress,
        presaleAccount: presale.presaleAccount,
        transferHookAccountInfo: presale.quoteTransferHookAccountInfo,
        owner,
        amount,
        registryIndex,
      } as IDepositParams)
      instructions.push(...depositIxs)

      // 3. Build transaction
      const { blockhash } = await this.connection.getLatestBlockhash()
      const tx = new Transaction()
      tx.recentBlockhash = blockhash
      tx.feePayer = owner
      tx.add(...instructions)
      return tx
    }

    // Permissionless deposit — SDK handles escrow creation internally
    const tx = await presale.deposit({
      owner,
      amount,
      registryIndex: DEFAULT_PERMISSIONLESS_REGISTRY_INDEX,
    })

    return tx
  }

  async createWithdrawTransaction(
    owner: PublicKey,
    amount: BN,
    registryIndex?: BN,
  ): Promise<Transaction> {
    const presale = await this.initialize()

    const tx = await presale.withdraw({
      owner,
      amount,
      registryIndex: registryIndex ?? DEFAULT_PERMISSIONLESS_REGISTRY_INDEX,
    })

    return tx
  }

  async createClaimTransaction(owner: PublicKey, registryIndex?: BN): Promise<Transaction> {
    const presale = await this.initialize()

    const tx = await presale.claim({
      owner,
      registryIndex: registryIndex ?? DEFAULT_PERMISSIONLESS_REGISTRY_INDEX,
    })

    return tx
  }

  async createWithdrawRemainingTransaction(owner: PublicKey, registryIndex?: BN): Promise<Transaction> {
    const presale = await this.initialize()

    const tx = await presale.withdrawRemainingQuote({
      owner,
      registryIndex: registryIndex ?? DEFAULT_PERMISSIONLESS_REGISTRY_INDEX,
    })

    return tx
  }

  async refreshState(): Promise<void> {
    if (this.presaleInstance) {
      await this.presaleInstance.refetchState()
      this.presaleWrapper = this.presaleInstance.getParsedPresale()
    } else {
      await this.initialize()
    }
  }
}

// ============ Singleton ============

const presaleVaultClients = new Map<string, PresaleVaultClient>()

export function getPresaleVaultClient(
  tokenId: AppTokenId,
  presaleConfig: ResolvedPresaleVaultEntry,
  options: Omit<PresaleVaultClientOptions, 'tokenId' | 'presaleConfig'> = {}
): PresaleVaultClient {
  const network = options.network ?? getCurrentNetwork()
  const key = `presale:${tokenId}:${presaleConfig.id}:${network}`

  if (!presaleVaultClients.has(key)) {
    presaleVaultClients.set(key, new PresaleVaultClient({ tokenId, presaleConfig, ...options, network }))
  }

  return presaleVaultClients.get(key)!
}

// ============ Utility Functions ============

export function parsePresaleAmount(amount: string, decimals: number = 6): BN {
  const [intPart, decPart = ''] = amount.split('.')
  const paddedDec = decPart.padEnd(decimals, '0').slice(0, decimals)
  const fullAmount = intPart + paddedDec
  return new BN(fullAmount)
}

export function getPresaleStateDisplay(state: PresaleStateType): {
  label: string
  color: string
} {
  switch (state) {
    case 'not_started':
      return { label: 'UPCOMING', color: '#6b7280' }
    case 'deposit_open':
      return { label: 'LIVE', color: '#06a800' }
    case 'completed':
      return { label: 'COMPLETE', color: '#10b981' }
    case 'failed':
      return { label: 'FAILED', color: '#ef4444' }
    default:
      return { label: 'UNKNOWN', color: '#6b7280' }
  }
}
