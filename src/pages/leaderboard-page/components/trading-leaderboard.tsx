import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { cn } from '@/lib/utils'
import { useLeaderboard } from '@/features/leaderboard/hooks/use-leaderboard'
import { Pagination } from '@/components/ui/pagination'
import { getMedalIcon } from './_/getMedalIcon'

export function TradingLeaderboard() {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useLeaderboard(currentPage, 'trading')

  // Find current user's rank from the entries
  const currentUserEntry = walletAddress
    ? data?.entries.find((entry) => entry.account === walletAddress)
    : null
  const currentUserRank = currentUserEntry?.rank

  const totalPages = data?.totalPages ?? 1

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US')}`
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1e1f20] overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-gray-100 dark:border-[#d2d2d2]/15">
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground dark:text-[#71717a]">Rank (Top100)</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground dark:text-[#71717a]">User</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground dark:text-[#71717a]">Trading Vol.</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground dark:text-[#71717a]">Trading Points</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                Loading...
              </td>
            </tr>
          ) : !data?.entries.length ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                Upcoming
              </td>
            </tr>
          ) : (
            data.entries.map((entry) => {
              const isCurrentUser = entry.rank === currentUserRank
              const medal = getMedalIcon(entry.rank)
              const displayAddress = entry.account.length <= 12
                ? entry.account
                : `${entry.account.slice(0, 4)}...${entry.account.slice(-4)}`

              return (
                <tr
                  key={entry.rank}
                  className={cn(
                    'last:border-0',
                    isCurrentUser
                      ? 'bg-[#FAFFBD]'
                      : entry.rank % 2 === 1 ? 'bg-zinc-50 dark:bg-[#323334]' : 'dark:bg-[#1e1f20]'
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium', entry.rank <= 3 && 'font-bold', isCurrentUser ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]')}>
                        {entry.rank}
                      </span>
                      {medal && <span>{medal}</span>}
                      {isCurrentUser && (
                        <span className="rounded bg-black px-1.5 py-0.5 text-xs font-medium text-white">You</span>
                      )}
                    </div>
                  </td>
                  <td className={cn('px-6 py-4 text-sm', isCurrentUser ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]')}>{displayAddress}</td>
                  <td className={cn('px-6 py-4 text-sm font-bold', isCurrentUser ? 'text-black' : 'text-[#2B664B] dark:text-[#d2fb95]')}>{formatCurrency(entry.total_trading_volume)}</td>
                  <td className={cn('px-6 py-4 text-sm', isCurrentUser ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]')}>{entry.total_trading_points.toLocaleString()}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        className="border-t border-gray-100 dark:border-[#d2d2d2]/15 px-6 py-4"
      />
    </div>
  )
}
