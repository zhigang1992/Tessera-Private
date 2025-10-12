import { useRoutes } from 'react-router'
import { lazy } from 'react'

const DashboardFeature = lazy(() => import('@/features/dashboard/dashboard-feature.tsx'))
const AccountDetailFeature = lazy(() => import('@/features/account/account-feature-detail.tsx'))
const AccountIndexFeature = lazy(() => import('@/features/account/account-feature-index.tsx'))
const ReferralFeature = lazy(() => import('@/features/referral/referral-feature.tsx'))
const ReferralFeatureSimple = lazy(() => import('@/features/referral/referral-feature-simple.tsx'))
const LeaderboardFeature = lazy(() => import('@/features/referral/leaderboard-feature.tsx'))

export function AppRoutes() {
  return useRoutes([
    { index: true, element: <ReferralFeatureSimple /> },
    {
      path: 'account',
      children: [
        { index: true, element: <AccountIndexFeature /> },
        { path: ':address', element: <AccountDetailFeature /> },
      ],
    },
    { path: 'dashboard', element: <DashboardFeature /> },
    { path: 'referral', element: <ReferralFeature /> },
    { path: 'referral-new', element: <ReferralFeatureSimple /> },
    { path: 'leaderboard', element: <LeaderboardFeature /> },
  ])
}
