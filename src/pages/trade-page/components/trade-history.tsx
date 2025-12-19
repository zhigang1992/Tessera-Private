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
    <div className="rounded-2xl bg-white px-3.5 py-6">
      <div className="flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-2.5 text-xs text-zinc-500">
          <div className="w-[180px]">Token</div>
          <div className="w-[250px]">Amount</div>
          <div className="flex-1">Type</div>
          <div className="flex-1">Account</div>
          <div className="flex-1">Time</div>
        </div>

        {/* Divider */}
        <div className="px-2.5">
          <div className="h-px bg-black/15" />
        </div>

        {/* List */}
        <div className="flex flex-col gap-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-gray-500">No trade history</span>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-2.5 p-2.5 rounded ${
                  index % 2 === 0 ? 'bg-zinc-50' : ''
                }`}
              >
                <div className="w-[180px]">
                  <div className="flex items-center gap-1.5">
                    <TokenSpacexIcon className="w-6 h-6" />
                    <span className="text-sm font-semibold text-[#404040] uppercase">{item.token}</span>
                  </div>
                </div>
                <div className="w-[250px] flex items-center gap-1 text-sm">
                  <span className="text-black">{item.amountIn}</span>
                  <span className={item.type === 'Buy' ? 'text-[#06a800]' : 'text-red-500'}>→</span>
                  <span className="text-black">{item.amountOut}</span>
                </div>
                <div className="flex-1">
                  <span className={`text-sm ${item.type === 'Buy' ? 'text-[#06a800]' : 'text-red-500'}`}>
                    {item.type}
                  </span>
                </div>
                <div className="flex-1 text-sm text-black">{item.account}</div>
                <div className="flex-1 text-sm text-black">{item.time}</div>
              </div>
            ))
          )}
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
