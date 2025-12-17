import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppProviders } from '@/components/app-providers.tsx'
import { MainLayout } from '@/components/layout'
import { ReferralPage, PlaceholderPage } from '@/pages'

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/referral" replace />} />
            <Route path="/explorer" element={<PlaceholderPage title="Explorer" />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route path="/leaderboard" element={<PlaceholderPage title="Leaderboard" />} />
            <Route path="/trade" element={<PlaceholderPage title="Trade" />} />
            <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
            <Route path="/support" element={<PlaceholderPage title="Support" />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AppProviders>
  )
}
