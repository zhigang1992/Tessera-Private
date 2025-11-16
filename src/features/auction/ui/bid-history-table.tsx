/**
 * Table displaying bid history for an auction
 * Shows top bids with winning/losing indicators
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Trophy } from 'lucide-react'
import { Bid } from '../types/auction'
import { formatPrice, formatNumber } from '../lib/utils'

interface BidHistoryTableProps {
  bids: Bid[]
  clearingPrice: number
  limit?: number
  showUserBid?: boolean
}

export function BidHistoryTable({ bids, clearingPrice, limit = 20, showUserBid = false }: BidHistoryTableProps) {
  // Sort bids by price (desc) and timestamp (asc)
  const sortedBids = [...bids].sort((a, b) => {
    if (b.pricePerToken !== a.pricePerToken) {
      return b.pricePerToken - a.pricePerToken
    }
    return a.timestamp - b.timestamp
  })

  const displayBids = limit ? sortedBids.slice(0, limit) : sortedBids

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bid History</span>
          <span className="text-sm font-normal text-muted-foreground">
            {sortedBids.length} total bid{sortedBids.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Bidder</TableHead>
                <TableHead className="text-right">Price/Token</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayBids.map((bid, index) => {
                const isWinning = clearingPrice > 0 ? bid.pricePerToken >= clearingPrice : false
                const isUser = showUserBid && bid.bidder === 'You'
                const isTopBid = index === 0

                return (
                  <TableRow
                    key={`${bid.bidder}-${bid.timestamp}`}
                    className={isUser ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {isTopBid && <Trophy className="h-4 w-4 text-amber-500 inline mr-1" />}
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {bid.bidder}
                      {isUser && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono">${formatPrice(bid.pricePerToken)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(bid.tokenQuantity)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      ${formatPrice(bid.totalPayment, 2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {clearingPrice > 0 ? (
                        isWinning ? (
                          <div className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                            <TrendingUp className="h-3 w-3" />
                            Winning
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-medium">
                            <TrendingDown className="h-3 w-3" />
                            Outbid
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {limit && sortedBids.length > limit && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Showing top {limit} of {sortedBids.length} bids
          </div>
        )}
      </CardContent>
    </Card>
  )
}
