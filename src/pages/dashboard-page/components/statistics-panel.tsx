import { useQuery } from '@tanstack/react-query'
import { getDashboardStatistics, getDashboardStats } from '@/services'
import { AppTokenId, DEFAULT_BASE_TOKEN_ID, getAppToken } from '@/config'

/**
 * Format price for display - shows "—" when no data (value is 0)
 */
function formatPrice(value: number | undefined): string {
  if (value === undefined || value === 0) {
    return '—'
  }
  return `$${value.toFixed(2)}`
}

interface StatisticsPanelProps {
  tokenId?: AppTokenId
}

export function StatisticsPanel({ tokenId = DEFAULT_BASE_TOKEN_ID }: StatisticsPanelProps) {
  const { data: statistics } = useQuery({
    queryKey: ['dashboardStatistics', tokenId],
    queryFn: () => getDashboardStatistics(tokenId),
  })

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboardStats', tokenId],
    queryFn: () => getDashboardStats(tokenId),
  })

  const token = getAppToken(tokenId)
  const tokenPrice = statistics?.tokenPrice24h

  // Calculate market cap from token price and supply
  const tokenSupply = dashboardStats?.tokenSupply ?? '—'
  const currentPrice = dashboardStats?.tokenPrice ?? 0

  // Parse token supply to get numeric value for market cap calculation
  const parseSupply = (supply: string): number => {
    if (supply === '—') return 0
    const match = supply.match(/([\d.]+)([KMBT])/)
    if (!match) return 0
    const [, value, unit] = match
    const num = parseFloat(value)
    const multipliers: Record<string, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000, T: 1_000_000_000_000 }
    return num * (multipliers[unit] || 1)
  }

  const supplyValue = parseSupply(tokenSupply)
  const marketCap = supplyValue > 0 && currentPrice > 0 ? supplyValue * currentPrice : 0

  const formatMarketCap = (value: number): string => {
    if (value === 0) return '—'
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    }
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }

  // Get token standard from token program configuration
  const tokenStandard = token.program === 'token-2022' ? 'Token-2022' : 'SPL Token'

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
            <span className="text-xs lg:text-sm text-[#999]">Total Market Cap</span>
            <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{formatMarketCap(marketCap)}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Token Minted</span>
            <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{tokenSupply}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Token Standard</span>
            <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{tokenStandard}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
        </div>
      </div>
    </div>
  )
}
