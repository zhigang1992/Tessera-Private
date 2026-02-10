/**
 * Jupiter Aggregator Service
 *
 * Provides swap functionality using Jupiter's aggregator API
 * on Solana. Supports both DevNet and Mainnet.
 */

import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js'
import { createJupiterApiClient, type QuoteResponse, type SwapResponse, type RoutePlanStep } from '@jup-ag/api'
import { BigNumber, math, mathIs, formatBigNumber, type BigNumberValue } from '@/lib/bignumber'

export interface JupiterSwapQuote {
  // Raw values from Jupiter
  inAmount: string
  outAmount: string
  otherAmountThreshold: string // min out amount after slippage
  priceImpactPct: string

  // Human readable formatted values
  inAmountFormatted: string
  outAmountFormatted: string
  minOutAmountFormatted: string
  rate: string

  // BigNumber values for calculations
  inAmountValue: BigNumberValue
  outAmountValue: BigNumberValue
  minOutAmountValue: BigNumberValue
  rateValue: BigNumberValue

  // Route information
  routePlan: RoutePlanStep[]
  routeLabel: string // Human-readable route string (e.g., "Raydium → Orca")

  // Original quote response for transaction building
  _rawQuote: QuoteResponse
}

/**
 * Jupiter Aggregator Client for swap operations
 */
export class JupiterClient {
  private jupiterApi: ReturnType<typeof createJupiterApiClient>

  constructor(_connection: Connection, apiKey?: string) {
    this.jupiterApi = createJupiterApiClient(apiKey ? { apiKey } : undefined)
  }

  /**
   * Format route plan into a human-readable string
   * @param routePlan - Array of route plan steps from Jupiter
   * @returns Formatted route string (e.g., "Raydium → Orca" or "Raydium (50%) + Orca (50%)")
   */
  private formatRoutePlan(routePlan: RoutePlanStep[]): string {
    if (routePlan.length === 0) {
      return 'Jupiter Aggregator'
    }

    // Check if this is a split route (multiple swaps at same level with percentages)
    const hasSplitRoute = routePlan.some(step => step.percent !== null && step.percent !== undefined)

    if (hasSplitRoute) {
      // Format as split route: "Raydium (50%) + Orca (50%)"
      const splits = routePlan
        .map(step => {
          const label = step.swapInfo.label || 'Unknown DEX'
          const percent = step.percent ? `${step.percent}%` : '100%'
          return `${label} (${percent})`
        })
        .join(' + ')
      return splits
    } else {
      // Format as sequential route: "Raydium → Orca → Meteora"
      const labels = routePlan
        .map(step => step.swapInfo.label || 'Unknown DEX')
        .filter((label, index, arr) => arr.indexOf(label) === index) // Remove duplicates
      return labels.join(' → ')
    }
  }

  /**
   * Get swap quote from Jupiter aggregator
   * @param inputMint - Input token mint address
   * @param outputMint - Output token mint address
   * @param amount - Amount to swap (in smallest units, e.g., lamports)
   * @param slippageBps - Slippage tolerance in basis points (100 = 1%)
   * @param inputDecimals - Decimals for input token (for formatting)
   * @param outputDecimals - Decimals for output token (for formatting)
   */
  async getSwapQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 100,
    inputDecimals: number = 6,
    outputDecimals: number = 6
  ): Promise<JupiterSwapQuote> {
    // Get quote from Jupiter
    const quote = await this.jupiterApi.quoteGet({
      inputMint,
      outputMint,
      amount: parseInt(amount),
      slippageBps,
    })

    if (!quote) {
      throw new Error('Unable to get quote from Jupiter')
    }

    // Format amounts
    const inAmountFormatted = this.formatAmount(quote.inAmount, inputDecimals)
    const outAmountFormatted = this.formatAmount(quote.outAmount, outputDecimals)
    const minOutAmountFormatted = this.formatAmount(quote.otherAmountThreshold, outputDecimals)

    // Calculate rate using math-literal for precision
    const inBigNum = BigNumber.from(inAmountFormatted)
    const outBigNum = BigNumber.from(outAmountFormatted)
    const rateBigNum = mathIs`${inBigNum} > ${0}` ? math`${outBigNum} / ${inBigNum}` : BigNumber.from(0)
    const rate = formatBigNumber(rateBigNum, { minimumFractionDigits: 6, maximumFractionDigits: 6 })

    // Format route information
    const routePlan = quote.routePlan || []
    const routeLabel = this.formatRoutePlan(routePlan)

    return {
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      otherAmountThreshold: quote.otherAmountThreshold,
      priceImpactPct: quote.priceImpactPct,
      inAmountFormatted,
      outAmountFormatted,
      minOutAmountFormatted,
      rate,
      inAmountValue: inBigNum,
      outAmountValue: outBigNum,
      minOutAmountValue: BigNumber.from(minOutAmountFormatted),
      rateValue: rateBigNum,
      routePlan,
      routeLabel,
      _rawQuote: quote,
    }
  }

  /**
   * Create swap transaction from quote
   * @param quote - Jupiter swap quote
   * @param userPublicKey - User's wallet public key
   */
  async createSwapTransaction(
    quote: JupiterSwapQuote,
    userPublicKey: PublicKey
  ): Promise<VersionedTransaction> {
    // Get swap transaction from Jupiter
    const swapResponse: SwapResponse = await this.jupiterApi.swapPost({
      swapRequest: {
        quoteResponse: quote._rawQuote,
        userPublicKey: userPublicKey.toBase58(),
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 10000000,
            priorityLevel: 'veryHigh',
          },
        },
      },
    })

    // Deserialize the base64 transaction
    const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64')
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf)

    return transaction
  }

  /**
   * Format amount from smallest units to human readable
   */
  private formatAmount(amount: string | number, decimals: number): string {
    const str = amount.toString().padStart(decimals + 1, '0')
    const intPart = str.slice(0, -decimals) || '0'
    const decPart = str.slice(-decimals)
    return `${intPart}.${decPart}`
  }

  /**
   * Parse human readable amount to smallest units
   */
  static parseAmount(amount: string, decimals: number): string {
    const [intPart, decPart = ''] = amount.split('.')
    const paddedDec = decPart.padEnd(decimals, '0').slice(0, decimals)
    const fullAmount = intPart + paddedDec
    return fullAmount
  }
}

/**
 * Create a Jupiter client instance
 */
export function createJupiterClient(connection: Connection, apiKey?: string): JupiterClient {
  return new JupiterClient(connection, apiKey)
}
