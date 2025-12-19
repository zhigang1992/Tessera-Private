import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { cn } from '@/lib/utils'
import { getTradingLeaderboard, getCurrentUserTradingRank } from '@/services'
import { Pagination } from '@/components/ui/pagination'
import RankOneIcon from './_/rank-one.svg?react'
import RankTwoIcon from './_/rank-two.svg?react'
import RankThreeIcon from './_/rank-three.svg?react'

const PAGE_SIZE = 10

const getMedalIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <RankOneIcon className="h-3 w-3" />
    case 2:
      return <RankTwoIcon className="h-3 w-3" />
    case 3:
      return <RankThreeIcon className="h-3 w-3" />
    default:
      return null
  }
}

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
    <div className="rounded-2xl bg-white overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-gray-100">
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
                  className={cn('border-b border-gray-50 last:border-0', isCurrentUser && 'bg-[#D2FB95]')}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-black">#{row.rank}</span>
                      {medal && <span>{medal}</span>}
                      {isCurrentUser && (
                        <span className="rounded bg-black px-1.5 py-0.5 text-xs font-medium text-white">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-black">{row.user}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#16A34A]">{formatCurrency(row.tradingVolume)}</td>
                  <td className="px-6 py-4 text-sm text-black">{row.tradingPoints.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-black">${row.feeRebates}</td>
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
