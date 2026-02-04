import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { getAuctionProgress } from '@/services'
import { AuctionChart } from './auction-chart'
import { useAuctionTokenId } from '../../context'

export function AuctionProgressCard() {
  const tokenId = useAuctionTokenId()
  const { data: progress } = useQuery({
    queryKey: ['auctionProgress', tokenId],
    queryFn: () => getAuctionProgress(tokenId),
  })

  return (
    <Card className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] p-6 h-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <h3 className="text-base font-semibold text-black">Auction Progress</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[#1d8f00] rounded-full" />
              <span className="text-xs text-[#666]">Total Raised</span>
            </div>
          </div>
          {progress && progress.oversubscribedRatio > 1 && (
            <div className="flex items-center gap-2 text-[#06a800] font-bold text-sm">
              <TrendingUp className="w-6 h-6" />
              <span>{progress.oversubscribedRatio}x Oversubscribed</span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-[392px]">
          <AuctionChart />
        </div>
      </div>
    </Card>
  )
}
