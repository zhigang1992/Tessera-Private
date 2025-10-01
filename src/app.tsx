import { AppProviders } from '@/components/app-providers.tsx'
import { AppLayout } from '@/components/app-layout.tsx'
import { AppRoutes } from '@/app-routes.tsx'

const links: { label: string; path: string }[] = [
  { label: 'Home', path: '/' },
  { label: 'Account', path: '/account' },
  { label: 'Referral', path: '/referral' },
  { label: 'Leaderboard', path: '/leaderboard' },
]

export function App() {
  return (
    <AppProviders>
      <AppLayout links={links}>
        <AppRoutes />
      </AppLayout>
    </AppProviders>
  )
}
