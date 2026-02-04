import { useQuery } from '@tanstack/react-query'
import { AppTokenIcon } from '@/components/app-token-icon'
import { AppTokenName } from '@/components/app-token-name'
import { getAppToken, getTokenBySymbol, QUOTE_TOKEN_ID } from '@/config'
import { getTokenBalance } from '@/services'

interface BalanceDisplayProps {
  tokenSymbol?: string
}

export function BalanceDisplay({ tokenSymbol = 'USDC' }: BalanceDisplayProps) {
  const token = getTokenBySymbol(tokenSymbol) ?? getAppToken(QUOTE_TOKEN_ID)

  const { data: balance = 0 } = useQuery({
    queryKey: ['tokenBalance', tokenSymbol],
    queryFn: () => getTokenBalance(tokenSymbol),
  })

  return (
    <div className="flex items-center justify-between p-6 rounded-2xl bg-white dark:bg-[#1e1f20]">
      <span className="text-sm text-foreground dark:text-[#d2d2d2]">Balance:</span>
      <div className="flex items-center gap-1.5">
        <AppTokenIcon token={token} size={24} className="w-6 h-6" />
        <span className="text-sm font-medium text-foreground dark:text-[#d2d2d2] flex items-center gap-1">
          {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <AppTokenName token={token} variant="symbol" />
        </span>
      </div>
    </div>
  )
}
