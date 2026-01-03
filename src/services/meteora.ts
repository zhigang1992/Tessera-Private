/**
 * Meteora DLMM Service
 *
 * Provides swap functionality using Meteora's Dynamic Liquidity Market Maker (DLMM)
 * on Solana. Supports both DevNet and Mainnet.
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import DLMM from '@meteora-ag/dlmm'
import BN from 'bn.js'

// Mainnet SOL-USDC DLMM Pool
// Pool: BGm1tav58oGcsQJehL9WXBFXF7D27vZsKefj4xJKD5Y
// SOL (Wrapped): So11111111111111111111111111111111111111112
// USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
export const MAINNET_POOLS = {
  'SOL-USDC': {
    address: 'BGm1tav58oGcsQJehL9WXBFXF7D27vZsKefj4xJKD5Y',
    tokenX: {
      mint: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      decimals: 9,
    },
    tokenY: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      decimals: 6,
    },
  },
} as const

// DevNet TTT-USDC Pool (for testing)
// Pool: H5hdKWhiw9p2fXXJo9Zbab27HZ4hFUfssw22jEtygKtL
// TTT Mint: 7Psa4ygej7976CvJsz3hNAmW2vZwRKhBbKC9ceGb19Pn
// USDC Mint: 5xFsnWSvZDTatxY9EyGwXbkjYXU75tN5dhMzneA9hPSB
export const DEVNET_POOLS = {
  'TTT-USDC': {
    address: 'H5hdKWhiw9p2fXXJo9Zbab27HZ4hFUfssw22jEtygKtL',
    tokenX: {
      mint: '7Psa4ygej7976CvJsz3hNAmW2vZwRKhBbKC9ceGb19Pn',
      symbol: 'TTT',
      decimals: 6,
    },
    tokenY: {
      mint: '5xFsnWSvZDTatxY9EyGwXbkjYXU75tN5dhMzneA9hPSB',
      symbol: 'USDC',
      decimals: 6,
    },
  },
} as const

export type MainnetPoolId = keyof typeof MAINNET_POOLS
export type DevnetPoolId = keyof typeof DEVNET_POOLS
export type PoolId = MainnetPoolId | DevnetPoolId

export interface TokenInfo {
  mint: string
  symbol: string
  decimals: number
}

export interface PoolInfo {
  address: string
  tokenX: TokenInfo
  tokenY: TokenInfo
  activeBinId: number
  binStep: number
  currentPrice: string
}

export interface MeteoraSwapQuote {
  consumedInAmount: string
  outAmount: string
  minOutAmount: string
  priceImpact: string
  binArraysPubkey: PublicKey[]
  // Human readable values
  inAmountFormatted: string
  outAmountFormatted: string
  minOutAmountFormatted: string
  rate: string
}

export interface SwapParams {
  inToken: PublicKey
  outToken: PublicKey
  inAmount: BN
  minOutAmount: BN
  user: PublicKey
  binArraysPubkey: PublicKey[]
}

/**
 * Meteora DLMM Client for swap operations
 */
export class MeteoraClient {
  private connection: Connection
  private cluster: 'devnet' | 'mainnet-beta'
  private poolCache: Map<string, DLMM> = new Map()

  constructor(connection: Connection, cluster: 'devnet' | 'mainnet-beta' = 'devnet') {
    this.connection = connection
    this.cluster = cluster
  }

  /**
   * Load a DLMM pool by address
   */
  async loadPool(poolAddress: string): Promise<DLMM> {
    // Check cache first
    const cached = this.poolCache.get(poolAddress)
    if (cached) {
      return cached
    }

    const poolPubkey = new PublicKey(poolAddress)
    const pool = await DLMM.create(this.connection, poolPubkey, {
      cluster: this.cluster,
    })

    this.poolCache.set(poolAddress, pool)
    return pool
  }

  /**
   * Get pool information
   */
  async getPoolInfo(poolAddress: string): Promise<PoolInfo> {
    const pool = await this.loadPool(poolAddress)
    const activeBin = await pool.getActiveBin()

    return {
      address: poolAddress,
      tokenX: {
        mint: pool.tokenX.publicKey.toBase58(),
        symbol: pool.tokenX.publicKey.toBase58().slice(0, 4) + '...',
        decimals: (pool.tokenX as { decimal?: number; decimals?: number }).decimal ?? (pool.tokenX as { decimal?: number; decimals?: number }).decimals ?? 9,
      },
      tokenY: {
        mint: pool.tokenY.publicKey.toBase58(),
        symbol: pool.tokenY.publicKey.toBase58().slice(0, 4) + '...',
        decimals: (pool.tokenY as { decimal?: number; decimals?: number }).decimal ?? (pool.tokenY as { decimal?: number; decimals?: number }).decimals ?? 6,
      },
      activeBinId: activeBin.binId,
      binStep: pool.lbPair.binStep,
      currentPrice: activeBin.price,
    }
  }

