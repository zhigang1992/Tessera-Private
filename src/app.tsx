import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppProviders } from '@/components/app-providers.tsx'
import { MainLayout } from '@/components/layout'
import { ReferralPage, LeaderboardPage, TradePage, DashboardPage, DebugMeteoraPage, SupportPage, AuctionPage, ExplorePage } from '@/pages'
import { MigrationPage } from '@/features/admin/pages/MigrationPage'
import { AuctionListPage } from '@/features/auction/pages/AuctionListPage'
import { AuctionDetailPage } from '@/features/auction/pages/AuctionDetailPage'

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/explorer" replace />} />
            <Route path="/explorer" element={<ExplorePage />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/trade" element={<TradePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/auction" element={<Navigate to="/auction/T-SpaceX" replace />} />
            <Route path="/auction/:tokenId" element={<AuctionPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/admin/migration" element={<MigrationPage />} />
            <Route path="/auctions" element={<AuctionListPage />} />
            <Route path="/auctions/:auctionId" element={<AuctionDetailPage />} />
            <Route path="/debug/meteora" element={<DebugMeteoraPage />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AppProviders>
  )
}
