import { useQuery } from '@tanstack/react-query'
import { getMarketStats } from '@/services'

/**
 * Format large numbers to readable strings (e.g., 485200000000 -> $485.2B)
 */
function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`
  }
  return `$${value.toFixed(2)}`
}

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['marketStats'],
    queryFn: getMarketStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Note: 24h change data not available in backend yet
  // Change badges are hidden until backend provides this data
  const statCards = [
    {
      label: 'Total Market Cap',
      value: isLoading || !stats ? '—' : formatLargeNumber(stats.totalMarketCap),
      hasChange: false,
    },
    {
      label: 'Total Trading Volume',
      value: isLoading || !stats ? '—' : formatLargeNumber(stats.totalTradingVolume),
      hasChange: false,
    },
    {
      label: 'Active Traders',
      value: isLoading || !stats ? '—' : stats.activeTraders.toLocaleString(),
      hasChange: false,
    },
    {
      label: 'Assets Tokenized',
      value: isLoading || !stats ? '—' : stats.assetsTokenized.toString(),
      hasChange: false,
    },
  ]

  return (
    <div>
      <h2 className="font-semibold text-sm text-foreground dark:text-[#d2d2d2] mb-4">Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-[#323334] border border-black/15 dark:border-[rgba(210,210,210,0.1)] rounded-2xl px-4 py-2"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-normal text-foreground dark:text-[#d2d2d2]">{card.label}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center">
                  <p className="font-['Martian_Mono',monospace] font-medium text-base leading-8 text-foreground dark:text-[#d2d2d2]">
                    {card.value}
                  </p>
                </div>
                {/* Note: 24h change badges hidden until backend provides this data */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
