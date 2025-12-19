import { useState } from 'react'
import { Pagination } from '@/components/ui/pagination'
import TokenSpacexIcon from './_/token-spacex.svg?react'

interface TradeHistoryItem {
  id: string
  token: string
  amountIn: string
  amountOut: string
  type: 'Buy' | 'Sell'
  account: string
  time: string
}

// Mock data
const mockTradeHistory: TradeHistoryItem[] = Array.from({ length: 50 }, (_, i) => ({
  id: `trade-${i + 1}`,
  token: 'T-SPACEX',
  amountIn: '1,000 USDC',
  amountOut: '300.2 T-SPACEX',
  type: 'Buy',
  account: '0xA8D0...6006',
  time: 'Today at 3:20 PM',
}))

const PAGE_SIZE = 10

export function TradeHistory() {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(mockTradeHistory.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const items = mockTradeHistory.slice(startIndex, startIndex + PAGE_SIZE)

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
          {items.map((item, index) => (
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
                <span className="text-[#06a800]">→</span>
                <span className="text-black">{item.amountOut}</span>
              </div>
              <div className="flex-1 text-sm text-black">{item.type}</div>
              <div className="flex-1 text-sm text-black">{item.account}</div>
              <div className="flex-1 text-sm text-black">{item.time}</div>
            </div>
          ))}
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
