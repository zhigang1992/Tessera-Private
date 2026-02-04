import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppTokenAmount } from '@/components/app-token-amount'
import { AppTokenName } from '@/components/app-token-name'
import { getExplorerUrl } from '@/config'
import { useAuctionAlphaVault } from '../../context'
import { toast } from 'sonner'
import { fromTokenAmount, BigNumber, ZERO } from '@/lib/bignumber'

interface WithdrawModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WithdrawModal({ open, onOpenChange }: WithdrawModalProps) {
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const { isLoading, escrowInfo, vaultInfo, withdraw, error, clearError, config } = useAuctionAlphaVault()
  const quoteToken = config.quoteToken

  const depositedAmount = escrowInfo ? fromTokenAmount(escrowInfo.totalDeposited, config.quoteDecimals) : null
  const normalizedDeposit = depositedAmount ?? ZERO
  const userDeposited = BigNumber.toNumber(normalizedDeposit)

  const isWithdrawOpen = vaultInfo?.state === 'deposit_open'
  const canWithdraw = userDeposited > 0 && isWithdrawOpen

  const handleMaxClick = () => {
    setWithdrawAmount(userDeposited.toFixed(2))
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid withdrawal amount')
      return
    }

    if (parseFloat(withdrawAmount) > userDeposited) {
      toast.error('Withdrawal amount exceeds your deposit')
      return
    }

    const signature = await withdraw(withdrawAmount)

    if (signature) {
      toast.success('Withdrawal successful!', {
        description: `Transaction: ${signature.slice(0, 8)}...`,
        action: {
          label: 'View',
          onClick: () =>
            window.open(getExplorerUrl(signature), '_blank'),
        },
      })
      setWithdrawAmount('')
      onOpenChange(false)
    } else if (error) {
      toast.error('Withdrawal failed', { description: error })
      clearError()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw from Vault</DialogTitle>
          <DialogDescription>
            Withdraw your <AppTokenName token={quoteToken} variant="symbol" /> deposit from the Alpha Vault. This is only
            available during the deposit period.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Current deposit info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#71717a] dark:text-[#999]">Your Deposit</span>
            <AppTokenAmount token={quoteToken} amount={normalizedDeposit} showSymbol className="font-mono font-semibold" />
          </div>

          {/* Withdraw input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#71717a] dark:text-[#999]">Amount to Withdraw</span>
              <button
                onClick={handleMaxClick}
                className="text-sm text-zinc-500 hover:text-foreground underline transition-colors"
                disabled={!canWithdraw}
              >
                Max
              </button>
            </div>
            <div className="relative">
              <Input
                type="text"
                value={withdrawAmount}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow numbers and decimal point, limit to 6 decimals
                  if (value === '' || /^\d*\.?\d{0,6}$/.test(value)) {
                    setWithdrawAmount(value)
                  }
                }}
                placeholder="0.00"
                disabled={!canWithdraw || isLoading}
                className="pr-16 text-lg font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                <AppTokenName token={quoteToken} variant="symbol" />
              </span>
            </div>
          </div>

          {!isWithdrawOpen && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Withdrawals are only available during the deposit period.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={isLoading || !canWithdraw || !withdrawAmount}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Withdraw'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
