import { useQuery } from '@tanstack/react-query'
import { getDashboardStatistics } from '@/services'

export function StatisticsPanel() {
  const { data: statistics } = useQuery({
    queryKey: ['dashboardStatistics'],
    queryFn: getDashboardStatistics,
  })

  const tokenPrice = statistics?.tokenPrice24h
  const assetPrice = statistics?.underlyingAssetPrice24h

  return (
    <div className="bg-white dark:bg-card rounded-2xl p-4 lg:p-6">
      <h2 className="text-lg font-normal text-foreground mb-4 lg:mb-6">Statistics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Token Price 24H */}
        <div className="flex flex-col">
          <div className="py-2.5">
            <span className="text-sm font-semibold text-foreground">Token Price 24H</span>
          </div>
          <div className="border-t border-black/15 dark:border-border" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-foreground">Open</span>
            <span className="text-sm text-foreground">${tokenPrice?.open.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="border-t border-black/15 dark:border-border" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-foreground">High</span>
            <span className="text-sm text-foreground">${tokenPrice?.high.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="border-t border-black/15 dark:border-border" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-foreground">Low</span>
            <span className="text-sm text-foreground">${tokenPrice?.low.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="border-t border-black/15 dark:border-border" />
        </div>

        {/* Underlying Asset Price 24H */}
        <div className="flex flex-col">
          <div className="py-2.5">
            <span className="text-sm font-semibold text-foreground">Underlying Asset Price 24H</span>
          </div>
          <div className="border-t border-black/15 dark:border-border" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-foreground">Open</span>
            <span className="text-sm text-foreground">${assetPrice?.open.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="border-t border-black/15 dark:border-border" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-foreground">High</span>
            <span className="text-sm text-foreground">${assetPrice?.high.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="border-t border-black/15 dark:border-border" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-foreground">Low</span>
            <span className="text-sm text-foreground">${assetPrice?.low.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="border-t border-black/15 dark:border-border" />
        </div>
      </div>
    </div>
  )
}
