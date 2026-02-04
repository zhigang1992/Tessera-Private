import { useWallet } from '@solana/wallet-adapter-react'
import { Card } from '@/components/ui/card'
import { AppTokenName } from '@/components/app-token-name'
import { AppTokenAmount } from '@/components/app-token-amount'
import { formatDate } from '@/services/alpha-vault-helpers'
import CalendarIcon from './_/calendar.svg?react'
import CheckCircleIcon from './_/check-circle.svg?react'
import { useAuctionAlphaVault, useAuctionToken } from '../../context'
import { fromTokenAmount, BigNumber } from '@/lib/bignumber'

export function VestingHeaderCard() {
  const wallet = useWallet()
  const token = useAuctionToken()

  const { vaultInfo, claimInfo, vestingDuration, config } = useAuctionAlphaVault()

  const circumference = 2 * Math.PI * 24

  // Calculate vesting progress percentage
  const progressPercent = claimInfo?.vestingProgress ?? 0

  // Determine vesting status text
  const getVestingStatusText = () => {
    switch (vaultInfo?.state) {
      case 'deposit_open':
      case 'deposit_closed':
        return 'Not Started'
      case 'vesting':
        return 'In Progress'
      case 'vesting_complete':
        return 'Complete'
      default:
        return 'Loading...'
    }
  }

  // Get status indicator color
  const getStatusColor = () => {
    switch (vaultInfo?.state) {
      case 'vesting':
        return '#aad36d'
      case 'vesting_complete':
        return '#10b981'
      case 'deposit_open':
      case 'deposit_closed':
        return '#f59e0b'
      default:
        return '#6b7280'
    }
  }

  // Check if user is eligible (has allocation)
  const isEligible =
    wallet.connected && claimInfo && parseFloat(claimInfo.totalAllocation) > 0

  const totalAllocationAmount = claimInfo ? fromTokenAmount(claimInfo.totalAllocation, config.baseDecimals) : null
  const totalClaimedAmount = claimInfo ? fromTokenAmount(claimInfo.totalClaimed, config.baseDecimals) : null
  const availableAmount = claimInfo ? fromTokenAmount(claimInfo.availableToClaim, config.baseDecimals) : null
  const lockedAmount = claimInfo ? fromTokenAmount(claimInfo.lockedAmount, config.baseDecimals) : null

  const totalAllocationNumber = totalAllocationAmount ? BigNumber.toNumber(totalAllocationAmount) : 0
  const unlockedNumber =
    (totalClaimedAmount ? BigNumber.toNumber(totalClaimedAmount) : 0) +
    (availableAmount ? BigNumber.toNumber(availableAmount) : 0)
  const lockedNumber = lockedAmount ? BigNumber.toNumber(lockedAmount) : 0

  const unlockedPercent =
    totalAllocationNumber > 0 ? Math.round((unlockedNumber / totalAllocationNumber) * 100) : 0
  const lockedPercent = totalAllocationNumber > 0 ? 100 - unlockedPercent : 0

  return (
    <Card className="p-6 bg-white dark:bg-[#323334]">
      <div className="flex flex-col gap-6">
        {/* Title and Badge */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">
            <AppTokenName token={token} /> Vesting
          </h2>
          <span className="bg-[#5865f2] text-white text-[10px] font-semibold px-2 py-1 rounded">
            OFFICIAL
          </span>
        </div>

        {/* Status and Position Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Vesting Status */}
          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">
                  VESTING STATUS
                </span>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-2xl font-semibold text-foreground">{getVestingStatusText()}</h3>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getStatusColor() }}
                  />
                </div>
              </div>
              <div className="relative w-[60px] h-[60px]">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="none"
                    className="stroke-black/10 dark:stroke-white/20"
                    strokeWidth="8"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="none"
                    stroke="#aad36d"
                    strokeWidth="8"
                    strokeDasharray={`${circumference * (progressPercent / 100)} ${circumference * (1 - progressPercent / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-foreground">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#71717a] dark:text-[#999]">
                  <CalendarIcon className="w-4 h-4 text-zinc-400" />
                  <span>Start</span>
                </div>
                <span className="font-mono text-foreground">
                  {formatDate(vaultInfo?.vestingStartTime ?? null)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#71717a] dark:text-[#999]">
                  <CalendarIcon className="w-4 h-4 text-zinc-400" />
                  <span>End</span>
                </div>
                <span className="font-mono text-foreground">
                  {formatDate(vaultInfo?.vestingEndTime ?? null)}
                </span>
              </div>
            </div>

            <div className="border-t border-[rgba(17,17,17,0.15)] dark:border-[rgba(255,255,255,0.1)] pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#71717a] dark:text-[#999]">Unlock Rate</span>
                <span className="font-medium text-[#06a800]">{vestingDuration}</span>
              </div>
            </div>
          </div>

          {/* My Vesting Position */}
          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col gap-9">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">
                MY VESTING POSITION
              </span>
              {isEligible && (
                <div className="flex items-center gap-1.5 bg-[#06a800] px-2 py-1 rounded">
                  <CheckCircleIcon className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-semibold text-white">Eligible</span>
                </div>
              )}
            </div>

            {wallet.connected ? (
              <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:h-[113px]">
                {/* Total Allocation */}
                <div className="bg-[rgba(88,101,242,0.08)] dark:bg-[rgba(88,101,242,0.15)] rounded-[10px] p-2 lg:pt-4 lg:px-4 lg:pb-0 flex flex-col gap-2">
                  <span className="text-xs font-medium text-[#5865f2]">Total Allocation</span>
                  <AppTokenAmount
                    token={token}
                    amount={totalAllocationNumber}
                    className="text-2xl font-semibold font-mono text-foreground"
                  />
                  <span className="text-[10px] text-[#71717a] dark:text-[#999]">
                    <AppTokenName token={token} variant="symbol" /> Tokens
                  </span>
                </div>

                {/* Unlocked */}
                <div className="bg-[rgba(170,211,109,0.08)] dark:bg-[rgba(170,211,109,0.15)] rounded-[10px] p-2 lg:pt-4 lg:px-4 lg:pb-0 flex flex-col gap-2">
                  <span className="text-xs font-medium text-[#06a800]">
                    Unlocked ({unlockedPercent}%)
                  </span>
                  <AppTokenAmount
                    token={token}
                    amount={unlockedNumber}
                    className="text-2xl font-semibold font-mono text-foreground"
                  />
                  <span className="text-[10px] text-[#71717a] dark:text-[#999]">
                    Available to claim
                  </span>
                </div>

                {/* Locked */}
                <div className="bg-[rgba(17,17,17,0.03)] dark:bg-[rgba(255,255,255,0.05)] rounded-[10px] p-2 lg:pt-4 lg:px-4 lg:pb-0 flex flex-col gap-2">
                  <span className="text-xs font-medium text-[#71717a] dark:text-[#999]">
                    Locked ({lockedPercent}%)
                  </span>
                  <AppTokenAmount
                    token={token}
                    amount={lockedNumber}
                    className="text-2xl font-semibold font-mono text-foreground"
                  />
                  <span className="text-[10px] text-[#71717a] dark:text-[#999]">
                    Unlocks linearly
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:h-[113px]">
                <div className="col-span-3 flex items-center justify-center">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Connect wallet to view your vesting position
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
