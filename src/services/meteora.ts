/**
 * Meteora DLMM Service
 *
 * Provides swap functionality using Meteora's Dynamic Liquidity Market Maker (DLMM)
 * on Solana. Supports both DevNet and Mainnet.
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import DLMM from '@meteora-ag/dlmm'
import BN from 'bn.js'
import { BigNumber, math, mathIs, formatBigNumber, type BigNumberValue } from '@/lib/bignumber'
import { DEVNET_POOLS } from '@/config'

export type DevnetPoolId = keyof typeof DEVNET_POOLS
export type PoolId = DevnetPoolId

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
  baseFeePercentage: string
  maxFeePercentage: string
  protocolFeePercentage: string
  dynamicFeePercentage: string
}

export interface BinLiquidity {
  binId: number
  price: string
  pricePerToken: string
  xAmount: string
  yAmount: string
  supply: string
}

export interface MarketDepthData {
  bins: BinLiquidity[]
  activeBinId: number
  binStep: number
  totalTvlX: string
  totalTvlY: string
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
  inAmountValue: BigNumberValue
  outAmountValue: BigNumberValue
  minOutAmountValue: BigNumberValue
  rateValue: BigNumberValue
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

    // Get fee information from the pool
    const feeInfo = pool.getFeeInfo()
    const dynamicFee = pool.getDynamicFee()

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
      baseFeePercentage: feeInfo.baseFeeRatePercentage.toString(),
      maxFeePercentage: feeInfo.maxFeeRatePercentage.toString(),
      protocolFeePercentage: feeInfo.protocolFeePercentage.toString(),
      dynamicFeePercentage: dynamicFee.toString(),
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

    // Get decimals for formatting from SDK token objects
    const tokenXDecimals = (pool.tokenX as { decimal?: number; decimals?: number }).decimal ?? (pool.tokenX as { decimal?: number; decimals?: number }).decimals ?? 6
    const tokenYDecimals = (pool.tokenY as { decimal?: number; decimals?: number }).decimal ?? (pool.tokenY as { decimal?: number; decimals?: number }).decimals ?? 6
    const inDecimals = swapForY ? tokenXDecimals : tokenYDecimals
    const outDecimals = swapForY ? tokenYDecimals : tokenXDecimals

    // Format amounts
    const inAmountFormatted = this.formatAmount(quote.consumedInAmount, inDecimals)
    const outAmountFormatted = this.formatAmount(quote.outAmount, outDecimals)
    const minOutAmountFormatted = this.formatAmount(quote.minOutAmount, outDecimals)

    // Calculate rate using math-literal for precision
    const inBigNum = BigNumber.from(inAmountFormatted)
    const outBigNum = BigNumber.from(outAmountFormatted)
    const rateBigNum = mathIs`${inBigNum} > ${0}` ? math`${outBigNum} / ${inBigNum}` : BigNumber.from(0)
    const rate = formatBigNumber(rateBigNum, { minimumFractionDigits: 6, maximumFractionDigits: 6 })

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
      inAmountValue: inBigNum,
      outAmountValue: outBigNum,
      minOutAmountValue: BigNumber.from(minOutAmountFormatted),
      rateValue: rateBigNum,
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

  /**
   * Get bins around the active bin for market depth visualization
   * @param poolAddress - DLMM pool address
   * @param binsToLeft - Number of bins to fetch to the left of active bin
   * @param binsToRight - Number of bins to fetch to the right of active bin
   */
  async getBinsAroundActiveBin(
    poolAddress: string,
    binsToLeft: number = 17,
    binsToRight: number = 17
  ): Promise<MarketDepthData> {
    const pool = await this.loadPool(poolAddress)

    // Get bins around active bin using SDK method
    const { activeBin, bins } = await pool.getBinsAroundActiveBin(binsToLeft, binsToRight)

    // Calculate total TVL
    let totalTvlX = new BN(0)
    let totalTvlY = new BN(0)

    const binLiquidities: BinLiquidity[] = bins.map((bin) => {
      totalTvlX = totalTvlX.add(new BN(bin.xAmount.toString()))
      totalTvlY = totalTvlY.add(new BN(bin.yAmount.toString()))

      return {
        binId: bin.binId,
        price: bin.price,
        pricePerToken: bin.pricePerToken,
        xAmount: bin.xAmount.toString(),
        yAmount: bin.yAmount.toString(),
        supply: bin.supply.toString(),
      }
    })

    return {
      bins: binLiquidities,
      activeBinId: activeBin,
      binStep: pool.lbPair.binStep,
      totalTvlX: totalTvlX.toString(),
      totalTvlY: totalTvlY.toString(),
    }
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
