import { useQuery } from '@tanstack/react-query'
import { getDashboardStatistics } from '@/services'

/**
 * Format price for display - shows "—" when no data (value is 0)
 */
function formatPrice(value: number | undefined): string {
  if (value === undefined || value === 0) {
    return '—'
  }
  return `$${value.toFixed(2)}`
}

export function StatisticsPanel() {
  const { data: statistics } = useQuery({
    queryKey: ['dashboardStatistics'],
    queryFn: getDashboardStatistics,
  })

  const tokenPrice = statistics?.tokenPrice24h
  const assetPrice = statistics?.underlyingAssetPrice24h

  return (
    <div className="bg-white dark:bg-[#323334] border border-black/15 dark:border-[rgba(210,210,210,0.1)] rounded-2xl p-4 lg:p-6">
      <h2 className="text-sm lg:text-base font-semibold text-black dark:text-[#d2d2d2] mb-4 lg:mb-6">Statistics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Token Price 24H */}
        <div className="flex flex-col">
          <div className="py-2.5">
            <span className="text-sm font-semibold text-[#666] dark:text-[#d2d2d2]">Token Price 24H</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Open</span>
            <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{formatPrice(tokenPrice?.open)}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">High</span>
            <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{formatPrice(tokenPrice?.high)}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Low</span>
            <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{formatPrice(tokenPrice?.low)}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
        </div>

        {/* Token Information */}
        <div className="flex flex-col">
          <div className="py-2.5">
            <span className="text-sm font-semibold text-[#666] dark:text-[#d2d2d2]">Token Information</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Open</span>
            <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{formatPrice(assetPrice?.open)}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">High</span>
            <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{formatPrice(assetPrice?.high)}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Low</span>
            <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{formatPrice(assetPrice?.low)}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
        </div>
      </div>
    </div>
  )
}
