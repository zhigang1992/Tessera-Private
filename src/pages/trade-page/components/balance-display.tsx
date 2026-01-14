import { useQuery } from '@tanstack/react-query'
import { getTokenBalance } from '@/services'
import TokenUsdcIcon from './_/token-usdc.svg?react'

interface BalanceDisplayProps {
  tokenSymbol?: string
}

export function BalanceDisplay({ tokenSymbol = 'USDC' }: BalanceDisplayProps) {
  const { data: balance = 0 } = useQuery({
    queryKey: ['tokenBalance', tokenSymbol],
    queryFn: () => getTokenBalance(tokenSymbol),
  })

  return (
    <div className="flex items-center justify-between p-6 rounded-2xl bg-white dark:bg-[#1e1f20]">
      <span className="text-sm text-foreground dark:text-[#d2d2d2]">Balance:</span>
      <div className="flex items-center gap-1.5">
        <TokenUsdcIcon className="w-6 h-6" />
        <span className="text-sm font-medium text-foreground dark:text-[#d2d2d2]">
          {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}
