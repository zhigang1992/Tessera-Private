import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { getAuctionStats, getAuctionPosition, getAuctionValuation } from '@/services'

export function AuctionHeaderCard() {
  const { data: stats } = useQuery({
    queryKey: ['auctionStats'],
    queryFn: getAuctionStats,
  })

  const { data: position } = useQuery({
    queryKey: ['auctionPosition'],
    queryFn: getAuctionPosition,
  })

  const { data: valuation } = useQuery({
    queryKey: ['auctionValuation'],
    queryFn: getAuctionValuation,
  })

  const progressWidth = stats ? Math.min((stats.totalRaised / stats.targetRaise) * 100, 100) : 0

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-6">
        {/* Title and Badge */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">{stats?.title ?? 'Loading...'}</h2>
          {stats?.isOfficial && (
            <span className="bg-[#5865f2] text-white text-[10px] font-semibold px-2 py-1 rounded">
              OFFICIAL
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Raised */}
          <div className="bg-[#f6f6f6] dark:bg-zinc-900 rounded-lg p-4 flex flex-col gap-4">
            <div className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 tracking-wider">
              TOTAL RAISED
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold font-mono text-foreground">
                  ${stats?.totalRaised.toLocaleString() ?? '0'}
                </span>
                <span className="bg-[rgba(210,251,149,0.5)] text-foreground text-xs font-medium px-2 py-0.5 rounded">
                  {stats?.percentageOfTarget ?? 0}%
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#06a800] h-full rounded-full transition-all"
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Target: ${stats?.targetRaise.toLocaleString() ?? '0'}
                  </span>
                  <span className="text-[#06a800] font-medium">
                    {stats?.oversubscribedRatio ?? 0}x Oversubscribed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Auction Status */}
          <div className="bg-[#f6f6f6] dark:bg-zinc-900 rounded-lg p-4 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 tracking-wider">
                AUCTION STATUS
              </span>
              <div className="flex items-center gap-1.5 bg-[rgba(6,168,0,0.1)] px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-[#06a800] rounded-full" />
                <span className="text-[10px] font-semibold text-[#06a800]">LIVE</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Auction Ends in</span>
                <div className="flex items-center gap-1.5 font-mono text-xl font-semibold text-foreground">
                  <span>{stats?.auctionEndsIn.hours ?? 0}h</span>
                  <span>{stats?.auctionEndsIn.minutes ?? 0}m</span>
                  <span>{stats?.auctionEndsIn.seconds ?? 0}s</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Pool starts trading in</span>
                <p className="text-xs text-foreground">
                  Approximately:{' '}
                  <span className="font-mono">
                    {stats?.poolStartsIn.hours ?? 0}h {stats?.poolStartsIn.minutes ?? 0}m{' '}
                    {stats?.poolStartsIn.seconds ?? 0}s
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* My Position */}
          <div className="bg-[#f6f6f6] dark:bg-zinc-900 rounded-lg p-4 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 tracking-wider">
                MY POSITION
              </span>
              {position?.isActive && (
                <span className="bg-[rgba(88,101,242,0.2)] text-[#006fee] text-[10px] font-semibold px-2 py-1 rounded">
                  Active
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Deposited</span>
                <span className="text-sm font-semibold font-mono text-foreground">
                  ${position?.deposited.toLocaleString() ?? '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Est. Alloc</span>
                <span className="text-sm font-semibold font-mono text-foreground">
                  {position?.estAllocation ?? 0}TSX
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Est. Refund</span>
                <span className="text-sm font-semibold font-mono text-foreground">
                  ${position?.estRefund.toFixed(2) ?? '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Implied Valuation */}
          <div className="bg-[#f6f6f6] dark:bg-zinc-900 rounded-lg p-4 flex flex-col justify-between gap-4">
            <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 tracking-wider">
              IMPLIED VALUATION
            </span>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {valuation?.fdv ?? '-'}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">FDV</span>
              </div>
              <div className="h-px bg-zinc-300 dark:bg-zinc-700" />
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400">
                Based on Yoet Price:{' '}
                <span className="font-mono">${valuation?.yoetPrice.toFixed(2) ?? '0.00'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
