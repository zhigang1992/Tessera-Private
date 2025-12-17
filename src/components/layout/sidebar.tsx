import { Link, useLocation } from 'react-router'
import {
  Compass,
  Users,
  BarChart3,
  Zap,
  LayoutDashboard,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import TesseraLogo from './_/terrera-logo.svg?react'

const navItems = [
  { icon: Compass, label: 'Explorer', path: '/explorer' },
  { icon: Users, label: 'Referral', path: '/referral' },
  { icon: BarChart3, label: 'Leaderboard', path: '/leaderboard' },
  { icon: Zap, label: 'Trade', path: '/trade' },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: HelpCircle, label: 'Support', path: '/support' },
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
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#D5F53D] text-black'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
