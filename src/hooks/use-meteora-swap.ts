/**
 * React Hook for Meteora DLMM Swap Operations
 *
 * Uses the T-SpaceX-USDC pool on Devnet
 * - USDC is the quote token (what you pay with when buying T-SpaceX)
 * - T-SpaceX is the base token (what you buy/sell)
 */

import { useState, useCallback, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import {
  MeteoraClient,
  createMeteoraClient,
  DEVNET_POOLS,
  type MeteoraSwapQuote,
  type PoolInfo,
} from '@/services/meteora'
import {
  type BigNumberValue,
  fromTokenAmount,
  formatBigNumber,
  parseAmount,
  ZERO,
  isZero,
} from '@/lib/bignumber'
import { addTermsAcceptanceMemo, MemoType } from '@/lib/transaction-memo'

// Get devnet RPC URL from environment or use default
const DEVNET_RPC_URL = import.meta.env.VITE_DEVNET_RPC_URL || clusterApiUrl('devnet')

// Direction: USDC -> TESS (buy TESS) or TESS -> USDC (sell TESS)
export type SwapDirection = 'USDC_TO_TSPACEX' | 'TSPACEX_TO_USDC'

export interface UseMeteoraSwapReturn {
  // State
  isLoading: boolean
  error: string | null
  poolInfo: PoolInfo | null
  quote: MeteoraSwapQuote | null
  txSignature: string | null

  // Token info
  usdcMint: string
  tSpaceXMint: string
  /** USDC balance as BigNumber for calculations */
  usdcBalance: BigNumberValue | null
  /** TESS balance as BigNumber for calculations */
  tSpaceXBalance: BigNumberValue | null
  /** Formatted USDC balance for display */
  usdcBalanceFormatted: string | null
  /** Formatted TESS balance for display */
  tSpaceXBalanceFormatted: string | null

  // Actions
  loadPool: () => Promise<void>
  getQuote: (amount: string, direction: SwapDirection) => Promise<MeteoraSwapQuote | null>
  executeSwap: (quote: MeteoraSwapQuote, direction: SwapDirection) => Promise<string | null>
  refreshBalances: () => Promise<void>
  clearError: () => void
}

// Pool configuration - T-SpaceX is tokenX, USDC is tokenY
const POOL_ADDRESS = DEVNET_POOLS['T-SpaceX-USDC'].address
const TSPACEX_MINT = DEVNET_POOLS['T-SpaceX-USDC'].tokenX.mint
const USDC_MINT = DEVNET_POOLS['T-SpaceX-USDC'].tokenY.mint
const TSPACEX_DECIMALS = DEVNET_POOLS['T-SpaceX-USDC'].tokenX.decimals
const USDC_DECIMALS = DEVNET_POOLS['T-SpaceX-USDC'].tokenY.decimals

export function useMeteoraSwap(): UseMeteoraSwapReturn {
  const wallet = useWallet()

  // State
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  const [quote, setQuote] = useState<MeteoraSwapQuote | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<BigNumberValue | null>(null)
  const [tSpaceXBalance, setTessBalance] = useState<BigNumberValue | null>(null)

  // Create a dedicated devnet connection for swap operations
  const devnetConnection = useMemo(() => {
    return new Connection(DEVNET_RPC_URL, 'confirmed')
  }, [])

  // Create client with devnet connection
  const client = useMemo(() => {
    return createMeteoraClient(devnetConnection, 'devnet')
  }, [devnetConnection])

  // Load pool info
  const loadPool = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const info = await client.getPoolInfo(POOL_ADDRESS)
      setPoolInfo(info)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pool'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [client])

  // Refresh token balances from devnet
  const refreshBalances = useCallback(async () => {
    if (!wallet.publicKey) {
      setUsdcBalance(null)
      setTessBalance(null)
      return
    }

    try {
      // Get USDC balance on devnet (standard SPL token)
      try {
        const usdcMintPubkey = new PublicKey(USDC_MINT)
        const ata = await getAssociatedTokenAddress(usdcMintPubkey, wallet.publicKey)
        const account = await getAccount(devnetConnection, ata)
        // Convert raw amount to BigNumber using token decimals
        const usdcBigNum = fromTokenAmount(account.amount.toString(), USDC_DECIMALS)
        setUsdcBalance(usdcBigNum)
      } catch {
        // Token account doesn't exist on devnet
        setUsdcBalance(ZERO)
      }

      // Get TESS balance on devnet (Token-2022)
      try {
        const tSpaceXMintPubkey = new PublicKey(TSPACEX_MINT)
        const ata = await getAssociatedTokenAddress(
          tSpaceXMintPubkey,
          wallet.publicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        )
        const account = await getAccount(devnetConnection, ata, 'confirmed', TOKEN_2022_PROGRAM_ID)
        // Convert raw amount to BigNumber using token decimals
        const tessBigNum = fromTokenAmount(account.amount.toString(), TSPACEX_DECIMALS)
        setTessBalance(tessBigNum)
      } catch {
        setTessBalance(ZERO)
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err)
    }
  }, [devnetConnection, wallet.publicKey])

  // Get swap quote
  // In the pool: tokenX = TESS, tokenY = USDC
  // swapForY = true means X -> Y (TESS -> USDC, selling TESS)
  // swapForY = false means Y -> X (USDC -> TESS, buying TESS)
  const getQuote = useCallback(
    async (amount: string, direction: SwapDirection): Promise<MeteoraSwapQuote | null> => {
      // Parse amount to BigNumber for validation
      const amountBigNum = parseAmount(amount)
      if (isZero(amountBigNum)) {
        setQuote(null)
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        // USDC_TO_TSPACEX = buying TESS with USDC = Y -> X = swapForY = false
        // TSPACEX_TO_USDC = selling TESS for USDC = X -> Y = swapForY = true
        const swapForY = direction === 'TSPACEX_TO_USDC'
        const decimals = direction === 'USDC_TO_TSPACEX' ? USDC_DECIMALS : TSPACEX_DECIMALS
        const amountBN = MeteoraClient.parseAmount(amount, decimals)

        const newQuote = await client.getSwapQuote(POOL_ADDRESS, amountBN, swapForY, 100) // 1% slippage
        setQuote(newQuote)
        return newQuote
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get quote'
        setError(message)
        setQuote(null)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [client]
  )

  // Execute swap
  const executeSwap = useCallback(
    async (swapQuote: MeteoraSwapQuote, direction: SwapDirection): Promise<string | null> => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        setError('Wallet not connected')
        return null
      }

      setIsLoading(true)
      setError(null)
      setTxSignature(null)

      try {
        // USDC_TO_TSPACEX = buying TESS = Y -> X = swapForY = false
        // TSPACEX_TO_USDC = selling TESS = X -> Y = swapForY = true
        const swapForY = direction === 'TSPACEX_TO_USDC'

        // Create swap transaction
        const swapTx = await client.createSwapTransaction(
          POOL_ADDRESS,
          swapForY,
          swapQuote,
          wallet.publicKey
        )

        // Add terms acceptance memo
        addTermsAcceptanceMemo(swapTx, wallet.publicKey, MemoType.TRADING)

        // Set recent blockhash and fee payer using devnet connection
        const { blockhash, lastValidBlockHeight } = await devnetConnection.getLatestBlockhash()
        swapTx.recentBlockhash = blockhash
        swapTx.feePayer = wallet.publicKey

        // Sign and send to devnet
        // skipPreflight: true to avoid simulation errors when tx was already processed
        // (simulation can return false positives for duplicate detection)
        const signed = await wallet.signTransaction(swapTx)
        const signature = await devnetConnection.sendRawTransaction(signed.serialize(), {
          skipPreflight: true,
        })

        // Confirm transaction on devnet
        await devnetConnection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        })

        setTxSignature(signature)

        // Clear quote and pool cache to avoid stale data on subsequent swaps
        setQuote(null)
        client.clearCache()

        // Refresh balances after successful swap
        await refreshBalances()

        return signature
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Swap failed'
        setError(message)
        // Clear pool cache on error to avoid stale state
        client.clearCache()
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [client, devnetConnection, wallet, refreshBalances]
  )

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Memoized formatted balance strings for display
  const usdcBalanceFormatted = useMemo(() => {
    if (!usdcBalance) return null
    return formatBigNumber(usdcBalance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }, [usdcBalance])

  const tSpaceXBalanceFormatted = useMemo(() => {
    if (!tSpaceXBalance) return null
    return formatBigNumber(tSpaceXBalance, { minimumFractionDigits: 4, maximumFractionDigits: 4 })
  }, [tSpaceXBalance])

  return {
    isLoading,
    error,
    poolInfo,
    quote,
    txSignature,
    usdcMint: USDC_MINT,
    tSpaceXMint: TSPACEX_MINT,
    usdcBalance,
    tSpaceXBalance,
    usdcBalanceFormatted,
    tSpaceXBalanceFormatted,
    loadPool,
    getQuote,
    executeSwap,
    refreshBalances,
    clearError,
  }
}
