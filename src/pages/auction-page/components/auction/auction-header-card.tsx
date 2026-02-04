import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card } from '@/components/ui/card'
import { AppTokenName } from '@/components/app-token-name'
import { AppTokenIcon } from '@/components/app-token-icon'
import { AppTokenAmount } from '@/components/app-token-amount'
import { WithdrawModal } from './withdraw-modal'
import { useAuctionAlphaVault, useAuctionToken } from '../../context'

export function AuctionHeaderCard() {
  const wallet = useWallet()
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const token = useAuctionToken()
  const {
    config,
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
  } = useAuctionAlphaVault()

  const totalRaisedNum = vaultInfo
    ? parseFloat(vaultInfo.totalDeposited) / 10 ** config.quoteDecimals
    : 0
  const targetRaiseNum = vaultInfo
    ? parseFloat(vaultInfo.maxCap) / 10 ** config.quoteDecimals
    : 1
  const progressWidth = targetRaiseNum > 0 ? Math.min((totalRaisedNum / targetRaiseNum) * 100, 100) : 0
  const percentageOfTarget = targetRaiseNum > 0 ? Math.round((totalRaisedNum / targetRaiseNum) * 100) : 0
  const hasPosition = escrowInfo && parseFloat(escrowInfo.totalDeposited) > 0
  const quoteToken = config.quoteToken

  return (
    <Card className="p-6 bg-white dark:bg-[#323334]">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <AppTokenIcon token={token} size={40} className="w-10 h-10" />
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-1">
              <AppTokenName token={token} /> Auction
            </h2>
            <span className="bg-[#5865f2] text-white text-[10px] font-semibold px-2 py-1 rounded">OFFICIAL</span>
          </div>
        </div>

        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col gap-4">
            <div className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">TOTAL RAISED</div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <AppTokenAmount
                  token={quoteToken}
                  amount={totalRaised}
                  showSymbol
                  className="text-2xl font-semibold font-mono text-foreground"
                />
                <span className="bg-[rgba(210,251,149,0.5)] text-foreground text-xs font-medium px-2 py-0.5 rounded">
                  {percentageOfTarget}%
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-zinc-200 dark:bg-[rgba(255,255,255,0.1)] rounded-full h-2 overflow-hidden">
                  <div className="bg-[#06a800] h-full rounded-full transition-all" style={{ width: `${progressWidth}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#71717a] dark:text-[#999]">
                    Target:{' '}
                    <AppTokenAmount token={quoteToken} amount={targetRaise} showSymbol className="font-mono" />
                  </span>
                  {vaultInfo?.isOversubscribed && (
                    <span className="text-[#06a800] font-medium">{oversubscribedRatio}x Oversubscribed</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">VAULT STATUS</span>
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                style={{ backgroundColor: `${vaultStateDisplay?.color ?? '#6b7280'}20` }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: vaultStateDisplay?.color ?? '#6b7280' }} />
                <span className="text-[10px] font-semibold" style={{ color: vaultStateDisplay?.color ?? '#6b7280' }}>
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
                <p className="text-xs text-foreground font-medium capitalize">{vaultInfo?.mode ?? '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">MY POSITION</span>
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
                    <AppTokenAmount
                      token={quoteToken}
                      amount={userDeposited}
                      showSymbol
                      className="text-sm font-semibold font-mono text-foreground"
                    />
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
                  <AppTokenAmount
                    token={token}
                    amount={estimatedAllocation}
                    showSymbol
                    className="text-sm font-semibold font-mono text-foreground flex items-center gap-1"
                  />
                </div>
                {vaultInfo?.mode === 'prorata' && vaultInfo?.isOversubscribed && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#71717a] dark:text-[#999]">Est. Refund</span>
                    <AppTokenAmount
                      token={quoteToken}
                      amount={estimatedRefund}
                      showSymbol
                      className="text-sm font-semibold font-mono text-foreground"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Connect wallet to view your position</p>
            )}
          </div>

          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col justify-between gap-4">
            <span className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">TOKEN INFO</span>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  <AppTokenName token={token} variant="symbol" />
                </span>
                <span className="text-xs bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-0.5 rounded">
                  {token.metadata?.type ?? 'Tokenized Asset'}
                </span>
              </div>
              <div className="h-px bg-zinc-300 dark:bg-[#666]" />
              <div className="flex flex-col gap-1 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#71717a] dark:text-[#999]">Quote Token</span>
                  <AppTokenName token={quoteToken} variant="symbol" className="font-mono text-foreground" />
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
