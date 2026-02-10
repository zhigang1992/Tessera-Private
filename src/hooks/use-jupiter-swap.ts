/**
 * React Hook for Jupiter Aggregator Swap Operations
 *
 * Uses Jupiter to route swaps across all Solana DEXs for best price execution
 * - USDC is the quote token (what you pay with when buying T-SpaceX)
 * - T-SpaceX is the base token (what you buy/sell)
 */

import { useState, useCallback, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import {
  JupiterClient,
  createJupiterClient,
  type JupiterSwapQuote,
} from '@/services/jupiter'
import { type BigNumberValue, fromTokenAmount, parseAmount, ZERO, isZero } from '@/lib/bignumber'
import { addTermsAcceptanceMemoToVersionedTx, MemoType } from '@/lib/transaction-memo'
import {
  DEFAULT_BASE_TOKEN_ID,
  QUOTE_TOKEN_ID,
  getAppToken,
  getTokenMintAddress,
  getTokenMintConfig,
  getCurrentNetwork,
  getRpcEndpoint,
} from '@/config'

// Direction: USDC -> T-SpaceX (buy T-SpaceX) or T-SpaceX -> USDC (sell T-SpaceX)
export type SwapDirection = 'USDC_TO_TSPACEX' | 'TSPACEX_TO_USDC'

// Pool info is not needed for Jupiter (no pool-specific data), but we keep it for interface compatibility
export interface PoolInfo {
  // Jupiter doesn't have pool-specific info, but we keep minimal structure for compatibility
  dynamicFeePercentage?: string
}

export interface UseJupiterSwapReturn {
  // State
  isLoading: boolean
  error: string | null
  poolInfo: PoolInfo | null
  quote: JupiterSwapQuote | null
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
  getQuote: (amount: string, direction: SwapDirection) => Promise<JupiterSwapQuote | null>
  executeSwap: (quote: JupiterSwapQuote, direction: SwapDirection) => Promise<string | null>
  refreshBalances: () => Promise<void>
  clearError: () => void
}

// Get current network and configure tokens accordingly
const CURRENT_NETWORK = getCurrentNetwork()
const BASE_TOKEN = getAppToken(DEFAULT_BASE_TOKEN_ID)
const QUOTE_TOKEN = getAppToken(QUOTE_TOKEN_ID)
const BASE_MINT_CONFIG = getTokenMintConfig(BASE_TOKEN.id, CURRENT_NETWORK)
const QUOTE_MINT_CONFIG = getTokenMintConfig(QUOTE_TOKEN.id, CURRENT_NETWORK)
const TSPACEX_MINT = getTokenMintAddress(BASE_TOKEN.id, CURRENT_NETWORK)
const USDC_MINT = getTokenMintAddress(QUOTE_TOKEN.id, CURRENT_NETWORK)
const TSPACEX_DECIMALS = BASE_MINT_CONFIG.decimals
const USDC_DECIMALS = QUOTE_MINT_CONFIG.decimals

export function useJupiterSwap(): UseJupiterSwapReturn {
  const wallet = useWallet()

  // State
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  const [quote, setQuote] = useState<JupiterSwapQuote | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<BigNumberValue | null>(null)
  const [tSpaceXBalance, setTessBalance] = useState<BigNumberValue | null>(null)

  // Create a connection for the current network
  const connection = useMemo(() => {
    const rpcUrl = getRpcEndpoint()
    return new Connection(rpcUrl, 'confirmed')
  }, [])

  // Create Jupiter client (no API key needed for basic usage)
  const client = useMemo(() => {
    return createJupiterClient(connection)
  }, [connection])

  // Load pool info - Jupiter doesn't have pool-specific info, but we implement for interface compatibility
  const loadPool = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Jupiter doesn't require pool loading, but we set a placeholder for compatibility
      setPoolInfo({
        dynamicFeePercentage: '0', // Jupiter handles fees internally
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize Jupiter'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

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

  // Get swap quote from Jupiter
  const getQuote = useCallback(
    async (amount: string, direction: SwapDirection): Promise<JupiterSwapQuote | null> => {
      // Parse amount to BigNumber for validation
      const amountBigNum = parseAmount(amount)
      if (isZero(amountBigNum)) {
        setQuote(null)
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        // Determine input/output mints and decimals based on direction
        const isBuying = direction === 'USDC_TO_TSPACEX'
        const inputMint = isBuying ? USDC_MINT : TSPACEX_MINT
        const outputMint = isBuying ? TSPACEX_MINT : USDC_MINT
        const inputDecimals = isBuying ? USDC_DECIMALS : TSPACEX_DECIMALS
        const outputDecimals = isBuying ? TSPACEX_DECIMALS : USDC_DECIMALS

        // Convert amount to smallest units
        const amountInSmallestUnits = JupiterClient.parseAmount(amount, inputDecimals)

        // Get quote from Jupiter
        const newQuote = await client.getSwapQuote(
          inputMint,
          outputMint,
          amountInSmallestUnits,
          100, // 1% slippage
          inputDecimals,
          outputDecimals
        )

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
    async (swapQuote: JupiterSwapQuote, _direction: SwapDirection): Promise<string | null> => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        setError('Wallet not connected')
        return null
      }

      setIsLoading(true)
      setError(null)
      setTxSignature(null)

      try {
        // Create swap transaction from Jupiter
        const swapTx = await client.createSwapTransaction(swapQuote, wallet.publicKey)

        // Add terms acceptance memo to the versioned transaction
        const swapTxWithMemo = addTermsAcceptanceMemoToVersionedTx(
          swapTx,
          wallet.publicKey,
          MemoType.TRADING
        )

        // Sign the transaction
        const signed = await wallet.signTransaction(swapTxWithMemo)

        // Simulate transaction before sending
        const { value: simulatedTransactionResponse } = await connection.simulateTransaction(signed, {
          replaceRecentBlockhash: true,
          commitment: 'processed',
        })

        const { err, logs } = simulatedTransactionResponse

        if (err) {
          console.error('Simulation Error:', { err, logs })
          throw new Error('Transaction simulation failed')
        }

        // Send transaction
        const signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
        })

        // Get blockhash for confirmation (Jupiter already sets this in the transaction)
        const latestBlockhash = await connection.getLatestBlockhash()

        // Confirm transaction
        await connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        })

        setTxSignature(signature)

        // Clear quote after successful swap
        setQuote(null)

        // Refresh balances after successful swap
        await refreshBalances()

        return signature
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Swap failed'
        setError(message)
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
