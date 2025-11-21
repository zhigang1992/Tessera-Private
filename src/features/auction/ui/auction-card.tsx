/**
 * Auction card component for list view
 * Showcases distinctive design with emphasis on key metrics
 */

import { Link } from 'react-router'
import { TrendingUp, Users, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AuctionListItem } from '../types/auction'
import { AuctionPhaseBadge } from './auction-phase-badge'
import { AuctionTimer } from './auction-timer'
import { formatNumber, formatPrice, formatPercentage, isAuctionActive, calculateProgress } from '../lib/utils'

interface AuctionCardProps {
  auction: AuctionListItem
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const progress = calculateProgress(auction.tokensAllocated, auction.totalTokenSupply)
  const isActive = isAuctionActive(auction.phase)

  return (
    <Link to={`/auctions/${auction.id}`} className="block group">
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/20">
        {/* Image Header */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5">
          {auction.imageUrl ? (
            <img
              src={auction.imageUrl}
              alt={auction.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl font-black text-primary/20">{auction.tokenSymbol}</div>
            </div>
          )}

          {/* Phase Badge - Floating */}
          <div className="absolute top-3 right-3">
            <AuctionPhaseBadge phase={auction.phase} size="sm" />
          </div>

          {/* Has User Bid Indicator */}
          {auction.hasUserBid && (
            <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Your Bid
            </div>
          )}
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Title and Token Symbol */}
          <div className="space-y-1">
            <h3 className="font-bold text-xl line-clamp-1 group-hover:text-primary transition-colors">
              {auction.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-muted-foreground">${auction.tokenSymbol}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{formatNumber(auction.totalTokenSupply)} tokens</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Starting/Clearing Price */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span>{auction.clearingPrice > 0 ? 'Clearing' : 'Starting'}</span>
              </div>
              <div className="font-mono font-bold text-sm">
                ${formatPrice(auction.clearingPrice > 0 ? auction.clearingPrice : auction.startingPrice)}
              </div>
            </div>

            {/* Total Bids */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>Bids</span>
              </div>
              <div className="font-bold text-sm">{auction.totalBids}</div>
            </div>

            {/* Allocation Progress */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Filled</span>
              </div>
              <div className="font-bold text-sm">
                {formatPercentage(auction.tokensAllocated, auction.totalTokenSupply)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Allocation</span>
              <span>
                {formatNumber(auction.tokensAllocated)} / {formatNumber(auction.totalTokenSupply)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Timer */}
          {isActive && (
            <div className="pt-2 border-t">
              <AuctionTimer endTime={auction.biddingEndTime} label="Ends in" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
