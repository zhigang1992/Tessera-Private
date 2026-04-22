import { AppProviders } from '@/components/app-providers.tsx'
import { MainLayout } from '@/components/layout'
import { AdminMockSolanaMobilePage, AdminMockVolumesPage, AdminWhitelistApplicationsPage, AuctionPage, DashboardPage, EligibilityPage, EligibilityPresale2Page, ExplorePage, LeaderboardPage, ReferralPage, SettingsPage, SupportPage, TradePage, TokenDetailPage, WhitelistCheckerPage } from '@/pages'
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router'
import { getLiveAuctionRoute } from '@/config'

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
            <Route path="/explorer/:assetId" element={<TokenDetailPage />} />
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
              element={<Navigate to={`/auction/${getLiveAuctionRoute()}`} replace />}
            />
            <Route
              path="/auction/:tokenId"
              element={<AuctionPage />}
            />
            <Route
              path="/auction/:tokenId/:tab"
              element={<AuctionPage />}
            />
            <Route
              path="/auction/:auctionId/whitelist"
              element={<WhitelistCheckerPage />}
            />
            <Route
              path="/auction/:auctionId/eligibility"
              element={<EligibilityPage />}
            />
            <Route
              path="/auction/:auctionId/eligibility-presale2"
              element={<EligibilityPresale2Page />}
            />
            <Route path="/admin/mock-volumes" element={<AdminMockVolumesPage />} />
            <Route path="/admin/mock-solana-mobile" element={<AdminMockSolanaMobilePage />} />
            <Route path="/admin/whitelist-applications" element={<AdminWhitelistApplicationsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AppProviders>
  )
}
