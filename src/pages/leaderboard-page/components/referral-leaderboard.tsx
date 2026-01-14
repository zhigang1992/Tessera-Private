import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { cn } from '@/lib/utils'
import { getReferralLeaderboard, getCurrentUserReferralRank } from '@/services'
import { Pagination } from '@/components/ui/pagination'
import { getMedalIcon } from './_/getMedalIcon'
import PersonIcon from './_/person.svg?react'

const PAGE_SIZE = 10

export function ReferralLeaderboard() {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['referralLeaderboard', currentPage],
    queryFn: () => getReferralLeaderboard(currentPage, PAGE_SIZE),
  })

  const { data: currentUserRank } = useQuery({
    queryKey: ['currentUserReferralRank', walletAddress],
    queryFn: () => getCurrentUserReferralRank(walletAddress),
    enabled: !!walletAddress,
  })

  const totalPages = data?.totalPages ?? 1

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1e1f20] overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-gray-100 dark:border-[#d2d2d2]/15">
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground dark:text-[#71717a]">Rank (Top100)</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground dark:text-[#71717a]">User</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground dark:text-[#71717a]">Trader Referral</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground dark:text-[#71717a]">Trading Points</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground dark:text-[#71717a]">Fee Rewards</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                Loading...
              </td>
            </tr>
          ) : !data?.items.length ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                Upcoming
              </td>
            </tr>
          ) : (
            data.items.map((row) => {
              const isCurrentUser = row.rank === currentUserRank
              const medal = getMedalIcon(row.rank)

              return (
                <tr
                  key={row.rank}
                  className={cn(
                    'last:border-0',
                    isCurrentUser
                      ? 'bg-[#FAFFBD]'
                      : row.rank % 2 === 1 ? 'bg-zinc-50 dark:bg-[#323334]' : 'dark:bg-[#1e1f20]'
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium', row.rank <= 3 && 'font-bold', isCurrentUser ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]')}>{row.rank}</span>
                      {medal && <span>{medal}</span>}
                      {isCurrentUser && (
                        <span className="rounded bg-black px-1.5 py-0.5 text-xs font-medium text-white">You</span>
                      )}
                    </div>
                  </td>
                  <td className={cn('px-6 py-4 text-sm', isCurrentUser ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]')}>{row.user}</td>
                  <td className="px-6 py-4">
                    <div className={cn('flex items-center gap-1.5 text-sm font-medium', isCurrentUser ? 'text-black' : 'text-[#2B664B] dark:text-[#d2fb95]')}>
                      <PersonIcon className="h-6 w-6" />
                      {row.traderReferral.toLocaleString()}
                    </div>
                  </td>
                  <td className={cn('px-6 py-4 text-sm', isCurrentUser ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]')}>{row.tradingPoints.toLocaleString()}</td>
                  <td className={cn('px-6 py-4 text-sm', isCurrentUser ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]')}>${row.feeRewards}</td>
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
