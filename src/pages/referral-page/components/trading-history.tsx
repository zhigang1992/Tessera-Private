import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTradingHistory } from '@/services'
import { Pagination } from '@/components/ui/pagination'
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
    <div className="rounded-[16px] bg-white dark:bg-[#18181B] px-3 lg:px-[14px] py-4 lg:py-6 flex flex-col gap-[10px]">
      {/* Title */}
      <h2 className="text-base lg:text-[18px] leading-7 text-foreground px-1 lg:px-0">Trading History</h2>

      {/* Table */}
      <div className="flex flex-col gap-[10px]">
        {/* Header - hidden on mobile */}
        <div className="hidden lg:flex items-center gap-[10px] px-[10px]">
          <div className="w-[180px] text-[12px] leading-4 text-zinc-500">Token</div>
          <div className="w-[250px] text-[12px] leading-4 text-zinc-500">Amount</div>
          <div className="flex-1 text-[12px] leading-4 text-zinc-500">Type</div>
          <div className="flex-1 text-[12px] leading-4 text-zinc-500">Account</div>
          <div className="flex-1 text-[12px] leading-4 text-zinc-500">Time</div>
        </div>

        {/* Divider - hidden on mobile */}
        <div className="hidden lg:block px-[10px]">
          <div className="h-px bg-black/15 dark:bg-white/15" />
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-[5px]">
          {isLoading ? (
            <div className="p-[10px] text-center text-[14px] text-muted-foreground">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="p-4">
              <div className="flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-[#27272A] py-16">
                <span className="text-[14px] text-muted-foreground">No Trading History</span>
              </div>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className={`flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-[10px] p-3 lg:p-[10px] rounded-lg lg:rounded-none ${
                  index % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''
                }`}
              >
                {/* Token with Amount (mobile: row, desktop: separate) */}
                <div className="flex items-center justify-between lg:contents">
                  <div className="lg:w-[180px] flex items-center gap-[5px]">
                    {getTokenIcon(item.token)}
                    <span className="text-[14px] font-semibold text-[#404040] dark:text-zinc-300 uppercase">
                      {item.token}
                    </span>
                  </div>
                  <div className="lg:w-[250px] flex items-center gap-[5px] text-[12px] lg:text-[14px] leading-5">
                    <span className="text-black dark:text-white">{item.amountIn}</span>
                    <span className="text-[#06a800]">→</span>
                    <span className="text-black dark:text-white">{item.amountOut}</span>
                  </div>
                </div>
                {/* Mobile: Stats grid */}
                <div className="grid grid-cols-3 gap-2 lg:contents">
                  <div className="flex flex-col lg:flex-1">
                    <span className="text-[10px] text-zinc-500 lg:hidden">Type</span>
                    <span className="text-[12px] lg:text-[14px] leading-5 text-black dark:text-white">{item.type}</span>
                  </div>
                  <div className="flex flex-col lg:flex-1">
                    <span className="text-[10px] text-zinc-500 lg:hidden">Account</span>
                    <span className="text-[12px] lg:text-[14px] leading-5 text-black dark:text-white truncate">{item.account}</span>
                  </div>
                  <div className="flex flex-col lg:flex-1">
                    <span className="text-[10px] text-zinc-500 lg:hidden">Time</span>
                    <span className="text-[12px] lg:text-[14px] leading-5 text-black dark:text-white">{item.time}</span>
                  </div>
                </div>
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
        className="justify-center"
      />
    </div>
  )
}
