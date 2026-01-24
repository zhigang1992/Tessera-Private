import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pagination } from '@/components/ui/pagination'
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
    <div className="rounded-2xl bg-white dark:bg-[#323334] px-3.5 py-4 lg:py-6 border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)]">
      <div className="overflow-x-auto">
        <div className="flex flex-col gap-2.5 min-w-[600px]">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-2.5 text-xs text-muted-foreground dark:text-[#71717a]">
            <div className="w-[140px] lg:w-[180px]">Token</div>
            <div className="w-[180px] lg:w-[250px]">Amount</div>
            <div className="w-[60px] lg:flex-1">Type</div>
            <div className="w-[100px] lg:flex-1">Account</div>
            <div className="w-[120px] lg:flex-1">Time</div>
          </div>

          {/* Divider */}
          <div className="px-2.5">
            <div className="h-px bg-black/15 dark:bg-[#d2d2d2]/15" />
          </div>

          {/* List */}
          <div className="flex flex-col gap-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-muted-foreground dark:text-[#d2d2d2]">Loading...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-muted-foreground dark:text-[#d2d2d2]">No trade history</span>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded ${
                    index % 2 === 0 ? 'bg-zinc-50 dark:bg-[#323334]' : ''
                  }`}
                >
                  <div className="w-[140px] lg:w-[180px]">
                    <div className="flex items-center gap-1.5">
                      <TokenSpacexIcon className="w-5 h-5 lg:w-6 lg:h-6" />
                      <span className="text-xs lg:text-sm font-semibold text-foreground dark:text-[#d2d2d2] uppercase">{item.token}</span>
                    </div>
                  </div>
                  <div className="w-[180px] lg:w-[250px] flex items-center gap-1 text-xs lg:text-sm">
                    <span className="text-foreground dark:text-[#d2d2d2]">{item.amountIn}</span>
                    <span className="text-[#06a800]">→</span>
                    <span className="text-foreground dark:text-[#d2d2d2]">{item.amountOut}</span>
                  </div>
                  <div className="w-[60px] lg:flex-1">
                    <span className="text-xs lg:text-sm text-foreground dark:text-[#d2d2d2]">
                      {item.type}
                    </span>
                  </div>
                  <div className="w-[100px] lg:flex-1 text-xs lg:text-sm text-foreground dark:text-[#d2d2d2]">{item.account}</div>
                  <div className="w-[120px] lg:flex-1 text-xs lg:text-sm text-foreground dark:text-[#d2d2d2]">{item.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        className="mt-4"
      />
    </div>
  )
}
