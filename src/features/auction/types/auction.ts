/**
 * Auction types based on the Tessera Auction Program
 * @see /Users/kylefang/Projects/alex/tessera-on-solana/programs/tessera-auction/auction_overview.md
 */

/**
 * Auction phases from the on-chain program
 */
export enum AuctionPhase {
  /** Phase 1: Initial bidding collection without competitive pressure */
  Bidding = 'Bidding',
  /** Phase 2: Competitive auction with minimum increments and anti-sniping */
  Active = 'Active',
  /** Phase 3: Processing bids and calculating clearing price */
  Processing = 'Processing',
  /** Phase 4: Auction completed successfully, winners can claim */
  Finalized = 'Finalized',
  /** Auction failed (insufficient bids) */
  Failed = 'Failed',
  /** Auction was cancelled by authority */
  Cancelled = 'Cancelled',
}

/**
 * Individual bid information
 */
export interface Bid {
  /** Bidder's wallet address */
  bidder: string
  /** Price per token in payment tokens (e.g., USDC) */
  pricePerToken: number
  /** Quantity of tokens requested */
  tokenQuantity: number
  /** Total payment locked (pricePerToken * tokenQuantity) */
  totalPayment: number
  /** Timestamp of bid placement (for tiebreaking) */
  timestamp: number
  /** Whether bid has been filled/claimed */
  isFilled: boolean
  /** Actual quantity allocated (may be partial) */
  filledQuantity: number
  /** Whether this bid is a winning bid */
  isWinning?: boolean
}

/**
 * Complete auction data
 */
export interface Auction {
  /** Unique auction identifier */
  id: string

  /** Basic info */
  title: string
  description: string
  imageUrl?: string

  /** Token information */
  tokenMint: string
  tokenSymbol: string
  tokenName: string
  paymentMint: string
  paymentSymbol: string

  /** Auction configuration */
  startingPrice: number
  minBidQuantity: number
  minBidIncrement: number
  maxBidPerWallet: number
  antiSnipeExtension: number // seconds
  totalTokenSupply: number

  /** Timing */
  biddingStartTime: number
  biddingEndTime: number
  auctionEndTime: number

  /** Current state */
  phase: AuctionPhase
  clearingPrice: number
  tokensAllocated: number
  currentMinWinningPrice: number
  totalBids: number
  uniqueBidders: number

  /** Bids (for detail page) */
  bids?: Bid[]

  /** User's bid (if any) */
  userBid?: Bid
}

/**
 * Statistics for auction display
 */
export interface AuctionStats {
  totalValue: number
  averageBidPrice: number
  topBidPrice: number
  participationRate: number // tokens bid / total supply
}

/**
 * Auction list item (lighter version for list views)
 */
export interface AuctionListItem {
  id: string
  title: string
  tokenSymbol: string
  imageUrl?: string
  phase: AuctionPhase
  biddingStartTime: number
  biddingEndTime: number
  auctionEndTime: number
  totalTokenSupply: number
  tokensAllocated: number
  clearingPrice: number
  totalBids: number
  startingPrice: number
  hasUserBid?: boolean
}

/**
 * Form input for placing a bid
 */
export interface BidInput {
  pricePerToken: number
  tokenQuantity: number
}

/**
 * Validation errors for bid input
 */
export interface BidValidation {
  priceError?: string
  quantityError?: string
}
