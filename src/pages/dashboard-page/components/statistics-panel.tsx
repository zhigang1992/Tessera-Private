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
    <div className="bg-white rounded-2xl p-4 lg:p-6">
      <h2 className="text-lg font-normal text-black mb-4 lg:mb-6">Statistics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Token Price 24H */}
        <div className="flex flex-col">
          <div className="py-2.5">
            <span className="text-sm font-semibold text-black">Token Price 24H</span>
          </div>
          <div className="border-t border-black/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-black">Open</span>
            <span className="text-sm text-black">${tokenPrice?.open.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="border-t border-black/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-black">High</span>
            <span className="text-sm text-black">${tokenPrice?.high.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="border-t border-black/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-black">Low</span>
            <span className="text-sm text-black">${tokenPrice?.low.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="border-t border-black/15" />
        </div>

        {/* Underlying Asset Price 24H */}
        <div className="flex flex-col">
          <div className="py-2.5">
            <span className="text-sm font-semibold text-black">Underlying Asset Price 24H</span>
          </div>
          <div className="border-t border-black/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-black">Open</span>
            <span className="text-sm text-black">${assetPrice?.open.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="border-t border-black/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-black">High</span>
            <span className="text-sm text-black">${assetPrice?.high.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="border-t border-black/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-black">Low</span>
            <span className="text-sm text-black">${assetPrice?.low.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="border-t border-black/15" />
        </div>
      </div>
    </div>
  )
}
