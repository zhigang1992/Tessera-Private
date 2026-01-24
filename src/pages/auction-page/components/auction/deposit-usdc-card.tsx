import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Info, ExternalLink, Loader2 } from 'lucide-react'
import { useAlphaVault } from '@/hooks/use-alpha-vault'
import { ALPHA_VAULT_CONFIG } from '@/services/alpha-vault'
import { toast } from 'sonner'
import UsdcIcon from '@/pages/trade-page/components/_/token-usdc.svg?react'

export function DepositUSDCCard() {
  const wallet = useWallet()
  const [depositAmount, setDepositAmount] = useState('')

  const {
    isLoading,
    vaultInfo,
    vaultStateDisplay,
    escrowInfo,
    depositQuota,
    usdcBalance,
    totalRaised,
    targetRaise,
    estimatedAllocation,
    deposit,
    error,
    clearError,
  } = useAlphaVault()

  const isDepositOpen = vaultInfo?.state === 'deposit_open'
  const canDeposit = depositQuota?.canDeposit && isDepositOpen && wallet.connected

  const handleConfirmDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid deposit amount')
      return
    }

    if (!wallet.connected) {
      toast.error('Please connect your wallet')
      return
    }

    const signature = await deposit(depositAmount)

    if (signature) {
      toast.success('Deposit successful!', {
        description: `Transaction: ${signature.slice(0, 8)}...`,
        action: {
          label: 'View',
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
              '_blank'
            ),
        },
      })
      setDepositAmount('')
    } else if (error) {
      toast.error('Deposit failed', { description: error })
      clearError()
    }
  }

  const handleMaxClick = () => {
    // Use the smaller of: user's USDC balance or remaining deposit quota
    const balance = parseFloat(usdcBalance ?? '0')
    const quota = parseFloat(depositQuota?.remainingQuota ?? '0') / 10 ** 6

    const maxAmount = Math.min(balance, quota)
    setDepositAmount(maxAmount > 0 ? maxAmount.toFixed(2) : '0')
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <Card className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] p-6 h-full">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-black">Deposit USDC</h3>
          </div>
          <span
            className="text-white text-[10px] font-semibold px-2 py-1 rounded tracking-wider"
            style={{ backgroundColor: vaultStateDisplay?.color ?? '#6b7280' }}
          >
            {vaultStateDisplay?.label ?? 'LOADING'}
          </span>
        </div>

        {/* Input Section */}
        <div className="bg-white dark:bg-[rgba(255,255,255,0.03)] rounded-lg border border-[#dddbd0] dark:border-[#666] p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#666]">You Deposit</span>
              <button
                onClick={handleMaxClick}
                className="text-sm text-[#666] hover:text-black transition-colors"
                disabled={!canDeposit}
              >
                MAX: {usdcBalance ?? '0.00'}
              </button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <button className="flex items-center gap-2.5 border border-[#dddbd0] rounded-md px-3 py-2 hover:bg-white/50 transition-colors">
                <UsdcIcon className="w-8 h-8" />
                <span className="text-xl font-semibold text-black">USDC</span>
              </button>
              <Input
                type="text"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.0"
                disabled={!canDeposit}
                className="text-right text-4xl font-semibold border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#666]">Your Deposit</span>
            <span className="font-mono text-black">
              {escrowInfo
                ? `${(parseFloat(escrowInfo.totalDeposited) / 10 ** 6).toLocaleString()} USDC`
                : '0 USDC'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="text-[#666]">Est. Allocation</span>
              <Info className="w-3 h-3 text-[#666]" />
            </div>
            <span className="font-mono text-[#06a800]">{estimatedAllocation} TESS</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2.5">
          {wallet.connected ? (
            <Button
              onClick={handleConfirmDeposit}
              disabled={isLoading || !canDeposit}
              className="w-full h-14 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 text-lg font-semibold disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : !isDepositOpen ? (
                'Deposits Closed'
              ) : !depositQuota?.canDeposit ? (
                depositQuota?.reason ?? 'Cannot Deposit'
              ) : (
                'Confirm Deposit'
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                /* Trigger wallet modal via wallet adapter */
              }}
              className="w-full h-14 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 text-lg font-semibold"
            >
              Connect Wallet
            </Button>
          )}

          {/* Notice */}
          {escrowInfo && (
            <div className="bg-white/50 rounded-lg px-3 pt-3 pb-0 flex items-start gap-2.5">
              <Info className="w-3 h-3 text-black shrink-0" />
              <p className="text-[10px] text-black leading-[1.65]">
                You have an active position in this auction. Check the top "My Position" card for
                real-time allocation updates.
              </p>
            </div>
          )}
        </div>

        {/* Pool Details */}
        <div className="border-t border-[rgba(17,17,17,0.1)] pt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-black tracking-wider">
              VAULT DETAILS
            </span>
            <a
              href={ALPHA_VAULT_CONFIG.meteoraUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#666] hover:text-black flex items-center gap-1"
            >
              View on Meteora
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#666]">Address</span>
              <span className="bg-black/10 px-2 py-0.5 rounded font-mono text-black">
                {shortenAddress(ALPHA_VAULT_CONFIG.vault)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#666]">Target Raise</span>
              <span className="font-mono text-black">${targetRaise}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#666]">Current Raise</span>
              <span className="font-mono text-black">${totalRaised}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
