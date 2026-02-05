import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { AppTokenName } from '@/components/app-token-name'
import { AppTokenAmount } from '@/components/app-token-amount'
import { getExplorerUrl } from '@/config'
import { formatDuration } from '@/services/alpha-vault-helpers'
import { toast } from 'sonner'
import { fromTokenAmount, ZERO, mathIs } from '@/lib/bignumber'
import LockOpenIcon from './_/lock-open.svg?react'
import { useAuctionAlphaVault, useAuctionToken } from '../../context'

export function ClaimTokensCard() {
  const wallet = useWallet()
  const { setVisible } = useWalletModal()
  const token = useAuctionToken()

  const {
    config,
    isLoading,
    vaultInfo,
    escrowInfo,
    claimInfo,
    vestingEndsIn,
    claim,
    withdrawRemaining,
    error,
    clearError,
  } = useAuctionAlphaVault()
  const quoteToken = config.quoteToken

  const depositedAmount = escrowInfo ? fromTokenAmount(escrowInfo.totalDeposited, config.quoteDecimals) : null
  const depositedAmountValue = depositedAmount ?? ZERO
  const totalAllocationAmount = claimInfo ? fromTokenAmount(claimInfo.totalAllocation, config.baseDecimals) : null
  const totalAllocationValue = totalAllocationAmount ?? ZERO
  const totalClaimedAmount = claimInfo ? fromTokenAmount(claimInfo.totalClaimed, config.baseDecimals) : null
  const totalClaimedValue = totalClaimedAmount ?? ZERO
  const lockedAmount = claimInfo ? fromTokenAmount(claimInfo.lockedAmount, config.baseDecimals) : null
  const lockedAmountValue = lockedAmount ?? ZERO
  const availableAmount = claimInfo ? fromTokenAmount(claimInfo.availableToClaim, config.baseDecimals) : null
  const availableAmountValue = availableAmount ?? ZERO

  const hasDepositedFunds = escrowInfo ? mathIs`${depositedAmountValue} > ${0}` : false

  const canClaim =
    wallet.connected &&
    claimInfo &&
    mathIs`${availableAmountValue} > ${0}` &&
    (vaultInfo?.state === 'vesting' || vaultInfo?.state === 'vesting_complete')

  const hasClaimedAll =
    claimInfo &&
    mathIs`${totalClaimedValue} > ${0}` &&
    mathIs`${availableAmountValue} === ${0}` &&
    mathIs`${totalAllocationValue} > ${0}`

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
          onClick: () => window.open(getExplorerUrl(signature), '_blank'),
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
          onClick: () => window.open(getExplorerUrl(signature), '_blank'),
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

  // Render different layouts based on config
  if (!config.hasVestingPeriod) {
    // Check for purchase failure case
    if (vaultInfo?.purchaseFailed) {
      return (
        <div className="w-full rounded-2xl border p-6 bg-white dark:bg-[#323334] border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] flex flex-col justify-center items-center text-center">
          {/* Warning Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ef4444] flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-white" strokeWidth={2} />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-semibold leading-8 mb-3 text-black dark:text-[#d2d2d2]">
            Token Purchase Failed
          </h3>

          {/* Description */}
          <p className="text-sm font-normal leading-[21px] mb-6 text-[#666] dark:text-[#999]">
            The vault did not complete the token purchase during the buying window. You can withdraw your deposited{' '}
            <AppTokenName token={quoteToken} variant="symbol" /> back to your wallet.
          </p>

          {/* Deposit Amount Info */}
          {hasDepositedFunds && (
            <div className="w-full bg-[#f5f5f5] dark:bg-[#2a2b2c] rounded-lg p-4 mb-6">
              <p className="text-xs text-[#666] dark:text-[#999] mb-1">Your Deposited Amount</p>
              <p className="text-xl font-semibold font-mono text-black dark:text-[#d2d2d2]">
                <AppTokenAmount token={quoteToken} amount={depositedAmountValue} showSymbol />
              </p>
            </div>
          )}

          {/* Withdraw USDC Button */}
          {wallet.connected ? (
            <button
              onClick={handleWithdrawRefund}
              disabled={isLoading}
              className="h-14 w-full rounded-lg bg-black hover:bg-[#333] transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span className="text-lg font-semibold leading-7 text-white">
                      Processing...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-semibold leading-7 text-white flex items-center gap-1">
                      Withdraw <AppTokenName token={quoteToken} variant="symbol" />
                    </span>
                    <ArrowRight className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </>
                )}
              </div>
            </button>
          ) : (
            <button
              onClick={() => setVisible(true)}
              className="h-14 w-full rounded-lg bg-black hover:bg-[#333] transition-colors mb-4"
            >
              <span className="text-lg font-semibold leading-7 text-white">Connect Wallet</span>
            </button>
          )}

          {/* Transaction Fee Notice */}
          <p className="text-[10px] font-normal leading-[15px] text-[#999] dark:text-[#666]">
            Transaction will imply a small network fee.
          </p>
        </div>
      )
    }

    // Simplified Claim layout (matching reference design)
    return (
      <div className="w-full rounded-2xl border p-6 bg-white dark:bg-[#323334] border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] flex flex-col justify-center items-center text-center">
        {/* Lock Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#f97316] flex items-center justify-center">
          <Lock className="w-10 h-10 text-white" strokeWidth={2} />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-semibold leading-8 mb-3 text-black dark:text-[#d2d2d2]">
          Claim Tokens
        </h3>

        {/* Description */}
        <p className="text-sm font-normal leading-[21px] mb-8 text-[#666] dark:text-[#999]">
          Transfer your allocated <AppTokenName token={token} variant="symbol" /> tokens (a 0.2% claim fee applies) and any{' '}
          <AppTokenName token={quoteToken} variant="symbol" /> refund directly to your wallet.
        </p>

        {/* Claim All Button */}
        {wallet.connected ? (
          <button
            onClick={handleClaimTokens}
            disabled={isLoading || !canClaim}
            className="h-14 w-full rounded-lg bg-black hover:bg-[#333] transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span className="text-lg font-semibold leading-7 text-white">
                    Processing...
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg font-semibold leading-7 text-white">
                    {hasClaimedAll ? 'Already Claimed' : !canClaim ? 'No Tokens to Claim' : 'Claim All'}
                  </span>
                  {canClaim && <ArrowRight className="w-5 h-5 text-white" strokeWidth={2.5} />}
                </>
              )}
            </div>
          </button>
        ) : (
          <button
            onClick={() => setVisible(true)}
            className="h-14 w-full rounded-lg bg-black hover:bg-[#333] transition-colors mb-4"
          >
            <span className="text-lg font-semibold leading-7 text-white">Connect Wallet</span>
          </button>
        )}

        {/* Transaction Fee Notice */}
        <p className="text-[10px] font-normal leading-[15px] text-[#999] dark:text-[#666]">
          Transaction will imply a small network fee.
        </p>
      </div>
    )
  }

  // Original Vesting layout (with gradients and detailed info)
  // Check for purchase failure case
  if (vaultInfo?.purchaseFailed) {
    return (
      <Card className="bg-gradient-to-b from-[#fef3c7] to-[#fca5a5] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] p-6 h-full">
        <div className="flex flex-col items-center gap-6 h-full justify-between">
          {/* Icon and Title */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-b from-[#f59e0b] to-[#ef4444] rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-black mb-2">Token Purchase Failed</h3>
              <p className="text-sm text-[#666]">
                The vault did not complete the token purchase during the buying window.
              </p>
            </div>
          </div>

          {/* Withdraw Button */}
          <div className="w-full flex flex-col gap-4">
            {hasDepositedFunds && (
              <div className="bg-white/50 rounded-lg p-3 text-center">
                <p className="text-[11px] text-[#666] mb-1">Your Deposited Amount</p>
                <p className="text-sm font-semibold font-mono text-black">
                  <AppTokenAmount token={quoteToken} amount={depositedAmountValue} showSymbol />
                </p>
              </div>
            )}

            {wallet.connected ? (
              <Button
                onClick={handleWithdrawRefund}
                disabled={isLoading}
                className="w-full h-14 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 text-lg font-semibold disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <span className="flex items-center gap-1">
                    Withdraw <AppTokenName token={quoteToken} variant="symbol" />
                  </span>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setVisible(true)}
                className="w-full h-14 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 text-lg font-semibold"
              >
                Connect Wallet
              </Button>
            )}

            <p className="text-xs text-[#666] text-center">
              You can withdraw your deposited <AppTokenName token={quoteToken} variant="symbol" /> back to your wallet.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] p-6 h-full">
      <div className="flex flex-col items-center gap-6 h-full justify-between">
        {/* Icon and Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-b from-[#aad36d] to-[#06a800] rounded-full flex items-center justify-center">
            <LockOpenIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-black mb-2">Claim Tokens</h3>
            <p className="text-sm text-[#666]">
              You have{' '}
              <span className="font-mono font-semibold text-[#aad36d] flex items-center gap-1">
                <AppTokenAmount token={token} amount={availableAmountValue} showSymbol />
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
                ) : vaultInfo?.state === 'deposit_open' || vaultInfo?.state === 'deposit_closed' || vaultInfo?.state === 'purchasing' ? (
                  'Vesting Not Started'
                ) : hasClaimedAll ? (
                  'Already Claimed'
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
              onClick={() => setVisible(true)}
              className="w-full h-14 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 text-lg font-semibold"
            >
              Connect Wallet
            </Button>
          )}

          {/* Next Unlock */}
          <div className="bg-white/50 rounded-lg p-3 text-center">
            <p className="text-[11px] text-[#666] mb-1">
              {vaultInfo?.state === 'vesting_complete' ? 'Vesting complete' : 'Vesting ends in'}
            </p>
            <p className="text-sm font-semibold font-mono text-black">
              {vaultInfo?.state === 'vesting_complete' ? 'All tokens unlocked' : nextUnlockDisplay}
            </p>
          </div>

          {/* Vesting Progress */}
          {claimInfo && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666]">Total Allocation</span>
                <AppTokenAmount token={token} amount={totalAllocationValue} className="font-mono text-black" showSymbol />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666]">Already Claimed</span>
                <AppTokenAmount token={token} amount={totalClaimedValue} className="font-mono text-black" showSymbol />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666]">Locked</span>
                <AppTokenAmount token={token} amount={lockedAmountValue} className="font-mono text-black" showSymbol />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
