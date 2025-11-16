/**
 * Auction detail page - Matching Tessera's clean, minimal design
 */

import { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router'
import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuctionTimer } from '../ui/auction-timer'
import { getAuctionById, getUserBidForAuction } from '../lib/mock-data'
import { AuctionPhase } from '../types/auction'
import {
  formatNumber,
  formatPrice,
  isAuctionActive,
  calculateProgress,
  validateBidInput,
  calculateTotalPayment,
} from '../lib/utils'
import { toast } from 'sonner'

export function AuctionDetailPage() {
  const { auctionId } = useParams<{ auctionId: string }>()
  const auction = auctionId ? getAuctionById(auctionId) : undefined

  const [pricePerToken, setPricePerToken] = useState<string>('')
  const [tokenQuantity, setTokenQuantity] = useState<string>('')

  if (!auction) {
    return <Navigate to="/auctions" replace />
  }

  const userBid = getUserBidForAuction(auction.id)
  const auctionWithUserBid = { ...auction, userBid }
  const isActive = isAuctionActive(auction.phase)
  const progress = calculateProgress(auction.tokensAllocated, auction.totalTokenSupply)

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(pricePerToken) || 0
    const quantity = parseFloat(tokenQuantity) || 0
    const errors = validateBidInput(price, quantity, auction, userBid)

    if (!errors.priceError && !errors.quantityError) {
      toast.success('Bid placed successfully! (Mock UI - no real transaction)')
    }
  }

  const price = parseFloat(pricePerToken) || 0
  const quantity = parseFloat(tokenQuantity) || 0
  const totalPayment = calculateTotalPayment(price, quantity)
  const errors = validateBidInput(price, quantity, auction, userBid)

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto w-full max-w-[1480px] px-6 py-10 sm:px-10 lg:px-16">
        {/* Back Button */}
        <Link to="/auctions" className="mb-8 inline-flex items-center gap-2 text-black dark:text-white">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Auctions</span>
        </Link>

        {/* Two Column Layout */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column: Auction Info */}
          <div>
            {/* Image */}
            <div className="relative mb-6 aspect-video overflow-hidden rounded-[32px] bg-[#F7F7FA] dark:bg-[#1C1C1E]">
              {auction.imageUrl ? (
                <img src={auction.imageUrl} alt={auction.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-9xl font-black text-black/5 dark:text-white/5">{auction.tokenSymbol}</span>
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div className="mb-8">
              <h1 className="mb-2 text-[44px] font-semibold leading-[1.05] tracking-tight text-black dark:text-white">
                {auction.title}
              </h1>
              <p className="mb-3 font-mono text-sm text-[#4B5563] dark:text-[#D1D5DB]">
                ${auction.tokenSymbol} · {auction.tokenName}
              </p>
              <p className="text-[#4B5563] leading-relaxed dark:text-[#D1D5DB]">{auction.description}</p>
            </div>

            {/* Divider */}
            <div className="mb-8 h-px bg-[#E7E7EA] dark:bg-[#27272A]" />

            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-2 gap-6">
              <div>
                <div className="mb-1 text-sm text-[#4B5563] dark:text-[#D1D5DB]">
                  {auction.clearingPrice > 0 ? 'Clearing Price' : 'Starting Price'}
                </div>
                <div className="font-mono text-2xl font-semibold text-black dark:text-white">
                  ${formatPrice(auction.clearingPrice > 0 ? auction.clearingPrice : auction.startingPrice)}
                </div>
              </div>
              <div>
                <div className="mb-1 text-sm text-[#4B5563] dark:text-[#D1D5DB]">Total Bids</div>
                <div className="text-2xl font-semibold text-black dark:text-white">{auction.totalBids}</div>
                <div className="text-sm text-[#4B5563] dark:text-[#D1D5DB]">{auction.uniqueBidders} bidders</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-[#4B5563] dark:text-[#D1D5DB]">Total Supply</div>
                <div className="text-2xl font-semibold text-black dark:text-white">
                  {formatNumber(auction.totalTokenSupply)}
                </div>
              </div>
              <div>
                <div className="mb-1 text-sm text-[#4B5563] dark:text-[#D1D5DB]">Allocated</div>
                <div className="text-2xl font-semibold text-black dark:text-white">
                  {Math.round((auction.tokensAllocated / auction.totalTokenSupply) * 100)}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="mb-2 flex justify-between text-sm text-[#4B5563] dark:text-[#D1D5DB]">
                <span>Allocation Progress</span>
                <span>
                  {formatNumber(auction.tokensAllocated)} / {formatNumber(auction.totalTokenSupply)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#E7E7EA] dark:bg-[#27272A]">
                <div
                  className="h-full bg-black transition-all duration-500 dark:bg-white"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Auction Rules */}
            <div className="rounded-[24px] border border-[#E7E7EA] bg-[#F7F7FA] p-6 dark:border-[#27272A] dark:bg-[#1C1C1E]">
              <h3 className="mb-4 font-semibold text-black dark:text-white">Auction Rules</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#4B5563] dark:text-[#D1D5DB]">Min Bid Quantity</span>
                  <span className="font-mono font-semibold text-black dark:text-white">
                    {formatNumber(auction.minBidQuantity)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4B5563] dark:text-[#D1D5DB]">Max per Wallet</span>
                  <span className="font-mono font-semibold text-black dark:text-white">
                    {formatNumber(auction.maxBidPerWallet)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4B5563] dark:text-[#D1D5DB]">Min Increment</span>
                  <span className="font-mono font-semibold text-black dark:text-white">
                    ${formatPrice(auction.minBidIncrement)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4B5563] dark:text-[#D1D5DB]">Payment Token</span>
                  <span className="font-mono font-semibold text-black dark:text-white">{auction.paymentSymbol}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bid Interface */}
          <div>
            {isActive ? (
              <div className="sticky top-10">
                <div className="rounded-[32px] border border-[#E7E7EA] bg-white p-8 dark:border-[#27272A] dark:bg-black">
                  <h2 className="mb-2 text-2xl font-semibold text-black dark:text-white">Place Your Bid</h2>
                  <p className="mb-6 text-sm text-[#4B5563] dark:text-[#D1D5DB]">
                    {auction.phase === AuctionPhase.Bidding
                      ? 'Free bidding without minimum increments'
                      : 'Minimum bid increments enforced'}
                  </p>

                  {/* Timer */}
                  <div className="mb-6 rounded-[16px] bg-[#F7F7FA] p-4 dark:bg-[#1C1C1E]">
                    <div className="mb-1 text-sm text-[#4B5563] dark:text-[#D1D5DB]">Time Remaining</div>
                    <AuctionTimer endTime={auction.auctionEndTime} showIcon={false} className="text-lg font-semibold" />
                  </div>

                  <form onSubmit={handleBidSubmit} className="space-y-5">
                    {/* Price Input */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <Label htmlFor="price" className="text-black dark:text-white">
                          Price per Token ({auction.paymentSymbol})
                        </Label>
                        <span className="text-xs text-[#4B5563] dark:text-[#D1D5DB]">
                          Min: ${formatPrice(auction.startingPrice)}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B5563] dark:text-[#D1D5DB]">
                          $
                        </span>
                        <Input
                          id="price"
                          type="number"
                          step="0.0001"
                          value={pricePerToken}
                          onChange={(e) => setPricePerToken(e.target.value)}
                          placeholder={auction.startingPrice.toString()}
                          className="h-12 border-[#E7E7EA] pl-8 font-mono dark:border-[#27272A]"
                        />
                      </div>
                      {errors.priceError && <p className="mt-1 text-xs text-red-600">{errors.priceError}</p>}
                    </div>

                    {/* Quantity Input */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <Label htmlFor="quantity" className="text-black dark:text-white">
                          Token Quantity
                        </Label>
                        <span className="text-xs text-[#4B5563] dark:text-[#D1D5DB]">
                          Min: {formatNumber(auction.minBidQuantity)} · Max: {formatNumber(auction.maxBidPerWallet)}
                        </span>
                      </div>
                      <Input
                        id="quantity"
                        type="number"
                        step="1"
                        value={tokenQuantity}
                        onChange={(e) => setTokenQuantity(e.target.value)}
                        placeholder={auction.minBidQuantity.toString()}
                        className="h-12 border-[#E7E7EA] font-mono dark:border-[#27272A]"
                      />
                      {errors.quantityError && <p className="mt-1 text-xs text-red-600">{errors.quantityError}</p>}
                    </div>

                    {/* Total Display */}
                    <div className="rounded-[16px] bg-[#F7F7FA] p-4 dark:bg-[#1C1C1E]">
                      <div className="mb-1 text-sm text-[#4B5563] dark:text-[#D1D5DB]">Total Payment</div>
                      <div className="font-mono text-2xl font-semibold text-black dark:text-white">
                        ${formatPrice(totalPayment, 2)} {auction.paymentSymbol}
                      </div>
                      <div className="mt-1 text-xs text-[#4B5563] dark:text-[#D1D5DB]">
                        {formatNumber(quantity)} × ${formatPrice(price)} = ${formatPrice(totalPayment, 2)}
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="rounded-[16px] border border-[#E7E7EA] bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                      <p className="text-xs text-black/70 dark:text-white/70">
                        <strong>Uniform Price Auction:</strong> All winners pay the same clearing price (the lowest
                        winning bid). You'll be refunded the difference if your bid is higher.
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="h-12 w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                      disabled={Boolean(errors.priceError || errors.quantityError)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {userBid ? 'Update Bid' : 'Place Bid'}
                    </Button>

                    {/* Current Bid */}
                    {userBid && (
                      <div className="rounded-[16px] border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-950/20">
                        <div className="mb-1 text-xs font-medium text-green-900 dark:text-green-100">Current Bid</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">
                            {formatNumber(userBid.tokenQuantity)} tokens @ ${formatPrice(userBid.pricePerToken)}
                          </span>
                          <span className="font-mono font-semibold text-green-900 dark:text-green-100">
                            ${formatPrice(userBid.totalPayment, 2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            ) : (
              <div className="sticky top-10">
                <div className="rounded-[32px] border border-[#E7E7EA] bg-white p-8 dark:border-[#27272A] dark:bg-black">
                  <h2 className="mb-4 text-2xl font-semibold text-black dark:text-white">
                    Auction {auction.phase}
                  </h2>

                  {auction.phase === AuctionPhase.Finalized && (
                    <>
                      <div className="mb-6 rounded-[16px] bg-green-50 p-6 dark:bg-green-950/20">
                        <div className="mb-2 text-sm font-medium text-green-900 dark:text-green-100">
                          Clearing Price
                        </div>
                        <div className="font-mono text-4xl font-semibold text-green-700 dark:text-green-300">
                          ${formatPrice(auction.clearingPrice)}
                        </div>
                        <div className="mt-1 text-sm text-green-600 dark:text-green-400">
                          All winners pay this price per token
                        </div>
                      </div>
                      {userBid && (
                        <Button className="h-12 w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
                          Claim Your Tokens
                        </Button>
                      )}
                    </>
                  )}

                  {auction.phase === AuctionPhase.Processing && (
                    <div className="rounded-[16px] border border-[#E7E7EA] bg-[#F7F7FA] p-6 dark:border-[#27272A] dark:bg-[#1C1C1E]">
                      <p className="text-sm text-[#4B5563] dark:text-[#D1D5DB]">
                        Bids are being processed. The clearing price will be calculated soon. Check back shortly!
                      </p>
                    </div>
                  )}

                  {auction.phase === AuctionPhase.Failed && (
                    <>
                      <div className="mb-6 rounded-[16px] border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-950/20">
                        <p className="text-sm text-red-900 dark:text-red-100">
                          Auction failed to meet minimum allocation. All bidders can claim full refunds.
                        </p>
                      </div>
                      {userBid && (
                        <Button
                          variant="outline"
                          className="h-12 w-full border-[#E7E7EA] dark:border-[#27272A]"
                        >
                          Claim Refund
                        </Button>
                      )}
                    </>
                  )}

                  {auction.phase === AuctionPhase.Cancelled && (
                    <>
                      <div className="mb-6 rounded-[16px] border border-[#E7E7EA] bg-[#F7F7FA] p-6 dark:border-[#27272A] dark:bg-[#1C1C1E]">
                        <p className="text-sm text-[#4B5563] dark:text-[#D1D5DB]">
                          Auction was cancelled by the authority. All bidders can claim full refunds.
                        </p>
                      </div>
                      {userBid && (
                        <Button
                          variant="outline"
                          className="h-12 w-full border-[#E7E7EA] dark:border-[#27272A]"
                        >
                          Claim Refund
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
