/**
 * BigNumber Display Components
 *
 * These components render BigNumber values for display.
 * They handle all the formatting logic in one place.
 */

import { formatBigNumber, type BigNumberValue, type FormatOptions } from '@/lib/bignumber'

export interface BigNumberDisplayProps {
  value: BigNumberValue
  /** Minimum decimal places to show (default: 2) */
  minimumFractionDigits?: number
  /** Maximum decimal places to show (default: 4) */
  maximumFractionDigits?: number
  /** Locale for number formatting (default: 'en-US') */
  locale?: string
  /** Optional suffix to append (e.g., ' USDC') */
  suffix?: string
  /** Optional prefix to prepend (e.g., '$ ') */
  prefix?: string
  /** Optional CSS class */
  className?: string
}

/**
 * Renders a BigNumber value as formatted text.
 * Use this component whenever you need to display a BigNumber in the UI.
 */
export function BigNumberDisplay({
  value,
  minimumFractionDigits = 2,
  maximumFractionDigits = 4,
  locale = 'en-US',
  suffix = '',
  prefix = '',
  className,
}: BigNumberDisplayProps) {
  const options: FormatOptions = {
    minimumFractionDigits,
    maximumFractionDigits,
    locale,
  }

  const formatted = formatBigNumber(value, options)

  return <span className={className}>{prefix}{formatted}{suffix}</span>
}

/**
 * Renders a BigNumber as a currency value (e.g., "$ 1,234.56")
 */
export function BigNumberCurrency({
  value,
  currency = 'USD',
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  className,
}: Omit<BigNumberDisplayProps, 'prefix' | 'suffix'> & { currency?: string }) {
  const prefix = currency === 'USD' ? '$ ' : `${currency} `

  return (
    <BigNumberDisplay
      value={value}
      minimumFractionDigits={minimumFractionDigits}
      maximumFractionDigits={maximumFractionDigits}
      prefix={prefix}
      className={className}
    />
  )
}

/**
 * Renders a BigNumber as a token amount (e.g., "1,234.5678 T-SpaceX")
 */
export function BigNumberToken({
  value,
  symbol,
  minimumFractionDigits = 2,
  maximumFractionDigits = 4,
  className,
}: Omit<BigNumberDisplayProps, 'prefix' | 'suffix'> & { symbol: string }) {
  return (
    <BigNumberDisplay
      value={value}
      minimumFractionDigits={minimumFractionDigits}
      maximumFractionDigits={maximumFractionDigits}
      suffix={` ${symbol}`}
      className={className}
    />
  )
}
