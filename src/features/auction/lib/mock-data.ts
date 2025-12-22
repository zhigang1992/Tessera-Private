/**
 * Mock auction data representing all possible auction states
 * This is for UI mockup purposes only - no real on-chain interactions
 */

import { Auction, AuctionListItem, AuctionPhase, Bid } from '../types/auction'

const now = Date.now()
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/**
 * Generate mock bids for an auction
 */
function generateBids(count: number, priceRange: [number, number], quantityRange: [number, number]): Bid[] {
  const bids: Bid[] = []
  const [minPrice, maxPrice] = priceRange
  const [minQty, maxQty] = quantityRange

  for (let i = 0; i < count; i++) {
    const pricePerToken = minPrice + Math.random() * (maxPrice - minPrice)
    const tokenQuantity = Math.floor(minQty + Math.random() * (maxQty - minQty))
    const totalPayment = pricePerToken * tokenQuantity

    bids.push({
      bidder: `${i + 1}...${Math.random().toString(36).substring(2, 6)}`,
      pricePerToken,
      tokenQuantity,
      totalPayment,
      timestamp: now - Math.random() * DAY,
      isFilled: false,
      filledQuantity: 0,
    })
  }

  return bids.sort((a, b) => b.pricePerToken - a.pricePerToken)
}

/**
 * Mock auction data - covers all phases
 */
