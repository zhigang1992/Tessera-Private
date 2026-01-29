import { cn } from '@/lib/utils'
import { ellipsify } from '@/lib/utils'
import { CrownIcon } from './crown-icon'
import { Pagination } from './pagination'
import type { LeaderboardEntry, LeaderboardType } from '../types'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  currentUserAddress?: string
  type: LeaderboardType
}

/**
 * Format currency value for display
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`
  }
  return `$${value.toFixed(value < 10 ? 3 : 2)}`
}

/**
 * Format number for display
 */
function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }
  return value.toLocaleString()
}

export function LeaderboardTable({
  entries,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
  currentUserAddress,
  type,
}: LeaderboardTableProps) {
  const isCurrentUser = (address: string) => {
    return currentUserAddress?.toLowerCase() === address.toLowerCase()
  }

  const isTopThree = (rank: number) => rank <= 3

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 rounded-lg bg-white dark:bg-black p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-full" />
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-900 rounded w-full" />
          ))}
        </div>
      </div>
    )
  }

  const isTradingLeaderboard = type === 'trading'

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-white dark:bg-black p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-[10px]">
        <div className="flex items-center gap-[10px] px-[10px]">
          <div className="w-[140px] sm:w-[180px] text-xs text-[#71717A]">Rank (Top100)</div>
          <div className="flex-1 text-xs text-[#71717A]">User</div>
          {isTradingLeaderboard ? (
            <>
              <div className="w-[100px] sm:w-[120px] text-xs text-[#71717A] text-right">Trading Vol.</div>
              <div className="w-[100px] sm:w-[120px] text-xs text-[#71717A] text-right">Trading Points</div>
            </>
          ) : (
            <div className="w-[120px] sm:w-[150px] text-xs text-[#71717A] text-right">Trader Referral</div>
          )}
        </div>

        {/* Divider */}
        <div className="px-[10px]">
          <div className="h-px bg-black/15 dark:bg-white/15" />
        </div>

        {/* List */}
        <div className="flex flex-col gap-[5px]">
          {entries.map((entry, index) => {
            const isUserRow = isCurrentUser(entry.account)
            const isOddRow = index % 2 === 0

            return (
              <div
                key={entry.account}
                className={cn(
                  'flex items-center gap-[10px] rounded p-[10px]',
                  isUserRow
                    ? 'bg-[#FAFFBD] dark:bg-[#FAFFBD]'
                    : isOddRow
                      ? 'bg-[#FAFAFA] dark:bg-[#27272A]'
                      : 'bg-white dark:bg-transparent'
                )}
              >
                {/* Rank */}
                <div className="w-[140px] sm:w-[180px] flex items-center gap-[5px]">
                  <span className={cn('text-sm', isUserRow ? 'text-black' : 'text-black dark:text-white')}>
                    {entry.rank}
                  </span>
                  {isTopThree(entry.rank) && <CrownIcon />}
                  {isUserRow && (
                    <span className="bg-black text-white text-[10px] font-bold px-1 py-0 rounded-sm">You</span>
                  )}
                </div>

                {/* User Address */}
                <div className="flex-1">
                  <span className={cn('text-sm', isUserRow ? 'text-black' : 'text-black dark:text-white')}>
                    {ellipsify(entry.account, 4, '...')}
                  </span>
                </div>

                {/* Trading Leaderboard: Volume + Points */}
                {isTradingLeaderboard ? (
                  <>
                    <div className="w-[100px] sm:w-[120px] text-right">
                      <span className="text-sm text-[#2B664B]">{formatCurrency(entry.total_trading_volume)}</span>
                    </div>
                    <div className="w-[100px] sm:w-[120px] text-right">
                      <span className={cn('text-sm', isUserRow ? 'text-black' : 'text-black dark:text-white')}>
                        {formatNumber(entry.total_trading_points)}
                      </span>
                    </div>
                  </>
                ) : (
                  /* Referral Leaderboard: Referral Count */
                  <div className="w-[120px] sm:w-[150px] text-right">
                    <span className="text-sm text-[#2B664B]">{entry.total_referrals.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  )
}
