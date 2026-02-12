/**
 * Meteora DLMM Service
 *
 * Provides swap functionality using Meteora's Dynamic Liquidity Market Maker (DLMM)
 * on Solana. Supports both DevNet and Mainnet.
 */

import { DEVNET_POOLS } from '@/config'
import { type BigNumberValue } from '@/lib/bignumber'
import DLMM from '@meteora-ag/dlmm'
import { Connection, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

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

    const binLiquidities: BinLiquidity[] = bins.map((bin) => {
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
