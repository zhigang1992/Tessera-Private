/**
 * Auction detail page - Placeholder until real auction data is available
 */

import { Navigate } from 'react-router'

export function AuctionDetailPage() {
  // Redirect to auctions list since mock data was removed
  return <Navigate to="/auctions" replace />
}
