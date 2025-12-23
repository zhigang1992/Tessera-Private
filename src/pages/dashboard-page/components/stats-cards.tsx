import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/services'

export function StatsCards() {
  const { data: stats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      <div className="bg-white dark:bg-[#1e1f20] rounded-2xl p-4">
        <p className="text-sm text-foreground dark:text-[#d2d2d2] leading-5">Protocol Backing Ratio</p>
        <p className="text-2xl lg:text-3xl font-semibold text-foreground dark:text-[#d2d2d2] leading-9">
          {stats?.protocolBackingRatio ?? 0}%
        </p>
      </div>
      <div className="bg-white dark:bg-[#1e1f20] rounded-2xl p-4">
        <p className="text-sm text-foreground dark:text-[#d2d2d2] leading-5">T-SpaceX Supply</p>
        <p className="text-2xl lg:text-3xl font-semibold text-foreground dark:text-[#d2d2d2] leading-9">
          {stats?.tokenSupply ?? '0'}
        </p>
      </div>
      <div className="bg-white dark:bg-[#1e1f20] rounded-2xl p-4">
        <p className="text-sm text-foreground dark:text-[#d2d2d2] leading-5">T-SpaceX Price</p>
        <p className="text-2xl lg:text-3xl font-semibold text-foreground dark:text-[#d2d2d2] leading-9">
          ${stats?.tokenPrice.toFixed(1) ?? '0.0'}
        </p>
      </div>
    </div>
  )
}
