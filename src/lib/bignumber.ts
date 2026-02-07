/**
 * BigNumber Utilities using math-literal
 *
 * This module provides arbitrary precision arithmetic using math-literal,
 * which wraps decimal.js with a clean template literal syntax.
 *
 * Usage:
 *   import { BigNumber, math, mathIs } from '@/lib/bignumber'
 *
 *   // Create BigNumber
 *   const a = BigNumber.from('123.456')
 *   const b = BigNumber.from(789)
 *
 *   // Math operations using template literals
 *   const sum = math`${a} + ${b}`
 *   const product = math`${a} * ${b}`
 *   const complex = math`(${a} + ${b}) * ${2}`
 *
 *   // Comparisons
 *   const isGreater = mathIs`${a} > ${b}`
 *   const isValid = mathIs`${a} > ${0} && ${a} < ${1000}`
 */

import { BigNumber, math, mathIs } from 'math-literal'

// Re-export math-literal's core functions directly
export { math, mathIs, BigNumber } from 'math-literal'

// Type alias for BigNumber values (backwards compatible with old BigNumber type)
export type BigNumberValue = ReturnType<typeof BigNumber.from>

/**
 * Types that can be converted to a BigNumber
 */
export type BigNumberSource = number | string | bigint | BigNumberValue

/**
 * Hasura returns numeric values with 18 decimal precision.
 */
const HASURA_DECIMALS = 18

/**
 * Convert a Hasura numeric value to BigNumber.
 * Use this for all values coming from GraphQL.
 */
export function fromHasuraToNative(value: BigNumberSource): BigNumberValue {
  const raw = BigNumber.from(value)
  const divisor = BigNumber.from(10)
  // 10^18 divisor
  const hasuraDivisor = math`${divisor} ** ${HASURA_DECIMALS}`
  return math`${raw} / ${hasuraDivisor}`
}

/**
 * Create a BigNumber from any numeric source.
 * @deprecated Use BigNumber.from() instead
 */
export function toBigNumber(value: BigNumberSource): BigNumberValue {
  return BigNumber.from(value)
}

/**
 * Format options for displaying BigNumber values
 */
export interface FormatOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

/**
 * Format a BigNumber for display with locale-aware formatting.
 * This should be the ONLY place where BigNumber is converted to string for UI.
 */
export function formatBigNumber(value: BigNumberValue, options: FormatOptions = {}): string {
  const { minimumFractionDigits = 2, maximumFractionDigits = 4, locale = 'en-US' } = options

  // Convert to number for locale formatting (acceptable for display purposes)
  return BigNumber.toNumber(value).toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  })
}

/**
 * Check if a BigNumber is zero
 */
export function isZero(value: BigNumberValue): boolean {
  return mathIs`${value} === ${0}`
}

/**
 * Check if a BigNumber is greater than zero
 */
export function isPositive(value: BigNumberValue): boolean {
  return mathIs`${value} > ${0}`
}

/**
 * BigNumber constants
 */
export const ZERO = BigNumber.from(0)
export const ONE = BigNumber.from(1)

// ============ Token Amount Utilities ============

/**
 * Convert a raw on-chain token amount to BigNumber.
 * On-chain amounts are stored as integers with a fixed number of decimals.
 * @param rawAmount - The raw amount (e.g., from account.amount)
 * @param decimals - The token's decimal places (e.g., 6 for USDC)
 */
export function fromTokenAmount(rawAmount: BigNumberSource, decimals: number): BigNumberValue {
  const raw = BigNumber.from(rawAmount)
  const divisor = math`${10} ** ${decimals}`
  return math`${raw} / ${divisor}`
}

/**
 * Convert a BigNumber to raw on-chain token amount.
 * @param amount - The human-readable amount
 * @param decimals - The token's decimal places
 */
export function toTokenAmount(amount: BigNumberValue, decimals: number): bigint {
  const multiplier = math`${10} ** ${decimals}`
  const result = math`floor(${amount} * ${multiplier})`
  return BigInt(BigNumber.toString(result))
}

/**
 * Parse a string amount to BigNumber, handling decimal input.
 * Use this when parsing user input.
 */
export function parseAmount(amount: string): BigNumberValue {
  if (!amount || amount === '') return ZERO
  // Handle empty decimal like "123." -> "123.0"
  const normalized = amount.endsWith('.') ? amount + '0' : amount
  try {
    return BigNumber.from(normalized)
  } catch {
    return ZERO
  }
}

// ============ Math Operations (for backwards compatibility) ============
// Prefer using math`${a} + ${b}` template literals directly

/**
 * Multiply two BigNumbers
 * @deprecated Use math`${a} * ${b}` instead
 */
export function multiply(a: BigNumberValue, b: BigNumberValue): BigNumberValue {
  return math`${a} * ${b}`
}

/**
 * Divide two BigNumbers
 * @deprecated Use math`${a} / ${b}` instead
 */
export function divide(a: BigNumberValue, b: BigNumberValue): BigNumberValue {
  if (mathIs`${b} === ${0}`) return ZERO
  return math`${a} / ${b}`
}

/**
 * Add two BigNumbers
 * @deprecated Use math`${a} + ${b}` instead
 */
export function add(a: BigNumberValue, b: BigNumberValue): BigNumberValue {
  return math`${a} + ${b}`
}

/**
 * Subtract two BigNumbers
 * @deprecated Use math`${a} - ${b}` instead
 */
export function subtract(a: BigNumberValue, b: BigNumberValue): BigNumberValue {
  return math`${a} - ${b}`
}

/**
 * Compare two BigNumbers
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 * @deprecated Use mathIs`${a} > ${b}` for comparisons
 */
export function compare(a: BigNumberValue, b: BigNumberValue): -1 | 0 | 1 {
  if (mathIs`${a} < ${b}`) return -1
  if (mathIs`${a} > ${b}`) return 1
  return 0
}

/**
 * Check if a is greater than b
 * @deprecated Use mathIs`${a} > ${b}` instead
 */
export function greaterThan(a: BigNumberValue, b: BigNumberValue): boolean {
  return mathIs`${a} > ${b}`
}

/**
 * Check if a is less than b
 * @deprecated Use mathIs`${a} < ${b}` instead
 */
export function lessThan(a: BigNumberValue, b: BigNumberValue): boolean {
  return mathIs`${a} < ${b}`
}
