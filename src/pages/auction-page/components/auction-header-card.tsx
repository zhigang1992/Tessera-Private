import { Card } from '@/components/ui/card'

// Mock data for auction stats
const mockAuctionData = {
  title: 'T-SpaceX Liquidity Auction',
  isOfficial: true,
  totalRaised: 142500,
  targetRaise: 58000,
  oversubscribedRatio: 2.46,
  percentageOfTarget: 246,
  status: 'live' as const,
  auctionEndsIn: { hours: 14, minutes: 12, seconds: 30 },
  poolStartsIn: { hours: 14, minutes: 35, seconds: 58 },
  myPosition: {
    isActive: true,
    deposited: 1200,
    estAllocation: 1.22,
    estRefund: 731.03,
  },
  impliedValuation: {
    fdv: '$800B',
    yoetPrice: 400.0,
  },
}

export function AuctionHeaderCard() {
  const data = mockAuctionData
  const progressWidth = Math.min((data.totalRaised / data.targetRaise) * 100, 100)

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-6">
        {/* Title and Badge */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">{data.title}</h2>
          {data.isOfficial && (
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
                  ${data.totalRaised.toLocaleString()}
                </span>
                <span className="bg-[rgba(210,251,149,0.5)] text-foreground text-xs font-medium px-2 py-0.5 rounded">
                  {data.percentageOfTarget}%
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
                    Target: ${data.targetRaise.toLocaleString()}
                  </span>
                  <span className="text-[#06a800] font-medium">
                    {data.oversubscribedRatio}x Oversubscribed
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
                  <span>{data.auctionEndsIn.hours}h</span>
                  <span>{data.auctionEndsIn.minutes}m</span>
                  <span>{data.auctionEndsIn.seconds}s</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Pool starts trading in</span>
                <p className="text-xs text-foreground">
                  Approximately:{' '}
                  <span className="font-mono">
                    {data.poolStartsIn.hours}h {data.poolStartsIn.minutes}m {data.poolStartsIn.seconds}s
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
              {data.myPosition.isActive && (
                <span className="bg-[rgba(88,101,242,0.2)] text-[#006fee] text-[10px] font-semibold px-2 py-1 rounded">
                  Active
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Deposited</span>
                <span className="text-sm font-semibold font-mono text-foreground">
                  ${data.myPosition.deposited.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Est. Alloc</span>
                <span className="text-sm font-semibold font-mono text-foreground">
                  {data.myPosition.estAllocation}TSX
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Est. Refund</span>
                <span className="text-sm font-semibold font-mono text-foreground">
                  ${data.myPosition.estRefund.toFixed(2)}
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
                  {data.impliedValuation.fdv}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">FDV</span>
              </div>
              <div className="h-px bg-zinc-300 dark:bg-zinc-700" />
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400">
                Based on Yoet Price:{' '}
                <span className="font-mono">${data.impliedValuation.yoetPrice.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
