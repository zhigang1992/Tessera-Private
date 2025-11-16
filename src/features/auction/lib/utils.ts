/**
 * Utility functions for auction features
 */

import { AuctionPhase } from '../types/auction'

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(2)
}

/**
 * Format price with appropriate decimal places
 */
export function formatPrice(price: number, decimals = 4): string {
  if (price === 0) return '—'
  if (price < 0.0001) return `<0.0001`
  return price.toFixed(decimals)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

/**
 * Calculate time remaining
 */
export function getTimeRemaining(endTime: number): {
  total: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
} {
  const total = endTime - Date.now()
  const isExpired = total <= 0

  if (isExpired) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }

  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const days = Math.floor(total / (1000 * 60 * 60 * 24))

  return { total, days, hours, minutes, seconds, isExpired: false }
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(endTime: number): string {
  const { days, hours, minutes, seconds, isExpired } = getTimeRemaining(endTime)

  if (isExpired) return 'Ended'

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

/**
 * Get phase display info (label, color)
 */
export function getPhaseDisplay(phase: AuctionPhase): {
  label: string
  colorClass: string
  description: string
} {
  switch (phase) {
    case AuctionPhase.Bidding:
      return {
        label: 'Open Bidding',
        colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30',
        description: 'Free bidding without minimum increments',
      }
    case AuctionPhase.Active:
      return {
        label: 'Competitive',
        colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30',
        description: 'Minimum bid increments enforced',
      }
    case AuctionPhase.Processing:
      return {
        label: 'Processing',
        colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30',
        description: 'Calculating clearing price',
      }
    case AuctionPhase.Finalized:
      return {
        label: 'Completed',
        colorClass: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30',
        description: 'Auction successful - claim tokens',
      }
    case AuctionPhase.Failed:
      return {
        label: 'Failed',
        colorClass: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30',
        description: 'Insufficient demand - claim refund',
      }
    case AuctionPhase.Cancelled:
      return {
        label: 'Cancelled',
        colorClass: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30',
        description: 'Cancelled by authority - claim refund',
      }
    default:
      return {
        label: 'Unknown',
        colorClass: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30',
        description: '',
      }
  }
}

/**
 * Check if auction is active (accepting bids)
 */
export function isAuctionActive(phase: AuctionPhase): boolean {
  return phase === AuctionPhase.Bidding || phase === AuctionPhase.Active
}

/**
 * Check if auction has ended
 */
export function isAuctionEnded(phase: AuctionPhase): boolean {
  return [
    AuctionPhase.Processing,
    AuctionPhase.Finalized,
    AuctionPhase.Failed,
    AuctionPhase.Cancelled,
  ].includes(phase)
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, (current / total) * 100)
}

/**
 * Validate bid input
 */
export function validateBidInput(
  pricePerToken: number,
  tokenQuantity: number,
  auction: {
    startingPrice: number
    minBidQuantity: number
    maxBidPerWallet: number
    minBidIncrement: number
    phase: AuctionPhase
  },
  currentUserBid?: { pricePerToken: number }
): { priceError?: string; quantityError?: string } {
  const errors: { priceError?: string; quantityError?: string } = {}

  // Price validations
  if (pricePerToken < auction.startingPrice) {
    errors.priceError = `Minimum price is ${formatPrice(auction.startingPrice)}`
  }

  if (auction.phase === AuctionPhase.Active && currentUserBid) {
    const requiredPrice = currentUserBid.pricePerToken + auction.minBidIncrement
    if (pricePerToken < requiredPrice) {
      errors.priceError = `Must increase by at least ${formatPrice(auction.minBidIncrement)}`
    }
  }

  // Quantity validations
  if (tokenQuantity < auction.minBidQuantity) {
    errors.quantityError = `Minimum quantity is ${formatNumber(auction.minBidQuantity)}`
  }

  if (tokenQuantity > auction.maxBidPerWallet) {
    errors.quantityError = `Maximum quantity is ${formatNumber(auction.maxBidPerWallet)}`
  }

  return errors
}

/**
 * Calculate total payment
 */
export function calculateTotalPayment(pricePerToken: number, tokenQuantity: number): number {
  return pricePerToken * tokenQuantity
}

/**
 * Calculate refund amount for winning bid
 */
export function calculateRefund(
  bidPrice: number,
  clearingPrice: number,
  filledQuantity: number
): number {
  return (bidPrice - clearingPrice) * filledQuantity
}
