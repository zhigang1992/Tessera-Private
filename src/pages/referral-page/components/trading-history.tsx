import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTradingHistory } from '@/services'
import { Pagination } from '@/components/ui/pagination'
import ArrowRightIcon from './_/arrow-right.svg?react'
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

  const { data, isLoading } = useQuery({
    queryKey: ['tradingHistory', currentPage],
    queryFn: () => getTradingHistory(currentPage, PAGE_SIZE),
  })

  const totalPages = data?.totalPages ?? 1
  const items = data?.items ?? []

  return (
    <div className="rounded-2xl bg-white overflow-hidden">
      <div className="p-4 lg:p-6">
        <h2 className="text-base md:text-lg text-black">Trading History</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs lg:text-sm font-medium text-muted-foreground">Token</th>
              <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs lg:text-sm font-medium text-muted-foreground">Amount</th>
              <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs lg:text-sm font-medium text-muted-foreground">Type</th>
              <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs lg:text-sm font-medium text-muted-foreground">Account</th>
              <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs lg:text-sm font-medium text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 lg:px-6 py-3 lg:py-4 text-center text-xs lg:text-sm text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <div className="flex items-center justify-center rounded-lg bg-gray-50 py-16">
                    <span className="text-sm text-muted-foreground">No Discount Distribution</span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-3 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      {getTokenIcon(item.token)}
                      <span className="text-xs lg:text-sm font-medium text-black">{item.token}</span>
                    </div>
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center gap-1 text-xs lg:text-sm text-black">
                      <span>{item.amountIn}</span>
                      <ArrowRightIcon />
                      <span>{item.amountOut}</span>
                    </div>
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-black">{item.type}</td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-black">{item.account}</td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-black">{item.time}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        className="border-t border-gray-100 px-3 lg:px-6 py-3 lg:py-4"
      />
    </div>
  )
}
