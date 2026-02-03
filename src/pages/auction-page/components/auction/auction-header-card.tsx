import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card } from '@/components/ui/card'
import { useAlphaVault } from '@/hooks/use-alpha-vault'
import { ALPHA_VAULT_CONFIG } from '@/services/alpha-vault'
import { WithdrawModal } from './withdraw-modal'

export function AuctionHeaderCard() {
  const wallet = useWallet()
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)

  const {
    vaultInfo,
    vaultStateDisplay,
    escrowInfo,
    depositEndsIn,
    totalRaised,
    targetRaise,
    oversubscribedRatio,
    userDeposited,
    estimatedAllocation,
    estimatedRefund,
    vestingDuration,
  } = useAlphaVault()

  // Calculate progress percentage
  const totalRaisedNum = vaultInfo
    ? parseFloat(vaultInfo.totalDeposited) / 10 ** ALPHA_VAULT_CONFIG.usdcDecimals
    : 0
  const targetRaiseNum = vaultInfo
    ? parseFloat(vaultInfo.maxCap) / 10 ** ALPHA_VAULT_CONFIG.usdcDecimals
    : 1
  const progressWidth = targetRaiseNum > 0 ? Math.min((totalRaisedNum / targetRaiseNum) * 100, 100) : 0
  const percentageOfTarget = targetRaiseNum > 0 ? Math.round((totalRaisedNum / targetRaiseNum) * 100) : 0

  // Check if user has an active position
  const hasPosition = escrowInfo && parseFloat(escrowInfo.totalDeposited) > 0

  return (
    <Card className="p-6 bg-white dark:bg-[#323334]">
      <div className="flex flex-col gap-6">
        {/* Title and Badge */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">TESS Token Auction</h2>
          <span className="bg-[#5865f2] text-white text-[10px] font-semibold px-2 py-1 rounded">
            OFFICIAL
          </span>
        </div>

        {/* Stats Grid - Mobile: vertical stack, Tablet: 2 cols, Desktop: 4 cols */}
        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Raised */}
          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col gap-4">
            <div className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">
              TOTAL RAISED
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold font-mono text-foreground">
                  ${totalRaised}
                </span>
                <span className="bg-[rgba(210,251,149,0.5)] text-foreground text-xs font-medium px-2 py-0.5 rounded">
                  {percentageOfTarget}%
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-zinc-200 dark:bg-[rgba(255,255,255,0.1)] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#06a800] h-full rounded-full transition-all"
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#71717a] dark:text-[#999]">Target: ${targetRaise}</span>
                  {vaultInfo?.isOversubscribed && (
                    <span className="text-[#06a800] font-medium">
                      {oversubscribedRatio}x Oversubscribed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Auction Status */}
          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">
                VAULT STATUS
              </span>
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                style={{ backgroundColor: `${vaultStateDisplay?.color ?? '#6b7280'}20` }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: vaultStateDisplay?.color ?? '#6b7280' }}
                />
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: vaultStateDisplay?.color ?? '#6b7280' }}
                >
                  {vaultStateDisplay?.label ?? 'LOADING'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-[#71717a] dark:text-[#999]">
                  {vaultInfo?.state === 'deposit_open' ? 'Deposits Close in' : 'Deposits Closed'}
                </span>
                {depositEndsIn ? (
                  <div className="flex items-center gap-1.5 font-mono text-xl font-semibold text-foreground">
                    <span>{depositEndsIn.hours}h</span>
                    <span>{depositEndsIn.minutes}m</span>
                    <span>{depositEndsIn.seconds}s</span>
                  </div>
                ) : (
                  <span className="font-mono text-xl font-semibold text-foreground">-</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#71717a] dark:text-[#999]">Mode</span>
                <p className="text-xs text-foreground font-medium capitalize">
                  {vaultInfo?.mode ?? '-'}
                </p>
              </div>
            </div>
          </div>

          {/* My Position */}
          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">
                MY POSITION
              </span>
              {hasPosition && (
                <span className="bg-[rgba(88,101,242,0.2)] text-[#006fee] text-[10px] font-semibold px-2 py-1 rounded">
                  Active
                </span>
              )}
            </div>
            {wallet.connected ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#71717a] dark:text-[#999]">Deposited</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono text-foreground">
                      ${userDeposited}
                    </span>
                    {hasPosition && vaultInfo?.state === 'deposit_open' && (
                      <button
                        onClick={() => setWithdrawModalOpen(true)}
                        className="text-sm font-mono text-foreground underline hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#71717a] dark:text-[#999]">Est. Alloc</span>
                  <span className="text-sm font-semibold font-mono text-foreground">
                    {estimatedAllocation} TESS
                  </span>
                </div>
                {vaultInfo?.mode === 'prorata' && vaultInfo?.isOversubscribed && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#71717a] dark:text-[#999]">Est. Refund</span>
                    <span className="text-sm font-semibold font-mono text-foreground">
                      ${estimatedRefund}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Connect wallet to view your position
                </p>
              </div>
            )}
          </div>

          {/* Token Info */}
          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col justify-between gap-4">
            <span className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">
              TOKEN INFO
            </span>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-bold font-mono text-foreground">TESS</span>
                <span className="text-xs bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-0.5 rounded">
                  Token-2022
                </span>
              </div>
              <div className="h-px bg-zinc-300 dark:bg-[#666]" />
              <div className="flex flex-col gap-1 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#71717a] dark:text-[#999]">Quote Token</span>
                  <span className="font-mono text-foreground">USDC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#71717a] dark:text-[#999]">Vesting</span>
                  <span className="font-mono text-foreground">{vestingDuration}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WithdrawModal open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen} />
    </Card>
  )
}
