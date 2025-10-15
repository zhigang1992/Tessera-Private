import { AppProviders } from '@/components/app-providers.tsx'
import ReferralFeatureSimple from '@/features/referral/referral-feature-simple.tsx'

export function App() {
  return (
    <AppProviders>
      <ReferralFeatureSimple />
    </AppProviders>
  )
}
