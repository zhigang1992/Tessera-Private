import Decimal from 'decimal.js'

/**
 * Types that can be converted to a BigNumber
 */
export type BigNumberSource = number | string | bigint | Decimal

/**
 * Hasura returns numeric values with 18 decimal precision.
 * This function converts those values to native decimal numbers.
 */
const HASURA_DECIMALS = 18
const HASURA_DIVISOR = new Decimal(10).pow(HASURA_DECIMALS)

export function fromHasuraToNative(value: BigNumberSource): number {
  return new Decimal(value.toString()).div(HASURA_DIVISOR).toNumber()
}

export { Decimal }