export const MOCK_AUCTIONS: Auction[] = [
  // 1. Active Bidding Phase - just started
  {
    id: '1',
    title: 'TESLA Token Launch',
    description:
      'First-ever Tesla memecoin on Solana. Fair launch with uniform price auction mechanism. All winners pay the same clearing price.',
    imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400',
    tokenMint: 'TESLAmint...',
    tokenSymbol: 'TESLA',
    tokenName: 'Tesla Token',
    paymentMint: 'USDC',
    paymentSymbol: 'USDC',
    startingPrice: 0.1,
    minBidQuantity: 100,
    minBidIncrement: 0.01,
    maxBidPerWallet: 10000,
    antiSnipeExtension: 300, // 5 minutes
    totalTokenSupply: 1000000,
    biddingStartTime: now - HOUR,
    biddingEndTime: now + 5 * HOUR,
    auctionEndTime: now + 7 * HOUR,
    phase: AuctionPhase.Bidding,
    clearingPrice: 0,
    tokensAllocated: 0,
    currentMinWinningPrice: 0,
    totalBids: 47,
    uniqueBidders: 42,
    bids: generateBids(47, [0.1, 0.8], [100, 5000]),
  },

  // 2. Active Competitive Phase - near end, anti-sniping active
  {
    id: '2',
    title: 'DOGE Classic Distribution',
    description:
      'Much wow, very fair. Classic meme meets modern DeFi. Anti-sniping protection ensures no last-second manipulation.',
    imageUrl: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400',
    tokenMint: 'DOGEmint...',
    tokenSymbol: 'DOGE',
    tokenName: 'Doge Classic',
    paymentMint: 'USDC',
    paymentSymbol: 'USDC',
    startingPrice: 0.05,
    minBidQuantity: 500,
    minBidIncrement: 0.005,
    maxBidPerWallet: 50000,
    antiSnipeExtension: 600,
    totalTokenSupply: 5000000,
    biddingStartTime: now - 6 * HOUR,
    biddingEndTime: now - 1 * HOUR,
    auctionEndTime: now + 2 * HOUR, // Extended multiple times
    phase: AuctionPhase.Active,
    clearingPrice: 0,
    tokensAllocated: 0,
    currentMinWinningPrice: 0.12, // Current threshold
    totalBids: 234,
    uniqueBidders: 198,
    bids: generateBids(234, [0.05, 0.35], [500, 20000]),
  },

  // 3. Processing Phase - bids being sorted and allocated
  {
    id: '3',
    title: 'PEPE Genesis Allocation',
    description:
      'OG Pepe on Solana. Processing bids to determine fair clearing price. Patience, fren.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
    tokenMint: 'PEPEmint...',
    tokenSymbol: 'PEPE',
    tokenName: 'Pepe Genesis',
    paymentMint: 'USDC',
    paymentSymbol: 'USDC',
    startingPrice: 0.001,
    minBidQuantity: 10000,
    minBidIncrement: 0.0001,
    maxBidPerWallet: 1000000,
    antiSnipeExtension: 300,
    totalTokenSupply: 100000000,
    biddingStartTime: now - 10 * HOUR,
    biddingEndTime: now - 3 * HOUR,
    auctionEndTime: now - HOUR,
    phase: AuctionPhase.Processing,
    clearingPrice: 0, // Being calculated
    tokensAllocated: 45000000, // Partial
    currentMinWinningPrice: 0.0089,
    totalBids: 1543,
    uniqueBidders: 892,
    bids: generateBids(1543, [0.001, 0.05], [10000, 500000]),
  },

  // 4. Finalized Phase - successful auction, clearing price set
  {
    id: '4',
    title: 'SHIB Premier Launch',
    description:
      'Shiba goes Solana. Auction completed successfully! All winners pay $0.0234 per token. Claim your allocation now.',
    imageUrl: 'https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=400',
    tokenMint: 'SHIBmint...',
    tokenSymbol: 'SHIB',
    tokenName: 'Shiba Premier',
    paymentMint: 'USDC',
    paymentSymbol: 'USDC',
    startingPrice: 0.01,
    minBidQuantity: 1000,
    minBidIncrement: 0.001,
    maxBidPerWallet: 100000,
    antiSnipeExtension: 300,
    totalTokenSupply: 10000000,
    biddingStartTime: now - 2 * DAY,
    biddingEndTime: now - 2 * DAY + 6 * HOUR,
    auctionEndTime: now - 2 * DAY + 8 * HOUR,
    phase: AuctionPhase.Finalized,
    clearingPrice: 0.0234, // All winners pay this
    tokensAllocated: 10000000, // All allocated
    currentMinWinningPrice: 0.0234,
    totalBids: 678,
    uniqueBidders: 523,
    bids: generateBids(678, [0.01, 0.15], [1000, 50000]),
  },

  // 5. Failed Phase - not enough demand
  {
    id: '5',
    title: 'FLOKI Experimental Drop',
    description:
      'Viking-themed token launch. Unfortunately, auction failed to meet minimum allocation threshold. Full refunds available.',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
    tokenMint: 'FLOKImint...',
    tokenSymbol: 'FLOKI',
    tokenName: 'Floki Experimental',
    paymentMint: 'USDC',
    paymentSymbol: 'USDC',
    startingPrice: 1.0,
    minBidQuantity: 10,
    minBidIncrement: 0.1,
    maxBidPerWallet: 1000,
    antiSnipeExtension: 300,
    totalTokenSupply: 100000,
    biddingStartTime: now - 3 * DAY,
    biddingEndTime: now - 3 * DAY + 6 * HOUR,
    auctionEndTime: now - 3 * DAY + 8 * HOUR,
    phase: AuctionPhase.Failed,
    clearingPrice: 0,
    tokensAllocated: 12000, // Only 12% allocated
    currentMinWinningPrice: 1.2,
    totalBids: 23,
    uniqueBidders: 18,
    bids: generateBids(23, [1.0, 2.5], [10, 800]),
  },

  // 6. Cancelled Phase - authority cancelled
  {
    id: '6',
    title: 'BONK Community Token',
    description:
      'Community-driven token. Auction cancelled by organizers due to technical issues. All bids will be refunded.',
    imageUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400',
    tokenMint: 'BONKmint...',
    tokenSymbol: 'BONK',
    tokenName: 'Bonk Community',
    paymentMint: 'USDC',
    paymentSymbol: 'USDC',
    startingPrice: 0.0001,
    minBidQuantity: 100000,
    minBidIncrement: 0.00001,
    maxBidPerWallet: 10000000,
    antiSnipeExtension: 300,
    totalTokenSupply: 1000000000,
    biddingStartTime: now - 1 * DAY,
    biddingEndTime: now - 1 * DAY + 6 * HOUR,
    auctionEndTime: now - 1 * DAY + 8 * HOUR,
    phase: AuctionPhase.Cancelled,
    clearingPrice: 0,
    tokensAllocated: 0,
    currentMinWinningPrice: 0,
    totalBids: 156,
    uniqueBidders: 134,
    bids: generateBids(156, [0.0001, 0.001], [100000, 5000000]),
  },

  // 7. Another active bidding - different parameters
  {
    id: '7',
    title: 'WIF Premium Edition',
    description: 'Dogwifhat on Solana with style. Premium allocation for early supporters.',
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
    tokenMint: 'WIFmint...',
    tokenSymbol: 'WIF',
    tokenName: 'WIF Premium',
    paymentMint: 'USDC',
    paymentSymbol: 'USDC',
    startingPrice: 0.5,
    minBidQuantity: 50,
    minBidIncrement: 0.05,
    maxBidPerWallet: 5000,
    antiSnipeExtension: 300,
    totalTokenSupply: 500000,
    biddingStartTime: now - 2 * HOUR,
    biddingEndTime: now + 4 * HOUR,
    auctionEndTime: now + 6 * HOUR,
    phase: AuctionPhase.Bidding,
    clearingPrice: 0,
    tokensAllocated: 0,
    currentMinWinningPrice: 0,
    totalBids: 89,
    uniqueBidders: 76,
    bids: generateBids(89, [0.5, 2.5], [50, 2000]),
  },

  // 8. High-value NFT project auction
  {
    id: '8',
    title: 'Mad Lads Genesis Pass',
    description:
      'Exclusive Genesis Pass for Mad Lads holders. High-value allocation with strict whale protection.',
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400',
    tokenMint: 'MADmint...',
    tokenSymbol: 'MADGEN',
    tokenName: 'Mad Lads Genesis',
    paymentMint: 'USDC',
    paymentSymbol: 'USDC',
    startingPrice: 100,
    minBidQuantity: 1,
    minBidIncrement: 10,
    maxBidPerWallet: 10,
    antiSnipeExtension: 600,
    totalTokenSupply: 1000,
    biddingStartTime: now + 1 * HOUR,
    biddingEndTime: now + 13 * HOUR,
    auctionEndTime: now + 15 * HOUR,
    phase: AuctionPhase.Bidding,
    clearingPrice: 0,
    tokensAllocated: 0,
    currentMinWinningPrice: 0,
    totalBids: 234,
    uniqueBidders: 234, // One bid per wallet due to strict limits
    bids: generateBids(234, [100, 500], [1, 10]),
  },
]

