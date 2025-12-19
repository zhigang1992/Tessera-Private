import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { User } from 'lucide-react'
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
    <div className="rounded-2xl bg-white overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Rank (Top100)</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">User</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Trader Referral</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Trading Points</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Fee Rewards</th>
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
                No data available
              </td>
            </tr>
          ) : (
            data.items.map((row) => {
              const isCurrentUser = row.rank === currentUserRank
              const medal = getMedalIcon(row.rank)

              return (
                <tr
                  key={row.rank}
                  className={cn('border-b border-gray-50 last:border-0', isCurrentUser && 'bg-[#FAFFBD]')}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium text-black', row.rank <= 3 && 'font-bold')}>#{row.rank}</span>
                      {medal && <span>{medal}</span>}
                      {isCurrentUser && (
                        <span className="rounded bg-black px-1.5 py-0.5 text-xs font-medium text-white">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-black">{row.user}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-[#2B664B]">
                      <PersonIcon className="h-6 w-6" />
                      {row.traderReferral.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-black">{row.tradingPoints.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-black">${row.feeRewards}</td>
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
        className="border-t border-gray-100 px-6 py-4"
      />
    </div>
  )
}
