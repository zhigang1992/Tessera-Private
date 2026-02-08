/**
 * React Hook for Meteora DLMM Swap Operations
 *
 * Uses the T-SpaceX-USDC pool on the configured network (mainnet-beta or devnet)
 * - USDC is the quote token (what you pay with when buying T-SpaceX)
 * - T-SpaceX is the base token (what you buy/sell)
 */

import { useState, useCallback, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import {
  MeteoraClient,
  createMeteoraClient,
  DEVNET_POOLS,
  type MeteoraSwapQuote,
  type PoolInfo,
} from '@/services/meteora'
import { type BigNumberValue, fromTokenAmount, parseAmount, ZERO, isZero } from '@/lib/bignumber'
import { addTermsAcceptanceMemo, MemoType } from '@/lib/transaction-memo'
import {
  DEFAULT_BASE_TOKEN_ID,
  QUOTE_TOKEN_ID,
  getAppToken,
  getTokenDlmmPoolAddress,
  getTokenMintAddress,
  getTokenMintConfig,
  getCurrentNetwork,
  getRpcEndpoint,
} from '@/config'

// Direction: USDC -> T-SpaceX (buy T-SpaceX) or T-SpaceX -> USDC (sell T-SpaceX)
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
  /** T-SpaceX balance as BigNumber for calculations */
  tSpaceXBalance: BigNumberValue | null

  // Actions
  loadPool: () => Promise<void>
  getQuote: (amount: string, direction: SwapDirection) => Promise<MeteoraSwapQuote | null>
  executeSwap: (quote: MeteoraSwapQuote, direction: SwapDirection) => Promise<string | null>
  refreshBalances: () => Promise<void>
  clearError: () => void
}

// Get current network and configure tokens accordingly
const CURRENT_NETWORK = getCurrentNetwork()
const BASE_TOKEN = getAppToken(DEFAULT_BASE_TOKEN_ID)
const QUOTE_TOKEN = getAppToken(QUOTE_TOKEN_ID)
const BASE_MINT_CONFIG = getTokenMintConfig(BASE_TOKEN.id, CURRENT_NETWORK)
const QUOTE_MINT_CONFIG = getTokenMintConfig(QUOTE_TOKEN.id, CURRENT_NETWORK)
const POOL_ADDRESS =
  getTokenDlmmPoolAddress(BASE_TOKEN.id) ??
  (BASE_TOKEN.dlmmPool?.id && DEVNET_POOLS[BASE_TOKEN.dlmmPool.id]?.address) ??
  DEVNET_POOLS['T-SpaceX-USDC']?.address ??
  ''
const TSPACEX_MINT = getTokenMintAddress(BASE_TOKEN.id, CURRENT_NETWORK)
const USDC_MINT = getTokenMintAddress(QUOTE_TOKEN.id, CURRENT_NETWORK)
const TSPACEX_DECIMALS = BASE_MINT_CONFIG.decimals
const USDC_DECIMALS = QUOTE_MINT_CONFIG.decimals

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

  // Create a connection for the current network
  const connection = useMemo(() => {
    const rpcUrl = getRpcEndpoint()
    return new Connection(rpcUrl, 'confirmed')
  }, [])

  // Create client with current network
  const client = useMemo(() => {
    return createMeteoraClient(connection, CURRENT_NETWORK)
  }, [connection])

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

  // Refresh token balances from current network
  const refreshBalances = useCallback(async () => {
    if (!wallet.publicKey) {
      setUsdcBalance(null)
      setTessBalance(null)
      return
    }

    try {
      // Get USDC balance (standard SPL token)
      try {
        const usdcMintPubkey = new PublicKey(USDC_MINT)
        const ata = await getAssociatedTokenAddress(usdcMintPubkey, wallet.publicKey)
        const account = await getAccount(connection, ata)
        // Convert raw amount to BigNumber using token decimals
        const usdcBigNum = fromTokenAmount(account.amount.toString(), USDC_DECIMALS)
        setUsdcBalance(usdcBigNum)
      } catch {
        // Token account doesn't exist
        setUsdcBalance(ZERO)
      }

      // Get T-SpaceX balance (Token-2022)
      try {
        const tSpaceXMintPubkey = new PublicKey(TSPACEX_MINT)
        const ata = await getAssociatedTokenAddress(
          tSpaceXMintPubkey,
          wallet.publicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        )
        const account = await getAccount(connection, ata, 'confirmed', TOKEN_2022_PROGRAM_ID)
        // Convert raw amount to BigNumber using token decimals
        const tessBigNum = fromTokenAmount(account.amount.toString(), TSPACEX_DECIMALS)
        setTessBalance(tessBigNum)
      } catch {
        setTessBalance(ZERO)
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err)
    }
  }, [connection, wallet.publicKey])

  // Get swap quote
  // In the pool: tokenX = T-SpaceX, tokenY = USDC
  // swapForY = true means X -> Y (T-SpaceX -> USDC, selling the base token)
  // swapForY = false means Y -> X (USDC -> T-SpaceX, buying the base token)
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
        // USDC_TO_TSPACEX = buying T-SpaceX with USDC = Y -> X = swapForY = false
        // TSPACEX_TO_USDC = selling T-SpaceX for USDC = X -> Y = swapForY = true
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
        // USDC_TO_TSPACEX = buying T-SpaceX = Y -> X = swapForY = false
        // TSPACEX_TO_USDC = selling T-SpaceX = X -> Y = swapForY = true
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

        // Set recent blockhash and fee payer
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        swapTx.recentBlockhash = blockhash
        swapTx.feePayer = wallet.publicKey

        // Sign and send transaction
        // Simulation now works with proper compute budget
        const signed = await wallet.signTransaction(swapTx)
        const signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
        })

        // Confirm transaction
        await connection.confirmTransaction({
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
    [client, connection, wallet, refreshBalances]
  )

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

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
    loadPool,
    getQuote,
    executeSwap,
    refreshBalances,
    clearError,
  }
}
