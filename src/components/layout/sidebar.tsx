import { Link, useLocation } from 'react-router'
import { X } from 'lucide-react'
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

const socialLinks = [
  {
    name: 'x',
    href: 'https://x.com/tessera_pe',
    ariaLabel: 'Follow Tessera on X',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 21 20" fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M17.5739 0L11.6749 6.71331L6.96349 0H0.132941L7.8777 11.0353L0 20H2.9381L9.18215 12.8939L14.1695 20H21L12.9796 8.57219L20.5118 0H17.5739ZM15.4593 17.8844L10.5532 11.0141L9.71346 9.83769L4.23962 2.17192H5.65923L10.3573 8.75137L11.111 9.80694L16.8789 17.8844H15.4593ZM10.0768 11.1605L3.32526 1.70549L9.32304 10.1049L10.0768 11.1605Z"
        />
      </svg>
    ),
  },
  {
    name: 'telegram',
    href: 'https://t.me/TesseraLabs',
    ariaLabel: 'Join Tessera on Telegram',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.325.015.094.034.31.019.478z" />
      </svg>
    ),
  },
  {
    name: 'discord',
    href: 'https://discord.gg/tessera',
    ariaLabel: 'Join Tessera on Discord',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
    hidden: true,
  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-white transition-transform duration-300 dark:bg-[#111111]',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-2">
              <TesseraLogo className="h-7 text-[#111111] dark:text-white" />
            </Link>
            {/* Mobile close button */}
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent lg:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-[#D2FB95] text-black' : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Social Links */}
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              {socialLinks.map((social) =>
                social.hidden ? (
                  <div className='w-6' />
                ) : (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.ariaLabel}
                    className="text-gray-400 transition-colors hover:text-black dark:hover:text-white"
                  >
                    {social.icon}
                  </a>
                ),
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
