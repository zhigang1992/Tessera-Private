import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { cn } from '@/lib/utils'
import { getUserTradeHistory } from '@/services'
import { Pagination } from '@/components/ui/pagination'
import { TableContainer, tableStyles } from '@/components/ui/table-header'
import TokenIconIcon from './_/token-icon.svg?react'

const PAGE_SIZE = 10

// Token icon component based on token name
function getTokenIcon(token: string) {
  const tokenLower = token.toLowerCase()

  switch (tokenLower) {
    case 't-spacex':
      return <TokenIconIcon />
    default:
      return <TokenIconIcon />
  }
}

export function TradingHistory() {
  const [currentPage, setCurrentPage] = useState(1)
  const { connected, publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()

  const { data, isLoading } = useQuery({
    queryKey: ['userTradeHistory', walletAddress, currentPage],
    queryFn: () => getUserTradeHistory(walletAddress, currentPage, PAGE_SIZE),
    enabled: connected,
  })

  const totalPages = data?.totalPages ?? 1
  const items = data?.items ?? []

  return (
    <TableContainer title="Trading History">
      {/* Table */}
      <div className={tableStyles.wrapper}>
        <table className={tableStyles.table}>
          <thead>
            <tr className={tableStyles.thead}>
              <th className={tableStyles.th}>Token</th>
              <th className={cn(tableStyles.th, 'whitespace-nowrap')}>Amount</th>
              <th className={tableStyles.th}>Type</th>
              <th className={tableStyles.th}>Account</th>
              <th className={tableStyles.th}>Time</th>
            </tr>
          </thead>
          <tbody className={tableStyles.tbody}>
            {!connected ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
                    <span className="text-[14px] text-muted-foreground">Please connect your wallet to view trading history</span>
                  </div>
                </td>
              </tr>
            ) : isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[14px] text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
                    <span className="text-[14px] text-muted-foreground">No Trading History</span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className={tableStyles.tr}>
                  {/* Token */}
                  <td className={tableStyles.td}>
                    <div className="flex items-center gap-2">
                      {getTokenIcon(item.token)}
                      <span className="font-semibold text-[#404040] dark:text-[#d2d2d2] uppercase">
                        {item.token}
                      </span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className={tableStyles.td}>
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <span>{item.amountIn}</span>
                      <span className="text-[#06a800]">→</span>
                      <span>{item.amountOut}</span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className={tableStyles.td}>{item.type}</td>

                  {/* Account */}
                  <td className={tableStyles.td}>{item.account}</td>

                  {/* Time */}
                  <td className={cn(tableStyles.td, 'whitespace-nowrap')}>{item.time}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={tableStyles.paginationWrapper}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="justify-center"
        />
      </div>
    </TableContainer>
  )
}
