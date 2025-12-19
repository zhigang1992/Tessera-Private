import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppProviders } from '@/components/app-providers.tsx'
import { MainLayout } from '@/components/layout'
import { ReferralPage, LeaderboardPage, PlaceholderPage, TradePage, DashboardPage } from '@/pages'
import ReferralFeatureSimple from '@/features/referral/referral-feature-simple'

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/referral" replace />} />
            <Route path="/explorer" element={<PlaceholderPage title="Explorer" />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route path="/referral-simple" element={<ReferralFeatureSimple />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/trade" element={<TradePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/support" element={<PlaceholderPage title="Support" />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AppProviders>
  )
}
