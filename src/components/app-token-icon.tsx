import type { ComponentType, SVGProps } from 'react'
import type { AppToken, AppTokenId, TokenIconKey } from '@/config'
import { getAppToken } from '@/config'
import TokenSpaceXIcon from '@/pages/trade-page/components/_/token-spacex.svg?react'
import TokenUsdcIcon from '@/pages/trade-page/components/_/token-usdc.svg?react'

const ICON_MAP: Record<TokenIconKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  't-spacex': TokenSpaceXIcon,
  't-kalshi': TokenSpaceXIcon, // TODO: replace with Kalshi icon when available
  usdc: TokenUsdcIcon,
}

function resolveToken(token: AppToken | AppTokenId): AppToken {
  return typeof token === 'string' ? getAppToken(token) : token
}

export interface AppTokenIconProps {
  token: AppToken | AppTokenId
  size?: number
  className?: string
}

export function AppTokenIcon({ token, size = 48, className }: AppTokenIconProps) {
  const resolvedToken = resolveToken(token)

  if (resolvedToken.iconUrl) {
    return (
      <img
        src={resolvedToken.iconUrl}
        alt={`${resolvedToken.displayName} icon`}
        width={size}
        height={size}
        className={className}
      />
    )
  }

  const IconComponent = ICON_MAP[resolvedToken.iconKey]

  if (!IconComponent) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, borderRadius: '50%', background: '#e5e7eb' }}
      />
    )
  }

  return <IconComponent className={className} width={size} height={size} />
}
