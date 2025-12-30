/**
 * React Hook for Meteora DLMM Swap Operations
 *
 * Uses the SOL-USDC pool on Mainnet
 * - USDC is the quote token (what you pay with when buying SOL)
 * - SOL is the base token (what you buy/sell)
 */

import { useState, useCallback, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'
import {
  MeteoraClient,
  createMeteoraClient,
  MAINNET_POOLS,
  type MeteoraSwapQuote,
  type PoolInfo,
} from '@/services/meteora'

// Get mainnet RPC URL from environment or use default
const MAINNET_RPC_URL = import.meta.env.VITE_MAINNET_RPC_URL || clusterApiUrl('mainnet-beta')

// Direction: USDC -> SOL (buy SOL) or SOL -> USDC (sell SOL)
export type SwapDirection = 'USDC_TO_SOL' | 'SOL_TO_USDC'

export interface UseMeteoraSwapReturn {
  // State
  isLoading: boolean
  error: string | null
  poolInfo: PoolInfo | null
  quote: MeteoraSwapQuote | null
  txSignature: string | null

  // Token info
  usdcMint: string
  solMint: string
  usdcBalance: string | null
  solBalance: string | null

  // Actions
  loadPool: () => Promise<void>
  getQuote: (amount: string, direction: SwapDirection) => Promise<MeteoraSwapQuote | null>
  executeSwap: (quote: MeteoraSwapQuote, direction: SwapDirection) => Promise<string | null>
  refreshBalances: () => Promise<void>
  clearError: () => void
}

// Pool configuration - SOL is tokenX, USDC is tokenY
const POOL_ADDRESS = MAINNET_POOLS['SOL-USDC'].address
const SOL_MINT = MAINNET_POOLS['SOL-USDC'].tokenX.mint
const USDC_MINT = MAINNET_POOLS['SOL-USDC'].tokenY.mint
const SOL_DECIMALS = MAINNET_POOLS['SOL-USDC'].tokenX.decimals
const USDC_DECIMALS = MAINNET_POOLS['SOL-USDC'].tokenY.decimals

export function useMeteoraSwap(): UseMeteoraSwapReturn {
  const wallet = useWallet()

  // State
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  const [quote, setQuote] = useState<MeteoraSwapQuote | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null)
  const [solBalance, setSolBalance] = useState<string | null>(null)

  // Create a dedicated mainnet connection for swap operations
  // This is separate from the wallet adapter connection which may be on devnet
  const mainnetConnection = useMemo(() => {
    return new Connection(MAINNET_RPC_URL, 'confirmed')
  }, [])

  // Create client with mainnet connection
  const client = useMemo(() => {
    return createMeteoraClient(mainnetConnection, 'mainnet-beta')
  }, [mainnetConnection])

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

  // Refresh token balances from mainnet
  const refreshBalances = useCallback(async () => {
    if (!wallet.publicKey) {
      setUsdcBalance(null)
      setSolBalance(null)
      return
    }

    try {
      // Get USDC balance on mainnet
      try {
        const usdcMintPubkey = new PublicKey(USDC_MINT)
        const ata = await getAssociatedTokenAddress(usdcMintPubkey, wallet.publicKey)
        const account = await getAccount(mainnetConnection, ata)
        const usdcFormatted = (Number(account.amount) / 10 ** USDC_DECIMALS).toFixed(2)
        setUsdcBalance(usdcFormatted)
      } catch {
        // Token account doesn't exist on mainnet
        setUsdcBalance('0.00')
      }

      // Get native SOL balance on mainnet
      try {
        const balance = await mainnetConnection.getBalance(wallet.publicKey)
        const solFormatted = (balance / LAMPORTS_PER_SOL).toFixed(4)
        setSolBalance(solFormatted)
      } catch {
        setSolBalance('0.0000')
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err)
    }
  }, [mainnetConnection, wallet.publicKey])

  // Get swap quote
  // In the pool: tokenX = SOL, tokenY = USDC
  // swapForY = true means X -> Y (SOL -> USDC, selling SOL)
  // swapForY = false means Y -> X (USDC -> SOL, buying SOL)
  const getQuote = useCallback(
    async (amount: string, direction: SwapDirection): Promise<MeteoraSwapQuote | null> => {
      if (!amount || parseFloat(amount) <= 0) {
        setQuote(null)
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        // USDC_TO_SOL = buying SOL with USDC = Y -> X = swapForY = false
        // SOL_TO_USDC = selling SOL for USDC = X -> Y = swapForY = true
        const swapForY = direction === 'SOL_TO_USDC'
        const decimals = direction === 'USDC_TO_SOL' ? USDC_DECIMALS : SOL_DECIMALS
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
        // USDC_TO_SOL = buying SOL = Y -> X = swapForY = false
        // SOL_TO_USDC = selling SOL = X -> Y = swapForY = true
        const swapForY = direction === 'SOL_TO_USDC'

        // Create swap transaction
        const swapTx = await client.createSwapTransaction(
          POOL_ADDRESS,
          swapForY,
          swapQuote,
          wallet.publicKey
        )

        // Set recent blockhash and fee payer using mainnet connection
        const { blockhash, lastValidBlockHeight } = await mainnetConnection.getLatestBlockhash()
        swapTx.recentBlockhash = blockhash
        swapTx.feePayer = wallet.publicKey

        // Sign and send to mainnet
        const signed = await wallet.signTransaction(swapTx)
        const signature = await mainnetConnection.sendRawTransaction(signed.serialize())

        // Confirm transaction on mainnet
        await mainnetConnection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        })

        setTxSignature(signature)

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
    [client, mainnetConnection, wallet, refreshBalances]
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
    solMint: SOL_MINT,
    usdcBalance,
    solBalance,
    loadPool,
    getQuote,
    executeSwap,
    refreshBalances,
    clearError,
  }
}
