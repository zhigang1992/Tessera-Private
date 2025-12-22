/**
 * Auctions list page - Matching Tessera's clean, minimal design
 */

import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { MOCK_AUCTION_LIST } from '../lib/mock-data'
import { AuctionPhase } from '../types/auction'
import { AuctionTimer } from '../ui/auction-timer'
import { formatPrice, isAuctionActive, calculateProgress } from '../lib/utils'

type FilterOption = 'all' | 'active' | 'ended'

export function AuctionListPage() {
  const [filter, setFilter] = useState<FilterOption>('all')

  // Filter auctions
  const filteredAuctions = MOCK_AUCTION_LIST.filter((auction) => {
    if (filter === 'all') return true
    if (filter === 'active')
      return auction.phase === AuctionPhase.Bidding || auction.phase === AuctionPhase.Active
    if (filter === 'ended')
      return [AuctionPhase.Processing, AuctionPhase.Finalized, AuctionPhase.Failed, AuctionPhase.Cancelled].includes(
        auction.phase
      )
    return true
  })

  // Sort by most recent (bidding start time descending)
  const sortedAuctions = [...filteredAuctions].sort((a, b) => b.biddingStartTime - a.biddingStartTime)

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
          {sortedAuctions.map((auction) => {
            const progress = calculateProgress(auction.tokensAllocated, auction.totalTokenSupply)
            const isActive = isAuctionActive(auction.phase)

            return (
              <Link
                key={auction.id}
                to={`/auctions/${auction.id}`}
                className="group block rounded-[24px] border border-[#E7E7EA] bg-white p-6 transition-all hover:-translate-y-1 hover:border-black dark:border-[#27272A] dark:bg-black dark:hover:border-white"
              >
                {/* Image */}
                <div className="relative mb-4 aspect-video overflow-hidden rounded-[16px] bg-[#F7F7FA] dark:bg-[#1C1C1E]">
                  {auction.imageUrl ? (
                    <img src={auction.imageUrl} alt={auction.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-5xl font-black text-black/5 dark:text-white/5">{auction.tokenSymbol}</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="mb-2 text-xl font-semibold text-black dark:text-white">{auction.title}</h3>

                {/* Token Symbol */}
                <p className="mb-4 font-mono text-sm text-[#4B5563] dark:text-[#D1D5DB]">${auction.tokenSymbol}</p>

                {/* Stats Row */}
                <div className="mb-4 flex items-center justify-between text-sm">
                  <div>
                    <div className="text-[#4B5563] dark:text-[#D1D5DB]">
                      {auction.clearingPrice > 0 ? 'Clearing' : 'Starting'}
                    </div>
                    <div className="font-mono font-semibold text-black dark:text-white">
                      ${formatPrice(auction.clearingPrice > 0 ? auction.clearingPrice : auction.startingPrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#4B5563] dark:text-[#D1D5DB]">Bids</div>
                    <div className="font-semibold text-black dark:text-white">{auction.totalBids}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#4B5563] dark:text-[#D1D5DB]">Filled</div>
                    <div className="font-semibold text-black dark:text-white">
                      {Math.round((auction.tokensAllocated / auction.totalTokenSupply) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="h-1 overflow-hidden rounded-full bg-[#E7E7EA] dark:bg-[#27272A]">
                    <div
                      className="h-full bg-black transition-all duration-500 dark:bg-white"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Timer or Status */}
                {isActive ? (
                  <div className="text-sm text-[#4B5563] dark:text-[#D1D5DB]">
                    <AuctionTimer endTime={auction.biddingEndTime} showIcon={false} />
                  </div>
                ) : (
                  <div className="text-sm font-medium text-[#4B5563] dark:text-[#D1D5DB]">
                    {auction.phase === AuctionPhase.Finalized && 'Completed'}
                    {auction.phase === AuctionPhase.Processing && 'Processing'}
                    {auction.phase === AuctionPhase.Failed && 'Failed'}
                    {auction.phase === AuctionPhase.Cancelled && 'Cancelled'}
                  </div>
                )}
              </Link>
            )
          })}
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
