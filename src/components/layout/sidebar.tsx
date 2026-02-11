import { useCallback, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { Check } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { PRODUCTION_MODE } from '@/config'
import TesseraLogo from './_/terrera-logo.svg?react'
import ExploreIcon from './_/explore.svg?react'
import AuctionIcon from './_/auction.svg?react'
import ReferralIcon from './_/referral.svg?react'
import LeaderboardIcon from './_/leaderboard.svg?react'
import TradeIcon from './_/trade.svg?react'
import DashboardIcon from './_/dashboard.svg?react'
import HelpIcon from './_/help.svg?react'
import CloseIcon from './_/close.svg?react'
import PersonIcon from './_/person.svg?react'
import DisconnectIcon from './_/disconnect.svg?react'
import SunIcon from './_/sun.svg?react'
import MoonIcon from './_/moon.svg?react'
import ChevronRightIcon from './_/chevron-right.svg?react'
import DocIcon from './_/icon_doc.svg?react'

function ellipsify(str = '', len = 4, delimiter = '...') {
  const strLen = str.length
  const limit = len * 2 + delimiter.length
  return strLen >= limit ? `${str.substring(0, len)}${delimiter}${str.substring(strLen - len, strLen)}` : str
}

const navItems = [
  { icon: ExploreIcon, label: 'Explore', path: '/explorer' },
  { icon: AuctionIcon, label: 'Auction', path: '/auction', badge: 'LIVE' },
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
      <svg className="h-[18px] w-[18px]" viewBox="0 0 21 20" fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M17.5739 0L11.6749 6.71331L6.96349 0H0.132941L7.8777 11.0353L0 20H2.9381L9.18215 12.8939L14.1695 20H21L12.9796 8.57219L20.5118 0H17.5739ZM15.4593 17.8844L10.5532 11.0141L9.71346 9.83769L4.23962 2.17192H5.65923L10.3573 8.75137L11.111 9.80694L16.8789 17.8844H15.4593ZM10.0768 11.1605L3.32526 1.70549L9.32304 10.1049L10.0768 11.1605Z"
        />
      </svg>
    ),
  },
  {
    name: 'docs',
    href: 'https://docs.tessera.pe/',
    ariaLabel: 'View Tessera Documentation',
    icon: <DocIcon className="h-[18px] w-[18px]" />,
  },
  {
    name: 'telegram',
    href: 'https://t.me/TesseraLabs',
    ariaLabel: 'Join Tessera on Telegram',
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.325.015.094.034.31.019.478z" />
      </svg>
    ),
  },
  // {
  //   name: 'discord',
  //   href: 'https://discord.gg/tessera',
  //   ariaLabel: 'Join Tessera on Discord',
  //   icon: (
  //     <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
  //       <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  //     </svg>
  //   ),
  // },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const { connected, publicKey, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isThemeSubmenuOpen, setIsThemeSubmenuOpen] = useState(false)
  const address = publicKey?.toBase58() ?? ''

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter nav items based on production mode
  const visibleNavItems = PRODUCTION_MODE
    ? navItems.filter((item) => item.path !== '/trade')
    : navItems

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
      onClose?.()
    } catch (error) {
      console.error('Failed to disconnect wallet', error)
    }
  }, [disconnect, onClose])

  const handleOpenModal = useCallback(() => {
    setVisible(true)
    onClose?.()
  }, [setVisible, onClose])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
  }

  const getCurrentThemeLabel = () => {
    if (!mounted) return 'Dark Theme'
    if (theme === 'light') return 'Light Theme'
    if (theme === 'dark') return 'Dark Theme'
    return 'System Theme'
  }

  const SystemIcon = ({ className }: { className?: string }) => (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V14C20 15.1046 19.1046 16 18 16H6C4.89543 16 4 15.1046 4 14V6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M9 20H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )

  const getCurrentThemeIcon = () => {
    if (!mounted) return <MoonIcon className="size-5" />
    if (theme === 'light') return <SunIcon className="size-5" />
    if (theme === 'dark') return <MoonIcon className="size-5" />
    return <SystemIcon className="size-5" />
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r border-border dark:border-[#393b3d] bg-white transition-transform duration-300 dark:bg-[#1e1f20]',
          'hidden lg:block lg:translate-x-0',
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-2">
              <TesseraLogo className="h-7 text-[#111111] dark:text-[#d2d2d2]" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#D2FB95] text-black'
                      : 'text-foreground dark:text-[#d2d2d2] hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-6 w-6" />
                    {item.label}
                  </div>
                  {item.badge && (
                    <div className="flex items-center gap-1 bg-[rgba(6,168,0,0.1)] px-2 py-0.5 rounded-full">
                      <div className="w-2 h-2 bg-[#06a800] rounded-full" />
                      <span className="text-[10px] font-semibold text-[#06a800]">{item.badge}</span>
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Social Links */}
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              {socialLinks.map((social) =>
                (
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

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-0 z-50 bg-white dark:bg-[#1e1f20] transition-transform duration-300 lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile Header */}
          <div className="flex h-[72px] items-center justify-between border-b border-border/15 px-6">
            <span className="text-lg font-semibold">Menu</span>
            <button onClick={onClose} className="p-2 -mr-2">
              <CloseIcon className="size-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 space-y-1 px-4 pt-6">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-[#D2FB95] text-black' : 'text-[#333] dark:text-[#d2d2d2] hover:bg-accent',
                  )}
                >
                  <item.icon className="size-[18px]" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Divider */}
          <div className="mx-4 border-t border-border/15" />

          {/* My Account Section */}
          <div className="px-4 py-6">
            <p className="px-4 text-xs font-semibold uppercase text-[#666] mb-4">My Account</p>

            {/* User Info Card */}
            {connected && publicKey ? (
              <div className="flex items-center gap-3 rounded-lg bg-[#f5f5f5] dark:bg-zinc-800 px-4 py-3 mb-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#D2FB95]">
                  <PersonIcon className="size-6 text-black" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">My account</span>
                  <span className="text-xs text-[#999]">{ellipsify(address, 4)}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleOpenModal}
                className="flex items-center gap-3 rounded-lg bg-[#f5f5f5] dark:bg-zinc-800 px-4 py-3 mb-2 w-full"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-[#D2FB95]">
                  <PersonIcon className="size-6 text-black" />
                </div>
                <span className="text-sm font-medium">Connect Wallet</span>
              </button>
            )}

            {/* Disconnect Wallet */}
            {connected && (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-accent w-full"
              >
                <DisconnectIcon className="size-5" />
                <span>Disconnect wallet</span>
              </button>
            )}

            {/* Theme Toggle */}
            <div>
              <button
                onClick={() => setIsThemeSubmenuOpen(!isThemeSubmenuOpen)}
                className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-accent w-full"
              >
                <div className="flex items-center gap-3">
                  {getCurrentThemeIcon()}
                  <span>{getCurrentThemeLabel()}</span>
                </div>
                <ChevronRightIcon className={`size-5 transition-transform ${isThemeSubmenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Theme Submenu */}
              {isThemeSubmenuOpen && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg ml-4 mt-1">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors rounded-t-lg"
                  >
                    <div className="flex items-center gap-3">
                      <SunIcon className="size-4" />
                      <span>Light</span>
                    </div>
                    {mounted && theme === 'light' && <Check className="size-4 text-primary" />}
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MoonIcon className="size-4" />
                      <span>Dark</span>
                    </div>
                    {mounted && theme === 'dark' && <Check className="size-4 text-primary" />}
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors rounded-b-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-4 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V14C20 15.1046 19.1046 16 18 16H6C4.89543 16 4 15.1046 4 14V6Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path d="M9 20H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M12 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span>System</span>
                    </div>
                    {mounted && theme === 'system' && <Check className="size-4 text-primary" />}
                  </button>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-6 pt-4">
              {socialLinks.map((social) =>
                (
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
