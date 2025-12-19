import TokenUsdcIcon from './_/token-usdc.svg?react'

interface BalanceDisplayProps {
  balance?: number
  tokenSymbol?: string
}

export function BalanceDisplay({ balance = 2399.89, tokenSymbol = 'USDC' }: BalanceDisplayProps) {
  return (
    <div className="flex items-center justify-between p-6 rounded-2xl bg-white">
      <span className="text-sm text-black">Balance:</span>
      <div className="flex items-center gap-1.5">
        <TokenUsdcIcon className="w-6 h-6" />
        <span className="text-sm font-medium text-black">
          {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}
