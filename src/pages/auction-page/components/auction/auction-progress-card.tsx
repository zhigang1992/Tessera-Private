import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { getAuctionProgress } from '@/services'
import { AuctionChart } from './auction-chart'

export function AuctionProgressCard() {
  const { data: progress } = useQuery({
    queryKey: ['auctionProgress'],
    queryFn: getAuctionProgress,
  })

  return (
    <Card className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] dark:from-[#1a2c0d] dark:to-[#243a12] p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-base font-semibold text-foreground">Auction Progress</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[#1d8f00] rounded-full" />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Total Raised</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#06a800] font-bold text-sm">
            <TrendingUp className="w-6 h-6" />
            <span>{progress?.oversubscribedRatio ?? 0}x Oversubscribed</span>
          </div>
        </div>

        {/* Chart */}
        <AuctionChart />
      </div>
    </Card>
  )
}
