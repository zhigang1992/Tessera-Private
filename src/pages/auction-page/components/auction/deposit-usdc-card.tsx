import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Info } from 'lucide-react'
import { getDepositInfo } from '@/services'
import UsdcIcon from '@/pages/trade-page/components/_/token-usdc.svg?react'

export function DepositUSDCCard() {
  const [depositAmount, setDepositAmount] = useState('')
  const [isDepositing, setIsDepositing] = useState(false)

  const { data: depositInfo } = useQuery({
    queryKey: ['depositInfo'],
    queryFn: getDepositInfo,
  })

  const handleConfirmDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid deposit amount')
      return
    }
    setIsDepositing(true)
    // Mock deposit action
    await new Promise((resolve) => setTimeout(resolve, 1500))
    alert(`Successfully deposited ${depositAmount} USDC`)
    setDepositAmount('')
    setIsDepositing(false)
  }

  const handleMaxClick = () => {
    setDepositAmount(depositInfo?.maxDeposit.toString() ?? '0')
  }

  return (
    <Card className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] dark:from-[#1e1f20] dark:to-[#d2fb95] border-0 p-6 h-full">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">Deposit USDC</h3>
          </div>
          <span className="bg-[#06a800] text-white text-[10px] font-semibold px-2 py-1 rounded tracking-wider">
            {depositInfo?.status === 'open' ? 'OPEN' : 'CLOSED'}
          </span>
        </div>

        {/* Input Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-[#dddbd0] dark:border-zinc-700 p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-400">You Deposit</span>
              <button
                onClick={handleMaxClick}
                className="text-sm text-zinc-400 hover:text-foreground transition-colors"
              >
                MAX: {depositInfo?.maxDeposit.toLocaleString() ?? '0'}
              </button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <button className="flex items-center gap-2.5 border border-[#dddbd0] dark:border-zinc-700 rounded-md px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <UsdcIcon className="w-8 h-8" />
                <span className="text-xl font-semibold text-foreground">USDC</span>
              </button>
              <Input
                type="text"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.0"
                className="text-right text-4xl font-semibold border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Current Deposit</span>
            <span className="font-mono text-foreground">
              {depositInfo?.currentDeposit.toLocaleString() ?? '0'} USDC
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="text-zinc-600 dark:text-zinc-400">Est. Allocation</span>
              <Info className="w-3 h-3 text-zinc-400" />
            </div>
            <span className="font-mono text-[#06a800]">{depositInfo?.estAllocation.toFixed(4) ?? '0.0000'} TSX</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2.5">
          <Button
            onClick={handleConfirmDeposit}
            disabled={isDepositing}
            className="w-full h-14 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 text-lg font-semibold disabled:opacity-50"
          >
            {isDepositing ? 'Depositing...' : 'Confirm Deposit'}
          </Button>

          {/* Notice */}
          <div className="bg-white/50 dark:bg-white/10 rounded-lg px-3 pt-3 pb-0 flex items-start gap-2.5">
            <Info className="w-3 h-3 text-foreground shrink-0" />
            <p className="text-[10px] text-foreground leading-[1.65]">
              You have an active position in this auction. Check the top "My Position" card for real-time allocation
              updates.
            </p>
          </div>
        </div>

        {/* Pool Details */}
        <div className="border-t border-zinc-200/10 dark:border-zinc-700/10 pt-4 flex flex-col gap-2">
          <span className="text-[10px] font-semibold text-foreground tracking-wider">POOL DETAILS</span>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-600 dark:text-zinc-400">Address</span>
              <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded font-mono text-foreground">
                {depositInfo?.poolAddress ?? '-'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-600 dark:text-zinc-400">Target Raise</span>
              <span className="font-mono text-foreground">${depositInfo?.targetRaise.toLocaleString() ?? '0'}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-600 dark:text-zinc-400">Current Raise</span>
              <span className="font-mono text-foreground">${depositInfo?.currentRaise.toLocaleString() ?? '0'}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
