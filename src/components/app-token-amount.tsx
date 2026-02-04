import type { AppToken, AppTokenId } from '@/config'
import { getAppToken } from '@/config'
import { AppTokenName } from '@/components/app-token-name'
import { BigNumber, formatBigNumber, type BigNumberSource, type FormatOptions } from '@/lib/bignumber'

function resolveToken(token: AppToken | AppTokenId): AppToken {
  return typeof token === 'string' ? getAppToken(token) : token
}

function normalizeAmount(amount?: BigNumberSource | null): BigNumberSource {
  if (amount === undefined || amount === null) {
    return 0
  }

  if (typeof amount === 'string') {
    const stripped = amount.replace(/,/g, '').trim()
    return stripped === '' ? '0' : stripped
  }

  return amount
}

export interface AppTokenAmountProps {
  token: AppToken | AppTokenId
  amount?: BigNumberSource | null
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
  prefix?: string
  showSymbol?: boolean
  symbolVariant?: 'name' | 'symbol'
  className?: string
}

export function AppTokenAmount({
  token,
  amount = 0,
  minimumFractionDigits = 2,
  maximumFractionDigits = 4,
  locale = 'en-US',
  prefix = '',
  showSymbol = false,
  symbolVariant = 'symbol',
  className,
}: AppTokenAmountProps) {
  const resolvedToken = resolveToken(token)
  const normalizedAmount = normalizeAmount(amount)
  const value = BigNumber.from(normalizedAmount)

  const options: FormatOptions = {
    minimumFractionDigits,
    maximumFractionDigits,
    locale,
  }

  const formatted = formatBigNumber(value, options)

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {showSymbol && (
        <>
          {' '}
          <AppTokenName token={resolvedToken} variant={symbolVariant} />
        </>
      )}
    </span>
  )
}
