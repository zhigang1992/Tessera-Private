import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppProviders } from '@/components/app-providers.tsx'
import ReferralFeatureSimple from '@/features/referral/referral-feature-simple.tsx'
import { MigrationPage } from '@/features/admin/pages/MigrationPage'
import { AuctionListPage } from '@/features/auction/pages/AuctionListPage'
import { AuctionDetailPage } from '@/features/auction/pages/AuctionDetailPage'
import { LeaderboardPage } from '@/features/leaderboard/pages/LeaderboardPage'

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ReferralFeatureSimple />} />
          <Route path="/admin/migration" element={<MigrationPage />} />
          <Route path="/auctions" element={<AuctionListPage />} />
          <Route path="/auctions/:auctionId" element={<AuctionDetailPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  )
}
