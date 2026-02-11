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

/**
 * Format percentage change for display
 */
function formatPercentChange(value: number | null): string | null {
  if (value === null) return null
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

/**
 * Format number change for display (e.g., +5 or -3)
 */
function formatNumberChange(value: number | null): string | null {
  if (value === null) return null
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value}`
}

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['marketStats'],
    queryFn: getMarketStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const statCards = [
    {
      label: 'Total Market Cap',
      value: isLoading || !stats || stats.totalMarketCap === 0 ? '—' : formatLargeNumber(stats.totalMarketCap),
      change: stats?.totalMarketCap24hChangePct ? formatPercentChange(stats.totalMarketCap24hChangePct) : null,
      isPositive: stats?.totalMarketCap24hChangePct ? stats.totalMarketCap24hChangePct >= 0 : null,
    },
    {
      label: 'Total Trading Volume',
      value: isLoading || !stats || stats.totalTradingVolume === 0 ? '—' : formatLargeNumber(stats.totalTradingVolume),
      change: stats?.totalVolume24hChangePct ? formatPercentChange(stats.totalVolume24hChangePct) : null,
      isPositive: stats?.totalVolume24hChangePct ? stats.totalVolume24hChangePct >= 0 : null,
    },
    {
      label: 'Active Traders',
      value: isLoading || !stats || stats.activeTraders === 0 ? '—' : stats.activeTraders.toLocaleString(),
      change: stats?.activeTraders24hChange ? formatNumberChange(stats.activeTraders24hChange) : null,
      isPositive: stats?.activeTraders24hChange ? stats.activeTraders24hChange >= 0 : null,
    },
    {
      label: 'Assets Tokenized',
      value: isLoading || !stats || stats.assetsTokenized === 0 ? '—' : stats.assetsTokenized.toString(),
      change: null, // No 24h change for assets tokenized
      isPositive: null,
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
                <div className="flex items-center gap-2">
                  <p className="font-['Martian_Mono',monospace] font-medium text-base leading-8 text-foreground dark:text-[#d2d2d2]">
                    {card.value}
                  </p>
                  {card.change && (
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        card.isPositive
                          ? 'bg-[#d2fb95]/20 text-[#06a800] dark:text-[#d2fb95]'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {card.change}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
