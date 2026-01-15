import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppProviders } from '@/components/app-providers.tsx'
import { MainLayout } from '@/components/layout'
import { ReferralPage, LeaderboardPage, TradePage, DashboardPage, DebugMeteoraPage, SupportPage, AuctionPage, ExplorePage } from '@/pages'
import ReferralFeatureSimple from '@/features/referral/referral-feature-simple'
import { MigrationPage } from '@/features/admin/pages/MigrationPage'
import { AuctionListPage } from '@/features/auction/pages/AuctionListPage'
import { AuctionDetailPage } from '@/features/auction/pages/AuctionDetailPage'

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/referral" replace />} />
            <Route path="/explorer" element={<ExplorePage />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route path="/referral-simple" element={<ReferralFeatureSimple />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/trade" element={<TradePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/auction" element={<AuctionPage />} />
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
