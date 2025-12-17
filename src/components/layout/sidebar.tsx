import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import TesseraLogo from './_/terrera-logo.svg?react'
import ExploreIcon from './_/explore.svg?react'
import ReferralIcon from './_/referral.svg?react'
import LeaderboardIcon from './_/leaderboard.svg?react'
import TradeIcon from './_/trade.svg?react'
import DashboardIcon from './_/dashboard.svg?react'
import HelpIcon from './_/help.svg?react'

const navItems = [
  { icon: ExploreIcon, label: 'Explorer', path: '/explorer' },
  { icon: ReferralIcon, label: 'Referral', path: '/referral' },
  { icon: LeaderboardIcon, label: 'Leaderboard', path: '/leaderboard' },
  { icon: TradeIcon, label: 'Trade', path: '/trade' },
  { icon: DashboardIcon, label: 'Dashboard', path: '/dashboard' },
  { icon: HelpIcon, label: 'Support', path: '/support' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-white dark:bg-[#111111]">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center px-6">
          <Link to="/" className="flex items-center gap-2">
            <TesseraLogo className="h-7 text-[#111111] dark:text-white" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#D2FB95] text-black'
                    : 'text-black hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-6 w-6" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
