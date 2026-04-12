/**
 * React Hook for Presale Vault Operations
 *
 * Provides state management and transaction handling for Meteora Presale Vaults.
 * Runs alongside the Alpha Vault hook - these are independent systems.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'
import {
  PresaleVaultClient,
  parsePresaleAmount,
  getPresaleStateDisplay,
  type PresaleVaultInfo,
  type PresaleEscrowInfo,
  type PresaleDepositQuota,
  type PresaleClaimInfo,
} from '@/services/presale-vault'
import {
  type AppTokenId,
  type ResolvedPresaleVaultEntry,
  getRpcEndpoint,
} from '@/config'
import { getTimeRemaining } from '@/services/alpha-vault-helpers'
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'
import { addTermsAcceptanceMemo, MemoType } from '@/lib/transaction-memo'
import { fromTokenAmount, type BigNumberValue } from '@/lib/bignumber'

const DEFAULT_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || getRpcEndpoint()

export interface UsePresaleVaultReturn {
  tokenId: AppTokenId
  config: ResolvedPresaleVaultEntry

  // State
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  available: boolean // whether this token has a presale vault configured

  // Vault info
  vaultInfo: PresaleVaultInfo | null
  vaultStateDisplay: { label: string; color: string } | null

  // User position
  escrowInfo: PresaleEscrowInfo | null
  depositQuota: PresaleDepositQuota | null
  claimInfo: PresaleClaimInfo | null

  // Balances
  usdcBalance: BigNumberValue | null

  // Time remaining
  presaleStartsIn: { hours: number; minutes: number; seconds: number } | null
  presaleEndsIn: { hours: number; minutes: number; seconds: number } | null

  // Formatted values
  totalRaised: BigNumberValue
  targetRaise: BigNumberValue
  maxIndividualDeposit: BigNumberValue
  userDeposited: BigNumberValue
  availableToClaim: BigNumberValue
  progressPercentage: number

  // Actions
  initialize: () => Promise<void>
  refreshVaultInfo: () => Promise<void>
  refreshUserPosition: () => Promise<void>
  deposit: (amount: string, onSuccess?: () => void) => Promise<string | null>
  withdraw: (amount: string) => Promise<string | null>
  claim: () => Promise<string | null>
  withdrawRemaining: () => Promise<string | null>
  clearError: () => void
}

export function usePresaleVault(tokenId: AppTokenId, presaleConfig: ResolvedPresaleVaultEntry | null): UsePresaleVaultReturn {
  const wallet = useWallet()

  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vaultInfo, setVaultInfo] = useState<PresaleVaultInfo | null>(null)
  const [escrowInfo, setEscrowInfo] = useState<PresaleEscrowInfo | null>(null)
  const [depositQuota, setDepositQuota] = useState<PresaleDepositQuota | null>(null)
  const [claimInfo, setClaimInfo] = useState<PresaleClaimInfo | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<BigNumberValue | null>(null)

  const rpcEndpoint = DEFAULT_RPC_URL

  const connection = useMemo(() => {
    return new Connection(rpcEndpoint, 'confirmed')
  }, [rpcEndpoint])

  const available = presaleConfig != null && presaleConfig.presaleAddress !== ''

  const client = useMemo(() => {
    if (!available || !presaleConfig) return null
    try {
      return new PresaleVaultClient({ tokenId, presaleConfig, connection })
    } catch {
      return null
    }
  }, [connection, tokenId, presaleConfig, available])

  const quoteDecimals = presaleConfig?.quoteDecimals ?? 6
  const baseDecimals = presaleConfig?.baseDecimals ?? 6

  const vaultStateDisplay = useMemo(() => {
    if (!vaultInfo) return null
    return getPresaleStateDisplay(vaultInfo.state)
  }, [vaultInfo])

  // Live countdown
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const presaleStartsIn = useMemo(() => {
    if (!vaultInfo?.presaleStartTime) return null
    return getTimeRemaining(vaultInfo.presaleStartTime)
  }, [vaultInfo?.presaleStartTime, now])

  const presaleEndsIn = useMemo(() => {
    if (!vaultInfo?.presaleEndTime) return null
    return getTimeRemaining(vaultInfo.presaleEndTime)
  }, [vaultInfo?.presaleEndTime, now])

  const totalRaised = useMemo(() => {
    if (!vaultInfo) return fromTokenAmount('0', quoteDecimals)
    return fromTokenAmount(vaultInfo.totalDeposited, quoteDecimals)
  }, [vaultInfo, quoteDecimals])

  const targetRaise = useMemo(() => {
    if (!vaultInfo) return fromTokenAmount('0', quoteDecimals)
    return fromTokenAmount(vaultInfo.maximumCap, quoteDecimals)
  }, [vaultInfo, quoteDecimals])

  const maxIndividualDeposit = useMemo(() => {
    if (!vaultInfo) return fromTokenAmount('0', quoteDecimals)
    return fromTokenAmount(vaultInfo.buyerMaxDeposit, quoteDecimals)
  }, [vaultInfo, quoteDecimals])

  const userDeposited = useMemo(() => {
    if (!escrowInfo) return fromTokenAmount('0', quoteDecimals)
    return escrowInfo.totalDeposited
  }, [escrowInfo, quoteDecimals])

  const availableToClaim = useMemo(() => {
    if (!claimInfo) return fromTokenAmount('0', baseDecimals)
    return claimInfo.pendingClaimable
  }, [claimInfo, baseDecimals])

  const progressPercentage = useMemo(() => {
    return vaultInfo?.progressPercentage ?? 0
  }, [vaultInfo])

  // Fetch USDC balance
  const fetchUsdcBalance = useCallback(async () => {
    if (!wallet.publicKey || !presaleConfig) {
      setUsdcBalance(null)
      return
    }

    try {
      const usdcMint = new PublicKey(presaleConfig.quoteToken.mint)
      const ata = await getAssociatedTokenAddress(usdcMint, wallet.publicKey)
      const account = await getAccount(connection, ata)
      const balance = fromTokenAmount(account.amount.toString(), quoteDecimals)
      setUsdcBalance(balance)
    } catch {
      setUsdcBalance(fromTokenAmount('0', quoteDecimals))
    }
  }, [connection, quoteDecimals, wallet.publicKey, presaleConfig])

  const initialize = useCallback(async () => {
    if (isInitialized || !client) return

    setIsLoading(true)
    setError(null)

    try {
      await client.initialize()
      const info = await client.getVaultInfo()
      setVaultInfo(info)
      setIsInitialized(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize presale vault'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [client, isInitialized])

  const refreshVaultInfo = useCallback(async () => {
    if (!client) return

    setIsLoading(true)
    setError(null)

    try {
      await client.refreshState()
      const info = await client.getVaultInfo()
      setVaultInfo(info)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh presale vault'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [client])

  const refreshUserPosition = useCallback(async () => {
    if (!wallet.publicKey || !client) {
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
        client.getClaimInfo(wallet.publicKey),
      ])

      setEscrowInfo(escrow)
      setDepositQuota(quota)
      setClaimInfo(claim)
      await fetchUsdcBalance()
    } catch (err) {
      console.error('Failed to refresh presale user position:', err)
    } finally {
      setIsLoading(false)
    }
  }, [client, wallet.publicKey, fetchUsdcBalance])

  const deposit = useCallback(
    async (amount: string, onSuccess?: () => void): Promise<string | null> => {
      if (!wallet.publicKey || !wallet.signTransaction || !client) {
        setError('Wallet not connected')
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const amountBN = parsePresaleAmount(amount, quoteDecimals)

        const tx = await client.createDepositTransaction(wallet.publicKey, amountBN)

        addTermsAcceptanceMemo(tx, wallet.publicKey, MemoType.VAULT_DEPOSIT)

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

        if (onSuccess) onSuccess()

        await refreshUserPosition()
        await refreshVaultInfo()

        return signature
      } catch (err) {
        let message = err instanceof Error ? err.message : 'Deposit failed'

        if (message.includes('Attempt to debit an account but found no record of a prior credit')) {
          message = 'Insufficient USDC balance or USDC token account not found.'
        }

        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [client, connection, wallet, refreshUserPosition, refreshVaultInfo, quoteDecimals]
  )

  const withdraw = useCallback(
    async (amount: string): Promise<string | null> => {
      if (!wallet.publicKey || !wallet.signTransaction || !client) {
        setError('Wallet not connected')
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const amountBN = parsePresaleAmount(amount, quoteDecimals)
        const tx = await client.createWithdrawTransaction(wallet.publicKey, amountBN)

        addTermsAcceptanceMemo(tx, wallet.publicKey, MemoType.VAULT_DEPOSIT)

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer = wallet.publicKey

        const signed = await wallet.signTransaction(tx)
        const signature = await connection.sendRawTransaction(signed.serialize())

        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight })

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
    [client, connection, wallet, refreshUserPosition, refreshVaultInfo, quoteDecimals]
  )

  const claim = useCallback(async (): Promise<string | null> => {
    if (!wallet.publicKey || !wallet.signTransaction || !client) {
      setError('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const tx = await client.createClaimTransaction(wallet.publicKey)

      addTermsAcceptanceMemo(tx, wallet.publicKey, MemoType.VAULT_DEPOSIT)

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = wallet.publicKey

      const signed = await wallet.signTransaction(tx)
      const signature = await connection.sendRawTransaction(signed.serialize())

      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight })

      await refreshUserPosition()
      await refreshVaultInfo()

      return signature
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Claim failed'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [client, connection, wallet, refreshUserPosition, refreshVaultInfo])

  const withdrawRemaining = useCallback(async (): Promise<string | null> => {
    if (!wallet.publicKey || !wallet.signTransaction || !client) {
      setError('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const tx = await client.createWithdrawRemainingTransaction(wallet.publicKey)

      addTermsAcceptanceMemo(tx, wallet.publicKey, MemoType.VAULT_DEPOSIT)

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = wallet.publicKey

      const signed = await wallet.signTransaction(tx)
      const signature = await connection.sendRawTransaction(signed.serialize())

      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight })

      await refreshUserPosition()
      await refreshVaultInfo()

      return signature
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Withdraw remaining failed'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [client, connection, wallet, refreshUserPosition, refreshVaultInfo])

  const clearError = useCallback(() => setError(null), [])

  // Auto-initialize on mount
  useEffect(() => {
    if (available) {
      initialize()
    }
  }, [initialize, available])

  // Refresh user position when wallet changes
  useEffect(() => {
    if (isInitialized && wallet.publicKey) {
      refreshUserPosition()
    }
  }, [isInitialized, wallet.publicKey, refreshUserPosition])

  return {
    tokenId,
    config: presaleConfig!,
    isLoading,
    isInitialized,
    error,
    available,
    vaultInfo,
    vaultStateDisplay,
    escrowInfo,
    depositQuota,
    claimInfo,
    usdcBalance,
    presaleStartsIn,
    presaleEndsIn,
    totalRaised,
    targetRaise,
    maxIndividualDeposit,
    userDeposited,
    availableToClaim,
    progressPercentage,
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
