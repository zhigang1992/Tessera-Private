import type { AppToken, AppTokenId } from '@/config'
import { getAppToken } from '@/config'
import { AppTokenName } from '@/components/app-token-name'
import { ZERO, formatBigNumber, type BigNumberValue } from '@/lib/bignumber'

function resolveToken(token: AppToken | AppTokenId): AppToken {
  return typeof token === 'string' ? getAppToken(token) : token
}

export interface AppTokenCountProps {
  token: AppToken | AppTokenId
  value?: BigNumberValue | null
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
  prefix?: string
  showSymbol?: boolean
  symbolVariant?: 'name' | 'symbol'
  className?: string
  fallback?: string
}

export function AppTokenCount({
  token,
  value,
  minimumFractionDigits = 2,
  maximumFractionDigits = 4,
  locale = 'en-US',
  prefix = '',
  showSymbol = false,
  symbolVariant = 'symbol',
  className,
  fallback = '—',
}: AppTokenCountProps) {
  const resolvedToken = resolveToken(token)
  const hasValue = value !== null && value !== undefined
  const normalizedValue = hasValue ? value! : ZERO

  const formatted = hasValue
    ? formatBigNumber(normalizedValue, {
        minimumFractionDigits,
        maximumFractionDigits,
        locale,
      })
    : fallback

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {showSymbol && hasValue && (
        <>
          {' '}
          <AppTokenName token={resolvedToken} variant={symbolVariant} />
        </>
      )}
    </span>
  )
}