  /**
   * Get swap quote
   * @param poolAddress - DLMM pool address
   * @param amount - Amount to swap (in smallest units, e.g., lamports)
   * @param swapForY - true if swapping X for Y, false if swapping Y for X
   * @param slippageBps - Slippage tolerance in basis points (100 = 1%)
   */
  async getSwapQuote(
    poolAddress: string,
    amount: BN,
    swapForY: boolean,
    slippageBps: number = 100
  ): Promise<MeteoraSwapQuote> {
    const pool = await this.loadPool(poolAddress)

    // Get bin arrays for swap
    const binArrays = await pool.getBinArrayForSwap(swapForY)

    // Get quote
    const quote = await pool.swapQuote(amount, swapForY, new BN(slippageBps), binArrays)

    // Get decimals for formatting
    // Note: We use known decimals from pool config because SDK token objects
    // may not expose decimals correctly. For SOL-USDC pool:
    // - tokenX (SOL) = 9 decimals
    // - tokenY (USDC) = 6 decimals
    const tokenXDecimals = MAINNET_POOLS['SOL-USDC'].tokenX.decimals // SOL = 9
    const tokenYDecimals = MAINNET_POOLS['SOL-USDC'].tokenY.decimals // USDC = 6
    const inDecimals = swapForY ? tokenXDecimals : tokenYDecimals
    const outDecimals = swapForY ? tokenYDecimals : tokenXDecimals

    // Format amounts
    const inAmountFormatted = this.formatAmount(quote.consumedInAmount, inDecimals)
    const outAmountFormatted = this.formatAmount(quote.outAmount, outDecimals)
    const minOutAmountFormatted = this.formatAmount(quote.minOutAmount, outDecimals)

    // Calculate rate
    const inNum = parseFloat(inAmountFormatted)
    const outNum = parseFloat(outAmountFormatted)
    const rate = inNum > 0 ? (outNum / inNum).toFixed(6) : '0'

    return {
      consumedInAmount: quote.consumedInAmount.toString(),
      outAmount: quote.outAmount.toString(),
      minOutAmount: quote.minOutAmount.toString(),
      priceImpact: quote.priceImpact?.toString() ?? '0',
      binArraysPubkey: quote.binArraysPubkey,
      inAmountFormatted,
      outAmountFormatted,
      minOutAmountFormatted,
      rate,
    }
  }

  /**
   * Create swap transaction
   */
  async createSwapTransaction(
    poolAddress: string,
    swapForY: boolean,
    quote: MeteoraSwapQuote,
    userPublicKey: PublicKey
  ): Promise<Transaction> {
    const pool = await this.loadPool(poolAddress)

    const [inToken, outToken] = swapForY
      ? [pool.tokenX.publicKey, pool.tokenY.publicKey]
      : [pool.tokenY.publicKey, pool.tokenX.publicKey]

    const swapTx = await pool.swap({
      inToken,
      outToken,
      inAmount: new BN(quote.consumedInAmount),
      minOutAmount: new BN(quote.minOutAmount),
      lbPair: pool.pubkey,
      user: userPublicKey,
      binArraysPubkey: quote.binArraysPubkey,
    })

    // Handle transaction type
    if (swapTx instanceof Transaction) {
      return swapTx
    }

    // If it's a versioned transaction or other format, we need to handle it
    throw new Error('Unsupported transaction format')
  }

  /**
   * Format amount from smallest units to human readable
   */
  private formatAmount(amount: BN, decimals: number): string {
    const str = amount.toString().padStart(decimals + 1, '0')
    const intPart = str.slice(0, -decimals) || '0'
    const decPart = str.slice(-decimals)
    return `${intPart}.${decPart}`
  }

  /**
   * Parse human readable amount to smallest units
   */
  static parseAmount(amount: string, decimals: number): BN {
    const [intPart, decPart = ''] = amount.split('.')
    const paddedDec = decPart.padEnd(decimals, '0').slice(0, decimals)
    const fullAmount = intPart + paddedDec
    return new BN(fullAmount)
  }

  /**
   * Get pool tokens for mainnet
   */
  getMainnetPoolTokens(poolId: MainnetPoolId): { tokenX: TokenInfo; tokenY: TokenInfo } {
    const pool = MAINNET_POOLS[poolId]
    return {
      tokenX: { ...pool.tokenX },
      tokenY: { ...pool.tokenY },
    }
  }

  /**
   * Get pool tokens for devnet
   */
  getDevnetPoolTokens(poolId: DevnetPoolId): { tokenX: TokenInfo; tokenY: TokenInfo } {
    const pool = DEVNET_POOLS[poolId]
    return {
      tokenX: { ...pool.tokenX },
      tokenY: { ...pool.tokenY },
    }
  }

  /**
   * Clear pool cache
   */
  clearCache(): void {
    this.poolCache.clear()
  }
}

/**
 * Create a Meteora client instance
 */
export function createMeteoraClient(
  connection: Connection,
  cluster: 'devnet' | 'mainnet-beta' = 'devnet'
): MeteoraClient {
  return new MeteoraClient(connection, cluster)
}
