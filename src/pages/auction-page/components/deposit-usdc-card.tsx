import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Info } from 'lucide-react'

// Mock data for deposit card
const mockDepositData = {
  status: 'open' as const,
  maxDeposit: 5000,
  currentDeposit: 1200,
  estAllocation: 0.0,
  poolAddress: 'Bu879R...',
  targetRaise: 58000,
  currentRaise: 142500,
}

export function DepositUSDCCard() {
  const [depositAmount, setDepositAmount] = useState('')
  const data = mockDepositData

  return (
    <Card className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] dark:from-[#1a2c0d] dark:to-[#243a12] p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-base">
              💵
            </div>
            <h3 className="text-base font-semibold text-foreground">Deposit USDC</h3>
          </div>
          <span className="bg-[#06a800] text-white text-[10px] font-semibold px-2 py-1 rounded tracking-wider">
            OPEN
          </span>
        </div>

        {/* Input Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-[#dddbd0] dark:border-zinc-700 p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-400">You Deposit</span>
              <span className="text-sm text-zinc-400">MAX: {data.maxDeposit.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <button className="flex items-center gap-2.5 border border-[#dddbd0] dark:border-zinc-700 rounded-md px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <div className="w-8 h-8 bg-[#2775ca] rounded-full flex items-center justify-center text-white text-xs font-bold">
                  US
                </div>
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
            <span className="font-mono text-foreground">{data.currentDeposit.toLocaleString()} USDC</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="text-zinc-600 dark:text-zinc-400">Est. Allocation</span>
              <Info className="w-3 h-3 text-zinc-400" />
            </div>
            <span className="font-mono text-[#06a800]">{data.estAllocation.toFixed(4)} TSX</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2.5">
          <Button className="w-full h-14 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 text-lg font-semibold">
            Confirm Deposit
          </Button>

          {/* Notice */}
          <div className="bg-black/10 dark:bg-white/10 rounded-lg p-3 flex items-start gap-3">
            <Info className="w-3 h-3 text-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] text-foreground leading-relaxed">
              You have an active position in this auction. Check the top "My Position" card for
              real-time allocation updates.
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
                {data.poolAddress}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-600 dark:text-zinc-400">Target Raise</span>
              <span className="font-mono text-foreground">${data.targetRaise.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-600 dark:text-zinc-400">Current Raise</span>
              <span className="font-mono text-foreground">${data.currentRaise.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
