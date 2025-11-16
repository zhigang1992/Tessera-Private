# Tessera Auction Feature

UI mockup implementation for the Tessera uniform price auction system.

## Overview

This feature implements a complete UI for browsing and interacting with token auctions based on the [Tessera Auction Program](https://github.com/alexsheks/tessera-on-solana/tree/main/programs/tessera-auction).

**Important:** This is a UI mockup only. No real on-chain transactions are executed. All data is mocked.

## Architecture

The feature follows the Tessera project's established patterns:

```
src/features/auction/
├── pages/
│   ├── AuctionListPage.tsx       # Browse all auctions (/auctions)
│   └── AuctionDetailPage.tsx     # Auction details (/auctions/:id)
├── ui/                            # Reusable UI components
│   ├── auction-card.tsx           # Auction card for list view
│   ├── auction-phase-badge.tsx   # Phase status badge
│   ├── auction-timer.tsx          # Live countdown timer
│   ├── bid-input-card.tsx         # Bid placement form
│   └── bid-history-table.tsx     # Bid history table
├── lib/
│   ├── mock-data.ts               # Mock auction data (all phases)
│   └── utils.ts                   # Utility functions
├── types/
│   └── auction.ts                 # TypeScript type definitions
└── README.md                      # This file
```

## Routes

- **`/auctions`** - Auction list page with filtering and sorting
- **`/auctions/:auctionId`** - Individual auction detail page

## Features Implemented

### Auction List Page

- **Filtering** - View all, active, or ended auctions
- **Sorting** - Sort by most recent, ending soon, or most bids
- **Stats Dashboard** - Total auctions, active count, total bids
- **Auction Cards** - Visual cards showing key metrics for each auction

### Auction Detail Page

- **Comprehensive Info** - Full auction details including rules and timing
- **Live Timer** - Real-time countdown to auction end
- **Phase-Specific UI** - Different interfaces for each auction phase:
  - **Bidding/Active** - Bid input form with validation
  - **Processing** - Processing status indicator
  - **Finalized** - Clearing price display and claim button
  - **Failed/Cancelled** - Refund information and claim button
- **Bid History** - Table showing all bids with winning/losing indicators
- **Progress Tracking** - Visual progress bars for token allocation
- **User Bid Indicator** - Highlights user's current bid

### UI Components

#### AuctionCard
Displays auction summary in grid layout with:
- Token image or symbol fallback
- Phase badge
- Key metrics (price, bids, allocation)
- Progress bar
- Timer for active auctions

#### BidInputCard
Interactive bidding form with:
- Price per token input with validation
- Token quantity input with min/max enforcement
- Real-time total calculation
- Uniform price auction explainer
- Current bid display

#### AuctionTimer
Live countdown timer that:
- Updates every second
- Shows days, hours, minutes, seconds
- Uses monospace font for better readability
- Handles expired state

#### BidHistoryTable
Displays sorted bid history with:
- Top 20 bids (configurable)
- Winning/losing indicators
- Top bid highlighting
- User bid highlighting
- Responsive table design

## Auction Phases Covered

All 6 auction phases from the on-chain program are represented:

1. **Bidding** - Initial phase, free bidding without increments
2. **Active** - Competitive phase with minimum increments and anti-sniping
3. **Processing** - Bids being sorted and clearing price calculated
4. **Finalized** - Auction successful, tokens claimable
5. **Failed** - Insufficient demand, refunds available
6. **Cancelled** - Cancelled by authority, refunds available

## Mock Data

The mock data ([lib/mock-data.ts](lib/mock-data.ts)) includes 8 sample auctions covering all possible states:

- TESLA (Bidding - just started)
- DOGE (Active - near end, anti-sniping)
- PEPE (Processing)
- SHIB (Finalized - successful)
- FLOKI (Failed - low demand)
- BONK (Cancelled)
- WIF (Bidding - different parameters)
- MADGEN (High-value with strict limits)

## Design Principles

Following [Anthropic's frontend design guidance](https://claude.com/blog/improving-frontend-design-through-skills):

### Typography
- **Monospace fonts** for numerical data (prices, quantities)
- **Bold weights** for emphasis and hierarchy
- **System fonts** for body text (using Tailwind defaults)

### Color & Theme
- **CSS variables** for consistent theming
- **Light/dark mode** support via Tailwind
- **Semantic colors** (blue for active, green for success, red for errors)
- **Subtle gradients** for visual interest

### Motion & Animation
- **Live timers** with second-by-second updates
- **Smooth transitions** on hover states
- **Progress bars** with animated fills
- **Minimal micro-interactions** (scale on card hover)

### Layout
- **Card-based design** for modularity
- **Grid layouts** for auctions and stats
- **Responsive breakpoints** (mobile-first)
- **Visual hierarchy** through spacing and sizing

## Validation & Error Handling

The bid input form validates:
- Minimum price (must meet starting price)
- Minimum increment (in Active phase)
- Minimum quantity (configurable per auction)
- Maximum quantity (anti-whale protection)
- Real-time error messages with icons

## Usage

### Development

```bash
npm run dev
```

Then navigate to:
- http://localhost:5173/auctions - Auction list
- http://localhost:5173/auctions/1 - Example auction detail

### Adding Real On-Chain Integration

To connect to the actual Solana program:

1. Create hooks in `hooks/use-auction-queries.ts` for reading auction data
2. Create hooks in `hooks/use-auction-onchain.ts` for transactions
3. Replace mock data imports with real data from hooks
4. Add wallet connection checks before allowing bids
5. Replace `toast.success()` calls with actual transaction signatures

Example pattern (based on referral feature):

```typescript
// hooks/use-auction-queries.ts
export function useAuction(auctionId: string) {
  return useQuery({
    queryKey: ['auction', auctionId],
    queryFn: async () => {
      const program = getAuctionProgram()
      const [auctionPDA] = getAuctionPDA(auctionId)
      return await program.account.auction.fetch(auctionPDA)
    },
  })
}

// hooks/use-auction-onchain.ts
export function usePlaceBid() {
  const wallet = useWallet()
  const connection = useSolanaConnection()

  return useMutation({
    mutationFn: async ({ auctionId, pricePerToken, tokenQuantity }) => {
      const program = getAuctionProgram(connection, wallet)
      const tx = await program.methods
        .placeBid(pricePerToken, tokenQuantity)
        .accounts({ /* ... */ })
        .rpc()
      return tx
    },
  })
}
```

## Technical Notes

- Uses **React Router v7** for routing
- Uses **React Query** (TanStack Query) patterns for data fetching (prepared but not connected)
- Uses **Tailwind CSS v4** for styling
- Uses **Radix UI** primitives for accessible components
- Uses **Lucide React** for icons
- Fully **TypeScript** typed with strict mode

## Future Enhancements

- [ ] Connect to real on-chain program
- [ ] Add WebSocket for real-time bid updates
- [ ] Implement optimistic UI updates
- [ ] Add transaction history
- [ ] Add user portfolio view
- [ ] Add auction creation interface (for authorities)
- [ ] Add charts/graphs for price history
- [ ] Add notifications for outbid events
