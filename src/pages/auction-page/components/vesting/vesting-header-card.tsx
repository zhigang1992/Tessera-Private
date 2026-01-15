import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { getVestingStatus, getVestingPosition } from '@/services'
import CalendarIcon from './_/calendar.svg?react'
import CheckCircleIcon from './_/check-circle.svg?react'

export function VestingHeaderCard() {
  const { data: vestingStatus } = useQuery({
    queryKey: ['vestingStatus'],
    queryFn: getVestingStatus,
  })

  const { data: vestingPosition } = useQuery({
    queryKey: ['vestingPosition'],
    queryFn: getVestingPosition,
  })
  const circumference = 2 * Math.PI * 24

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-6">
        {/* Title and Badge */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">{vestingStatus?.title ?? 'Loading...'}</h2>
          {vestingStatus?.isOfficial && (
            <span className="bg-[#5865f2] text-white text-[10px] font-semibold px-2 py-1 rounded">
              OFFICIAL
            </span>
          )}
        </div>

        {/* Status and Position Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Vesting Status */}
          <div className="bg-[#f6f6f6] dark:bg-zinc-900 rounded-lg p-4 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 tracking-wider">
                  VESTING STATUS
                </span>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-2xl font-semibold text-foreground">In Progress</h3>
                  <div className="w-2 h-2 bg-[#aad36d] rounded-full" />
                </div>
              </div>
              <div className="relative w-[60px] h-[60px]">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="none"
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="none"
                    stroke="#aad36d"
                    strokeWidth="8"
                    strokeDasharray={`${circumference * ((vestingStatus?.progressPercent ?? 0) / 100)} ${circumference * (1 - (vestingStatus?.progressPercent ?? 0) / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-foreground">{vestingStatus?.progressPercent ?? 0}%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <CalendarIcon className="w-4 h-4 text-zinc-400" />
                  <span>Start</span>
                </div>
                <span className="font-mono text-foreground">{vestingStatus?.startDate ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <CalendarIcon className="w-4 h-4 text-zinc-400" />
                  <span>End</span>
                </div>
                <span className="font-mono text-foreground">{vestingStatus?.endDate ?? '-'}</span>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Unlock Rate</span>
                <span className="font-medium text-[#06a800]">{vestingStatus?.unlockRate ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* My Vesting Position */}
          <div className="bg-[#f6f6f6] dark:bg-zinc-900 rounded-lg p-4 flex flex-col gap-9">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 tracking-wider">
                MY VESTING POSITION
              </span>
              {vestingPosition?.isEligible && (
                <div className="flex items-center gap-1.5 bg-[#06a800] px-2 py-1 rounded">
                  <CheckCircleIcon className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-semibold text-white">Eligible</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 h-[113px]">
              {/* Total Allocation */}
              <div className="bg-[rgba(88,101,242,0.08)] dark:bg-[rgba(88,101,242,0.15)] rounded-[10px] pt-4 px-4 pb-0 flex flex-col gap-2">
                <span className="text-xs font-medium text-[#5865f2]">Total Allocation</span>
                <span className="text-2xl font-semibold font-mono text-foreground">
                  {vestingPosition?.totalAllocation.toFixed(2) ?? '0.00'}
                </span>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400">TSX Tokens</span>
              </div>

              {/* Unlocked */}
              <div className="bg-[rgba(170,211,109,0.08)] dark:bg-[rgba(170,211,109,0.15)] rounded-[10px] pt-4 px-4 pb-0 flex flex-col gap-2">
                <span className="text-xs font-medium text-[#06a800]">
                  Unlocked ({vestingPosition?.unlockedPercent ?? 0}%)
                </span>
                <span className="text-2xl font-semibold font-mono text-foreground">
                  {vestingPosition?.unlockedAmount.toFixed(2) ?? '0.00'}
                </span>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400">Available to claim</span>
              </div>

              {/* Locked */}
              <div className="bg-[rgba(17,17,17,0.03)] dark:bg-[rgba(255,255,255,0.05)] rounded-[10px] pt-4 px-4 pb-0 flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Locked ({vestingPosition?.lockedPercent ?? 0}%)
                </span>
                <span className="text-2xl font-semibold font-mono text-foreground">
                  {vestingPosition?.lockedAmount.toFixed(2) ?? '0.00'}
                </span>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400">Unlocks linearly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
