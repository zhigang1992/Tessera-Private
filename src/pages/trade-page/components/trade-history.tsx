import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Pagination } from '@/components/ui/pagination'
import { TableContainer, tableStyles } from '@/components/ui/table-header'
import { getTradeHistory } from '@/services'
import TokenSpacexIcon from './_/token-spacex.svg?react'

const PAGE_SIZE = 10

export function TradeHistory() {
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['tradeHistory', currentPage],
    queryFn: () => getTradeHistory(currentPage, PAGE_SIZE),
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
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[14px] text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
                    <span className="text-[14px] text-muted-foreground">No trade history</span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className={tableStyles.tr}>
                  {/* Token */}
                  <td className={tableStyles.td}>
                    <div className="flex items-center gap-2">
                      <TokenSpacexIcon className="w-5 h-5 lg:w-6 lg:h-6" />
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
