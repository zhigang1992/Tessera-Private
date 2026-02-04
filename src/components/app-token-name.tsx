import type { AppToken, AppTokenId } from '@/config'
import { getAppToken } from '@/config'

function resolveToken(token: AppToken | AppTokenId): AppToken {
  return typeof token === 'string' ? getAppToken(token) : token
}

export interface AppTokenNameProps {
  token: AppToken | AppTokenId
  variant?: 'name' | 'symbol'
  className?: string
}

export function AppTokenName({ token, variant = 'name', className }: AppTokenNameProps) {
  const resolvedToken = resolveToken(token)
  const text = variant === 'symbol' ? resolvedToken.symbol : resolvedToken.displayName

  return <span className={className}>{text}</span>
}
