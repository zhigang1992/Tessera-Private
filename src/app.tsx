import { AppProviders } from '@/components/app-providers.tsx'
import { AppLayout } from '@/components/app-layout.tsx'
import { AppRoutes } from '@/app-routes.tsx'
import { useLocation } from 'react-router'

const links: { label: string; path: string }[] = [
  { label: 'Home', path: '/' },
  { label: 'Account', path: '/account' },
  { label: 'Referral', path: '/referral' },
  { label: 'Leaderboard', path: '/leaderboard' },
]

// Routes that should not use the standard AppLayout
const customLayoutRoutes = ['/', '/referral-new']

export function App() {
  return (
    <AppProviders>
      <AppContent links={links} />
    </AppProviders>
  )
}

function AppContent({ links }: { links: { label: string; path: string }[] }) {
  const location = useLocation()
  const useCustomLayout = customLayoutRoutes.includes(location.pathname)

  if (useCustomLayout) {
    return <AppRoutes />
  }

  return (
    <AppLayout links={links}>
      <AppRoutes />
    </AppLayout>
  )
}
