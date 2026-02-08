import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppProviders } from '@/components/app-providers.tsx'
import { MainLayout } from '@/components/layout'
import { ReferralPage, LeaderboardPage, TradePage, DashboardPage, SupportPage, AuctionPage, ExplorePage } from '@/pages'
import { AuctionListPage } from '@/features/auction/pages/AuctionListPage'
import { AuctionDetailPage } from '@/features/auction/pages/AuctionDetailPage'
import { PRODUCTION_MODE } from '@/config'

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

            {/* Redirect trade and auction routes to explorer in production mode */}
            <Route
              path="/trade"
              element={PRODUCTION_MODE ? <Navigate to="/explorer" replace /> : <TradePage />}
            />
            <Route
              path="/auction"
              element={PRODUCTION_MODE ? <Navigate to="/explorer" replace /> : <Navigate to="/auction/T-SpaceX" replace />}
            />
            <Route
              path="/auction/:tokenId"
              element={PRODUCTION_MODE ? <Navigate to="/explorer" replace /> : <AuctionPage />}
            />
            <Route
              path="/auctions"
              element={PRODUCTION_MODE ? <Navigate to="/explorer" replace /> : <AuctionListPage />}
            />
            <Route
              path="/auctions/:auctionId"
              element={PRODUCTION_MODE ? <Navigate to="/explorer" replace /> : <AuctionDetailPage />}
            />

            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AppProviders>
  )
}
