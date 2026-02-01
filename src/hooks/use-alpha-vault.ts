/**
 * React Hook for Alpha Vault Operations
 *
 * Provides state management and transaction handling for the Alpha Vault.
 * Uses the TESS Alpha Vault on Devnet.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import {
  AlphaVaultClient,
  ALPHA_VAULT_CONFIG,
  parseVaultAmount,
  formatVaultAmount,
  getVaultStateDisplay,
  type VaultInfo,
  type EscrowInfo,
  type DepositQuota,
  type AlphaVaultClaimInfo,
} from '@/services/alpha-vault'
import { getTimeRemaining } from '@/services/alpha-vault-helpers'
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'
import { addTermsAcceptanceMemo, MemoType } from '@/lib/transaction-memo'

// Get devnet RPC URL from environment or use default
const DEVNET_RPC_URL = import.meta.env.VITE_DEVNET_RPC_URL || clusterApiUrl('devnet')

// ============ Types ============

export interface UseAlphaVaultReturn {
  // State
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  // Vault info
  vaultInfo: VaultInfo | null
  vaultStateDisplay: { label: string; color: string } | null

  // User position
  escrowInfo: EscrowInfo | null
  depositQuota: DepositQuota | null
  claimInfo: AlphaVaultClaimInfo | null

  // Balances
  usdcBalance: string | null

  // Time remaining
  depositEndsIn: { hours: number; minutes: number; seconds: number } | null
  vestingEndsIn: { hours: number; minutes: number; seconds: number } | null

  // Formatted values
  totalRaised: string
  targetRaise: string
  oversubscribedRatio: string
  userDeposited: string
  estimatedAllocation: string
  estimatedRefund: string
  availableToClaim: string
  vestingDuration: string // e.g., "6h Linear"

  // Actions
  initialize: () => Promise<void>
  refreshVaultInfo: () => Promise<void>
  refreshUserPosition: () => Promise<void>
  deposit: (amount: string) => Promise<string | null>
  withdraw: (amount: string) => Promise<string | null>
  claim: () => Promise<string | null>
  withdrawRemaining: () => Promise<string | null>
  clearError: () => void
}

// ============ Hook Implementation ============

export function useAlphaVault(): UseAlphaVaultReturn {
  const wallet = useWallet()

  // State
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null)
  const [escrowInfo, setEscrowInfo] = useState<EscrowInfo | null>(null)
  const [depositQuota, setDepositQuota] = useState<DepositQuota | null>(null)
  const [claimInfo, setClaimInfo] = useState<AlphaVaultClaimInfo | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null)

  // Create connection and client
  const connection = useMemo(() => {
    return new Connection(DEVNET_RPC_URL, 'confirmed')
  }, [])

  const client = useMemo(() => {
    return new AlphaVaultClient(connection)
  }, [connection])

  // Derived state
  const vaultStateDisplay = useMemo(() => {
    if (!vaultInfo) return null
    return getVaultStateDisplay(vaultInfo.state)
  }, [vaultInfo])

  const depositEndsIn = useMemo(() => {
    if (!vaultInfo?.depositCloseTime) return null
    return getTimeRemaining(vaultInfo.depositCloseTime)
  }, [vaultInfo])

  const vestingEndsIn = useMemo(() => {
    if (!vaultInfo?.vestingEndTime) return null
    return getTimeRemaining(vaultInfo.vestingEndTime)
  }, [vaultInfo])

  // Formatted values
  const totalRaised = useMemo(() => {
    if (!vaultInfo) return '0'
    return formatVaultAmount(vaultInfo.totalDeposited)
  }, [vaultInfo])

  const targetRaise = useMemo(() => {
    if (!vaultInfo) return '0'
    return formatVaultAmount(vaultInfo.maxCap)
  }, [vaultInfo])

  const oversubscribedRatio = useMemo(() => {
    if (!vaultInfo) return '0'
    return vaultInfo.oversubscriptionRatio.toFixed(2)
  }, [vaultInfo])

  const userDeposited = useMemo(() => {
    if (!escrowInfo) return '0'
    return formatVaultAmount(escrowInfo.totalDeposited)
  }, [escrowInfo])

  const estimatedAllocation = useMemo(() => {
    if (!escrowInfo) return '0'
    return formatVaultAmount(escrowInfo.estimatedAllocation, ALPHA_VAULT_CONFIG.tessDecimals)
  }, [escrowInfo])

  const estimatedRefund = useMemo(() => {
    if (!escrowInfo) return '0'
    return formatVaultAmount(escrowInfo.estimatedRefund)
  }, [escrowInfo])

  const availableToClaim = useMemo(() => {
    if (!claimInfo) return '0'
    return formatVaultAmount(claimInfo.availableToClaim, ALPHA_VAULT_CONFIG.tessDecimals)
  }, [claimInfo])

  const vestingDuration = useMemo(() => {
    if (!vaultInfo) return '0h Linear'
    return `${vaultInfo.vestingDurationHours}h Linear`
  }, [vaultInfo])

  // Fetch USDC balance
  const fetchUsdcBalance = useCallback(async () => {
    if (!wallet.publicKey) {
      setUsdcBalance(null)
      return
    }

    try {
      const usdcMint = new PublicKey(ALPHA_VAULT_CONFIG.usdcToken)
      const ata = await getAssociatedTokenAddress(usdcMint, wallet.publicKey)
      const account = await getAccount(connection, ata)
      const formatted = formatVaultAmount(account.amount.toString())
      setUsdcBalance(formatted)
    } catch {
      setUsdcBalance('0.00')
    }
  }, [connection, wallet.publicKey])

  // Initialize vault
  const initialize = useCallback(async () => {
    if (isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      await client.initialize()
      const info = await client.getVaultInfo()
      setVaultInfo(info)
      setIsInitialized(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize vault'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [client, isInitialized])

  // Refresh vault info
  const refreshVaultInfo = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await client.refreshState()
      const info = await client.getVaultInfo()
      setVaultInfo(info)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh vault info'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [client])

  // Refresh user position
  const refreshUserPosition = useCallback(async () => {
    if (!wallet.publicKey) {
      setEscrowInfo(null)
      setDepositQuota(null)
      setClaimInfo(null)
      return
    }

    setIsLoading(true)

    try {
      const [escrow, quota, claim] = await Promise.all([
        client.getEscrowInfo(wallet.publicKey),
        client.getDepositQuota(wallet.publicKey),
        client.getClaimInfoForOwner(wallet.publicKey),
      ])

      setEscrowInfo(escrow)
      setDepositQuota(quota)
      setClaimInfo(claim)
      await fetchUsdcBalance()
    } catch (err) {
      console.error('Failed to refresh user position:', err)
    } finally {
      setIsLoading(false)
    }
  }, [client, wallet.publicKey, fetchUsdcBalance])

  // Deposit action
  const deposit = useCallback(
    async (amount: string): Promise<string | null> => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        setError('Wallet not connected')
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const amountBN = parseVaultAmount(amount)

        // Get merkle proof if vault is permissioned
        const merkleProof = await client.getMerkleProof(wallet.publicKey)

        // Create deposit transaction
        const tx = await client.createDepositTransaction(
          wallet.publicKey,
          amountBN,
          merkleProof ?? undefined
        )

        // Add terms acceptance memo
        addTermsAcceptanceMemo(tx, wallet.publicKey, MemoType.VAULT_DEPOSIT)

        // Set recent blockhash and fee payer
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer = wallet.publicKey

        // Sign and send
        const signed = await wallet.signTransaction(tx)
        const signature = await connection.sendRawTransaction(signed.serialize())

        // Confirm
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        })

        // Refresh position
        await refreshUserPosition()
        await refreshVaultInfo()

        return signature
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Deposit failed'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [client, connection, wallet, refreshUserPosition, refreshVaultInfo]
  )

  // Withdraw action
  const withdraw = useCallback(
    async (amount: string): Promise<string | null> => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        setError('Wallet not connected')
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const amountBN = parseVaultAmount(amount)

        const tx = await client.createWithdrawTransaction(wallet.publicKey, amountBN)

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer = wallet.publicKey

        const signed = await wallet.signTransaction(tx)
        const signature = await connection.sendRawTransaction(signed.serialize())

        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        })

        await refreshUserPosition()
        await refreshVaultInfo()

        return signature
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Withdrawal failed'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [client, connection, wallet, refreshUserPosition, refreshVaultInfo]
  )

  // Claim action
  const claim = useCallback(async (): Promise<string | null> => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const tx = await client.createClaimTransaction(wallet.publicKey)

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = wallet.publicKey

      const signed = await wallet.signTransaction(tx)
      const signature = await connection.sendRawTransaction(signed.serialize())

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      })

      await refreshUserPosition()

      return signature
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Claim failed'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [client, connection, wallet, refreshUserPosition])

  // Withdraw remaining (refund) action
  const withdrawRemaining = useCallback(async (): Promise<string | null> => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const tx = await client.createWithdrawRemainingTransaction(wallet.publicKey)

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = wallet.publicKey

      const signed = await wallet.signTransaction(tx)
      const signature = await connection.sendRawTransaction(signed.serialize())

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      })

      await refreshUserPosition()

      return signature
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Withdraw remaining failed'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [client, connection, wallet, refreshUserPosition])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-initialize on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Refresh user position when wallet changes
  useEffect(() => {
    if (isInitialized && wallet.publicKey) {
      refreshUserPosition()
    }
  }, [isInitialized, wallet.publicKey, refreshUserPosition])

  return {
    isLoading,
    isInitialized,
    error,
    vaultInfo,
    vaultStateDisplay,
    escrowInfo,
    depositQuota,
    claimInfo,
    usdcBalance,
    depositEndsIn,
    vestingEndsIn,
    totalRaised,
    targetRaise,
    oversubscribedRatio,
    userDeposited,
    estimatedAllocation,
    estimatedRefund,
    availableToClaim,
    vestingDuration,
    initialize,
    refreshVaultInfo,
    refreshUserPosition,
    deposit,
    withdraw,
    claim,
    withdrawRemaining,
    clearError,
  }
}
