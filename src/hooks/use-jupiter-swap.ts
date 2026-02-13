/**
 * React Hook for Jupiter Aggregator Swap Operations
 *
 * Uses Jupiter to route swaps across all Solana DEXs for best price execution
 * Supports any base token paired with any quote token
 */

import { useState, useCallback, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  JupiterClient,
  createJupiterClient,
  type JupiterSwapQuote,
} from '@/services/jupiter'
import { type BigNumberValue, fromTokenAmount, parseAmount, ZERO, isZero } from '@/lib/bignumber'
import { addTermsAcceptanceMemoToVersionedTx, MemoType } from '@/lib/transaction-memo'
import {
  type AppTokenId,
  DEFAULT_BASE_TOKEN_ID,
  QUOTE_TOKEN_ID,
  getAppToken,
  getTokenMintAddress,
  getTokenMintConfig,
  getCurrentNetwork,
  getRpcEndpoint,
} from '@/config'

// Direction: QUOTE -> BASE (buy base) or BASE -> QUOTE (sell base)
export type SwapDirection = 'BUY' | 'SELL'

// Pool info is not needed for Jupiter (no pool-specific data), but we keep it for interface compatibility
export interface PoolInfo {
  // Jupiter doesn't have pool-specific info, but we keep minimal structure for compatibility
  dynamicFeePercentage?: string
}

export interface UseJupiterSwapParams {
  baseTokenId?: AppTokenId
  quoteTokenId?: Extract<AppTokenId, 'USDC'>
}

export interface UseJupiterSwapReturn {
  // State
  isLoading: boolean
  error: string | null
  poolInfo: PoolInfo | null
  quote: JupiterSwapQuote | null
  txSignature: string | null

  // Token info
  quoteMint: string
  baseMint: string
  /** Quote token balance as BigNumber for calculations */
  quoteBalance: BigNumberValue | null
  /** Base token balance as BigNumber for calculations */
  baseBalance: BigNumberValue | null

  // Actions
  loadPool: () => Promise<void>
  getQuote: (amount: string, direction: SwapDirection) => Promise<JupiterSwapQuote | null>
  executeSwap: (quote: JupiterSwapQuote, direction: SwapDirection) => Promise<string | null>
  refreshBalances: () => Promise<void>
  clearError: () => void
}

export function useJupiterSwap({
  baseTokenId = DEFAULT_BASE_TOKEN_ID,
  quoteTokenId = QUOTE_TOKEN_ID,
}: UseJupiterSwapParams = {}): UseJupiterSwapReturn {
  const wallet = useWallet()

  // Get current network and configure tokens accordingly
  const CURRENT_NETWORK = getCurrentNetwork()
  const BASE_TOKEN = useMemo(() => getAppToken(baseTokenId), [baseTokenId])
  const QUOTE_TOKEN = useMemo(() => getAppToken(quoteTokenId), [quoteTokenId])
  const BASE_MINT_CONFIG = useMemo(() => getTokenMintConfig(BASE_TOKEN.id, CURRENT_NETWORK), [BASE_TOKEN.id, CURRENT_NETWORK])
  const QUOTE_MINT_CONFIG = useMemo(() => getTokenMintConfig(QUOTE_TOKEN.id, CURRENT_NETWORK), [QUOTE_TOKEN.id, CURRENT_NETWORK])
  const BASE_MINT = useMemo(() => getTokenMintAddress(BASE_TOKEN.id, CURRENT_NETWORK), [BASE_TOKEN.id, CURRENT_NETWORK])
  const QUOTE_MINT = useMemo(() => getTokenMintAddress(QUOTE_TOKEN.id, CURRENT_NETWORK), [QUOTE_TOKEN.id, CURRENT_NETWORK])
  const BASE_DECIMALS = BASE_MINT_CONFIG.decimals
  const QUOTE_DECIMALS = QUOTE_MINT_CONFIG.decimals

  // State
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  const [quote, setQuote] = useState<JupiterSwapQuote | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [quoteBalance, setQuoteBalance] = useState<BigNumberValue | null>(null)
  const [baseBalance, setBaseBalance] = useState<BigNumberValue | null>(null)

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
      setQuoteBalance(null)
      setBaseBalance(null)
      return
    }

    try {
      // Get quote token balance
      const quoteProgram = QUOTE_MINT_CONFIG.program === 'token-2022' ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
      try {
        const quoteMintPubkey = new PublicKey(QUOTE_MINT)
        const ata = await getAssociatedTokenAddress(
          quoteMintPubkey,
          wallet.publicKey,
          false,
          quoteProgram
        )
        const account = await getAccount(connection, ata, 'confirmed', quoteProgram)
        const quoteBigNum = fromTokenAmount(account.amount.toString(), QUOTE_DECIMALS)
        setQuoteBalance(quoteBigNum)
      } catch {
        // Token account doesn't exist
        setQuoteBalance(ZERO)
      }

      // Get base token balance
      const baseProgram = BASE_MINT_CONFIG.program === 'token-2022' ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
      try {
        const baseMintPubkey = new PublicKey(BASE_MINT)
        const ata = await getAssociatedTokenAddress(
          baseMintPubkey,
          wallet.publicKey,
          false,
          baseProgram
        )
        const account = await getAccount(connection, ata, 'confirmed', baseProgram)
        const baseBigNum = fromTokenAmount(account.amount.toString(), BASE_DECIMALS)
        setBaseBalance(baseBigNum)
      } catch {
        setBaseBalance(ZERO)
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err)
    }
  }, [connection, wallet.publicKey, QUOTE_MINT, BASE_MINT, QUOTE_DECIMALS, BASE_DECIMALS, QUOTE_MINT_CONFIG.program, BASE_MINT_CONFIG.program])

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
        const isBuying = direction === 'BUY'
        const inputMint = isBuying ? QUOTE_MINT : BASE_MINT
        const outputMint = isBuying ? BASE_MINT : QUOTE_MINT
        const inputDecimals = isBuying ? QUOTE_DECIMALS : BASE_DECIMALS
        const outputDecimals = isBuying ? BASE_DECIMALS : QUOTE_DECIMALS

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
    [client, QUOTE_MINT, BASE_MINT, QUOTE_DECIMALS, BASE_DECIMALS]
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
        const swapTxWithMemo = await addTermsAcceptanceMemoToVersionedTx(
          swapTx,
          wallet.publicKey,
          MemoType.TRADING,
          connection
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
    quoteMint: QUOTE_MINT,
    baseMint: BASE_MINT,
    quoteBalance,
    baseBalance,
    loadPool,
    getQuote,
    executeSwap,
    refreshBalances,
    clearError,
  }
}
