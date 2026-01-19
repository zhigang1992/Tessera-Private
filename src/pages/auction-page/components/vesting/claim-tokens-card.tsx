import { useWallet } from '@solana/wallet-adapter-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useAlphaVault } from '@/hooks/use-alpha-vault'
import { formatDuration } from '@/services/alpha-vault-helpers'
import { toast } from 'sonner'
import LockOpenIcon from './_/lock-open.svg?react'

export function ClaimTokensCard() {
  const wallet = useWallet()

  const {
    isLoading,
    vaultInfo,
    claimInfo,
    availableToClaim,
    vestingEndsIn,
    claim,
    withdrawRemaining,
    error,
    clearError,
  } = useAlphaVault()

  const canClaim =
    wallet.connected &&
    claimInfo &&
    parseFloat(claimInfo.availableToClaim) > 0 &&
    (vaultInfo?.state === 'vesting' || vaultInfo?.state === 'vesting_complete')

  const handleClaimTokens = async () => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet')
      return
    }

    if (!canClaim) {
      toast.error('No tokens available to claim')
      return
    }

    const signature = await claim()

    if (signature) {
      toast.success('Claim successful!', {
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
    } else if (error) {
      toast.error('Claim failed', { description: error })
      clearError()
    }
  }

  const handleWithdrawRefund = async () => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet')
      return
    }

    const signature = await withdrawRemaining()

    if (signature) {
      toast.success('Refund withdrawn!', {
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
    } else if (error) {
      toast.error('Withdraw failed', { description: error })
      clearError()
    }
  }

  // Calculate next unlock time display
  const nextUnlockDisplay = vestingEndsIn
    ? `${vestingEndsIn.hours}h ${vestingEndsIn.minutes}m ${vestingEndsIn.seconds}s`
    : claimInfo?.nextUnlockTime
      ? formatDuration(claimInfo.nextUnlockTime.getTime() - Date.now())
      : '-'

  return (
    <Card className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] dark:from-[#1e1f20] dark:to-[#d2fb95] border-0 p-6 h-full">
      <div className="flex flex-col items-center gap-6 h-full justify-between">
        {/* Icon and Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-b from-[#aad36d] to-[#06a800] rounded-full flex items-center justify-center">
            <LockOpenIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Claim Tokens</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You have{' '}
              <span className="font-mono font-semibold text-[#aad36d]">
                {availableToClaim} TESS
              </span>{' '}
              available to claim.
            </p>
          </div>
        </div>

        {/* Claim Button */}
        <div className="w-full flex flex-col gap-4">
          {wallet.connected ? (
            <>
              <Button
                onClick={handleClaimTokens}
                disabled={isLoading || !canClaim}
                className="w-full h-14 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 text-lg font-semibold disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : vaultInfo?.state === 'deposit_open' || vaultInfo?.state === 'deposit_closed' ? (
                  'Vesting Not Started'
                ) : !canClaim ? (
                  'No Tokens to Claim'
                ) : (
                  'Claim Available'
                )}
              </Button>

              {/* Withdraw Refund Button (for prorata mode) */}
              {vaultInfo?.mode === 'prorata' &&
                vaultInfo?.isOversubscribed &&
                (vaultInfo?.state === 'vesting' || vaultInfo?.state === 'vesting_complete') && (
                  <Button
                    onClick={handleWithdrawRefund}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full h-12 text-foreground"
                  >
                    Withdraw Refund
                  </Button>
                )}
            </>
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

          {/* Next Unlock */}
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center">
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
              {vaultInfo?.state === 'vesting_complete' ? 'Vesting complete' : 'Vesting ends in'}
            </p>
            <p className="text-sm font-semibold font-mono text-foreground">
              {vaultInfo?.state === 'vesting_complete' ? 'All tokens unlocked' : nextUnlockDisplay}
            </p>
          </div>

          {/* Vesting Progress */}
          {claimInfo && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Total Allocation</span>
                <span className="font-mono text-foreground">
                  {(parseFloat(claimInfo.totalAllocation) / 10 ** 6).toFixed(4)} TESS
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Already Claimed</span>
                <span className="font-mono text-foreground">
                  {(parseFloat(claimInfo.totalClaimed) / 10 ** 6).toFixed(4)} TESS
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Locked</span>
                <span className="font-mono text-foreground">
                  {(parseFloat(claimInfo.lockedAmount) / 10 ** 6).toFixed(4)} TESS
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
