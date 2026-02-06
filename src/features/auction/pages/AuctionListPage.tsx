/**
 * Auctions list page - Matching Tessera's clean, minimal design
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type FilterOption = 'all' | 'active' | 'ended'

export function AuctionListPage() {
  const [filter, setFilter] = useState<FilterOption>('all')

  // TODO: Replace with real auction data from API
  const sortedAuctions: never[] = []

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto w-full max-w-[1480px] px-6 py-10 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-[54px] font-semibold leading-[1.05] tracking-tight text-black dark:text-white sm:text-[60px]">
            Auctions
          </h1>
          <p className="mt-2 text-[#4B5563] dark:text-[#D1D5DB]">
            Fair token distribution via uniform price auctions
          </p>
        </div>

        {/* Divider */}
        <div className="mb-10 h-px bg-[#E7E7EA] dark:bg-[#27272A]" />

        {/* Filter Tabs */}
        <div className="mb-8 flex gap-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={
              filter === 'all'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'border-[#E7E7EA] bg-transparent text-black hover:bg-[#F7F7FA] dark:border-[#27272A] dark:text-white dark:hover:bg-[#1C1C1E]'
            }
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
            className={
              filter === 'active'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'border-[#E7E7EA] bg-transparent text-black hover:bg-[#F7F7FA] dark:border-[#27272A] dark:text-white dark:hover:bg-[#1C1C1E]'
            }
          >
            Active
          </Button>
          <Button
            variant={filter === 'ended' ? 'default' : 'outline'}
            onClick={() => setFilter('ended')}
            className={
              filter === 'ended'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'border-[#E7E7EA] bg-transparent text-black hover:bg-[#F7F7FA] dark:border-[#27272A] dark:text-white dark:hover:bg-[#1C1C1E]'
            }
          >
            Ended
          </Button>
        </div>

        {/* Auctions Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* TODO: Render auction cards when real data is available */}
        </div>

        {/* Empty State */}
        {sortedAuctions.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-[#4B5563] dark:text-[#D1D5DB]">No auctions found</p>
          </div>
        )}
      </div>
    </div>
  )
}