/**
 * Lightweight list items for the auctions list page
 */
export const MOCK_AUCTION_LIST: AuctionListItem[] = MOCK_AUCTIONS.map((auction) => ({
  id: auction.id,
  title: auction.title,
  tokenSymbol: auction.tokenSymbol,
  imageUrl: auction.imageUrl,
  phase: auction.phase,
  biddingEndTime: auction.biddingEndTime,
  auctionEndTime: auction.auctionEndTime,
  totalTokenSupply: auction.totalTokenSupply,
  tokensAllocated: auction.tokensAllocated,
  clearingPrice: auction.clearingPrice,
  totalBids: auction.totalBids,
  startingPrice: auction.startingPrice,
  hasUserBid: Math.random() > 0.5, // Random for mockup
  biddingStartTime: auction.biddingStartTime,
}))

/**
 * Get auction by ID
 */
export function getAuctionById(id: string): Auction | undefined {
  return MOCK_AUCTIONS.find((a) => a.id === id)
}

/**
 * Get user's bid for an auction (mock)
 */
export function getUserBidForAuction(auctionId: string): Bid | undefined {
  const auction = getAuctionById(auctionId)
  if (!auction || !auction.bids || auction.bids.length === 0) return undefined

  // Randomly assign user a bid for mockup
  if (Math.random() > 0.3) {
    const randomBid = auction.bids[Math.floor(Math.random() * Math.min(20, auction.bids.length))]
    return {
      ...randomBid,
      bidder: 'You',
    }
  }

  return undefined
}
