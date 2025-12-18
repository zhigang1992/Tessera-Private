import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTradingHistory } from '@/services'
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

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
    return pages
  }, [currentPage, totalPages])

  const handlePrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages, p + 1))
  }, [totalPages])

  const handlePageClick = useCallback((page: number | string) => {
    if (typeof page === 'number') {
      setCurrentPage(page)
    }
  }, [])

  return (
    <div className="rounded-2xl bg-white overflow-hidden">
      <div className="p-4 lg:p-6">
        <h2 className="text-lg text-black">Trading History</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 lg:px-6 py-3 text-left text-sm font-medium text-muted-foreground">Token</th>
              <th className="px-4 lg:px-6 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
              <th className="px-4 lg:px-6 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
              <th className="px-4 lg:px-6 py-3 text-left text-sm font-medium text-muted-foreground">Account</th>
              <th className="px-4 lg:px-6 py-3 text-left text-sm font-medium text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 lg:px-6 py-4 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 lg:px-6 py-4 text-center text-muted-foreground">
                  No trading history
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getTokenIcon(item.token)}
                      <span className="font-medium text-black">{item.token}</span>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center gap-1 text-black">
                      <span>{item.amountIn}</span>
                      <ArrowRightIcon />
                      <span>{item.amountOut}</span>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-black">{item.type}</td>
                  <td className="px-4 lg:px-6 py-4 text-black">{item.account}</td>
                  <td className="px-4 lg:px-6 py-4 text-black">{item.time}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-4 lg:px-6 py-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg text-sm',
              currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-muted-foreground hover:bg-gray-100',
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageNumbers.map((page, i) => (
            <button
              key={i}
              onClick={() => handlePageClick(page)}
              disabled={typeof page !== 'number'}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-sm',
                page === currentPage
                  ? 'bg-black text-white'
                  : typeof page === 'number'
                    ? 'text-muted-foreground hover:bg-gray-100'
                    : 'text-muted-foreground cursor-default',
              )}
            >
              {page}
            </button>
          ))}

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg text-sm',
              currentPage === totalPages
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-muted-foreground hover:bg-gray-100',
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
