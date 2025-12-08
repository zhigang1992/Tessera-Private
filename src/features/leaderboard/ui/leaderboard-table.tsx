import { cn } from '@/lib/utils'
import { ellipsify } from '@/lib/utils'
import { CrownIcon } from './crown-icon'
import { PersonIcon } from './person-icon'
import { Pagination } from './pagination'
import type { LeaderboardEntry } from '../types'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  currentUserAddress?: string
}

export function LeaderboardTable({
  entries,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
  currentUserAddress,
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

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-white dark:bg-black p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-[10px]">
        <div className="flex items-center gap-[10px] px-[10px]">
          <div className="w-[240px] text-xs text-[#71717A]">Rank (Top100)</div>
          <div className="flex-1 text-xs text-[#71717A]">User</div>
          <div className="flex-1 text-xs text-[#71717A]">Trader Referral</div>
        </div>

        {/* Divider */}
        <div className="px-[10px]">
          <div className="h-px bg-black/15 dark:bg-white/15" />
        </div>

        {/* List */}
        <div className="flex flex-col gap-[5px]">
          {entries.map((entry, index) => {
            const isUserRow = isCurrentUser(entry.owner)
            const isOddRow = index % 2 === 0

            return (
              <div
                key={entry.owner}
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
                <div className="w-[240px] flex items-center gap-[5px]">
                  <span className={cn('text-sm', isUserRow ? 'text-black' : 'text-black dark:text-white')}>
                    #{entry.rank}
                  </span>
                  {isTopThree(entry.rank) && <CrownIcon />}
                  {isUserRow && (
                    <span className="bg-black text-white text-[10px] font-bold px-1 py-0 rounded-sm">You</span>
                  )}
                </div>

                {/* User Address */}
                <div className="flex-1">
                  <span className={cn('text-sm', isUserRow ? 'text-black' : 'text-black dark:text-white')}>
                    {ellipsify(entry.owner, 5, '...')}
                  </span>
                </div>

                {/* Trader Referral Count */}
                <div className="flex-1 flex items-center gap-[5px]">
                  <PersonIcon className={isUserRow ? 'text-black' : undefined} />
                  <span className="text-sm text-[#2B664B]">{entry.invited_count.toLocaleString()}</span>
                </div>
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
