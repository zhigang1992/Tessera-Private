import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppProviders } from '@/components/app-providers.tsx'
import ReferralFeatureSimple from '@/features/referral/referral-feature-simple.tsx'
import { MigrationPage } from '@/features/admin/pages/MigrationPage'

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ReferralFeatureSimple />} />
          <Route path="/admin/migration" element={<MigrationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  )
}
