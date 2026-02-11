import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router'
import { AppProviders } from '@/components/app-providers.tsx'
import { MainLayout } from '@/components/layout'
import { ReferralPage, LeaderboardPage, TradePage, DashboardPage, SupportPage, AuctionPage, ExplorePage, WhitelistCheckerPage } from '@/pages'
import { AuctionListPage } from '@/features/auction/pages/AuctionListPage'
import { AuctionDetailPage } from '@/features/auction/pages/AuctionDetailPage'
import { PRODUCTION_MODE } from '@/config'

// Component to handle /s redirect with query params
function ShareRedirect() {
  const [searchParams] = useSearchParams()
  const queryString = searchParams.toString()
  return <Navigate to={`/referral${queryString ? `?${queryString}` : ''}`} replace />
}

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/explorer" replace />} />
            <Route path="/explorer" element={<ExplorePage />} />
            <Route path="/s" element={<ShareRedirect />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* Redirect trade and auction routes to explorer in production mode */}
            <Route
              path="/trade"
              element={<TradePage />}
            />
            <Route
              path="/auction"
              element={<Navigate to="/auction/T-SpaceX" replace />}
            />
            <Route
              path="/auction/:tokenId"
              element={<AuctionPage />}
            />
            <Route
              path="/auction/:auctionId/whitelist"
              element={<WhitelistCheckerPage />}
            />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AppProviders>
  )
}
