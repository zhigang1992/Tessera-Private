import Decimal from 'decimal.js'

/**
 * BigNumber is the core type for all numeric calculations in the app.
 * Use this instead of native number to preserve precision.
 */
export type BigNumber = Decimal

/**
 * Types that can be converted to a BigNumber
 */
export type BigNumberSource = number | string | bigint | Decimal

/**
 * Hasura returns numeric values with 18 decimal precision.
 */
const HASURA_DECIMALS = 18
const HASURA_DIVISOR = new Decimal(10).pow(HASURA_DECIMALS)

/**
 * Convert a Hasura numeric value to BigNumber.
 * Use this for all values coming from GraphQL.
 */
export function fromHasuraToNative(value: BigNumberSource): BigNumber {
  return new Decimal(value.toString()).div(HASURA_DIVISOR)
}

/**
 * Create a BigNumber from any numeric source.
 */
export function toBigNumber(value: BigNumberSource): BigNumber {
  return new Decimal(value.toString())
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
export function formatBigNumber(
  value: BigNumber,
  options: FormatOptions = {}
): string {
  const { minimumFractionDigits = 2, maximumFractionDigits = 4, locale = 'en-US' } = options

  // Convert to number for locale formatting (acceptable for display purposes)
  return value.toNumber().toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  })
}

/**
 * Check if a BigNumber is zero
 */
export function isZero(value: BigNumber): boolean {
  return value.isZero()
}

/**
 * Check if a BigNumber is greater than zero
 */
export function isPositive(value: BigNumber): boolean {
  return value.greaterThan(0)
}

/**
 * BigNumber constants
 */
export const ZERO = new Decimal(0)
export const ONE = new Decimal(1)

export { Decimal }
