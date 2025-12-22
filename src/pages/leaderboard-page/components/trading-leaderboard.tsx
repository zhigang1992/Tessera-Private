import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { cn } from '@/lib/utils'
import { getTradingLeaderboard, getCurrentUserTradingRank } from '@/services'
import { Pagination } from '@/components/ui/pagination'
import { getMedalIcon } from './_/getMedalIcon'


const PAGE_SIZE = 10
export function TradingLeaderboard() {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['tradingLeaderboard', currentPage],
    queryFn: () => getTradingLeaderboard(currentPage, PAGE_SIZE),
  })

  const { data: currentUserRank } = useQuery({
    queryKey: ['currentUserTradingRank', walletAddress],
    queryFn: () => getCurrentUserTradingRank(walletAddress),
    enabled: !!walletAddress,
  })

  const totalPages = data?.totalPages ?? 1

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US')}`
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-card overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-gray-100 dark:border-border">
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Rank (Top100)</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">User</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Trading Vol.</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Trading Points</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Fee Rebates</th>
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
                  className={cn('border-b border-gray-50 dark:border-border last:border-0', isCurrentUser && 'bg-[#FAFFBD] dark:bg-[#3d4a1a]')}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium text-foreground', row.rank <= 3 && 'font-bold')}>
                        #{row.rank}
                      </span>
                      {medal && <span>{medal}</span>}
                      {isCurrentUser && (
                        <span className="rounded bg-black dark:bg-white px-1.5 py-0.5 text-xs font-medium text-white dark:text-black">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{row.user}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[#2B664B] dark:text-[#7dd889]">{formatCurrency(row.tradingVolume)}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{row.tradingPoints.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-foreground">${row.feeRebates}</td>
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
        className="border-t border-gray-100 dark:border-border px-6 py-4"
      />
    </div>
  )
}
