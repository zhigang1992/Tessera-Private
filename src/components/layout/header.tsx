import { useCallback, useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import { useWallet } from '@/hooks/use-wallet'
import { DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { useTheme } from 'next-themes'
import TesseraLogoIcon from './_/tessera-logo-icon.svg?react'
import MenuIcon from './_/menu.svg?react'
import PersonIcon from './_/person.svg?react'
import ChevronDownIcon from './_/chevron-down.svg?react'
import DisconnectIcon from './_/disconnect.svg?react'
import SunIcon from './_/sun.svg?react'
import MoonIcon from './_/moon.svg?react'
import ChevronRightIcon from './_/chevron-right.svg?react'
import { Link } from 'react-router'
import { clsx } from 'clsx'

function ellipsify(str = '', len = 4, delimiter = '...') {
  const strLen = str.length
  const limit = len * 2 + delimiter.length
  return strLen >= limit ? `${str.substring(0, len)}${delimiter}${str.substring(strLen - len, strLen)}` : str
}

interface HeaderProps {
  onMenuClick?: () => void
  backButton?: {
    show: boolean
    text: string
    onClick: () => void
  }
}

export function Header({ onMenuClick, backButton }: HeaderProps) {
  const { connected, publicKey, disconnect } = useWallet()
  const { theme, setTheme } = useTheme()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isThemeSubmenuOpen, setIsThemeSubmenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const address = publicKey?.toBase58() ?? ''

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setIsThemeSubmenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
      setIsDropdownOpen(false)
    } catch (error) {
      console.error('Failed to disconnect wallet', error)
    }
  }, [disconnect])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
  }

  const getCurrentThemeIcon = () => {
    if (!mounted) return <MoonIcon className="size-5" />
    if (theme === 'light') return <SunIcon className="size-5" />
    if (theme === 'dark') return <MoonIcon className="size-5" />
    return <MoonIcon className="size-5" /> // system default shows moon
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] bg-white px-6 dark:bg-[#1e1f20]">
      {/* Mobile: logo */}
      <div className="flex items-center lg:hidden">
        <Link to="/">
          <TesseraLogoIcon className="size-8 text-[#111111] dark:text-white" />
        </Link>
      </div>

      {/* Desktop: Back button (conditional) */}
      <div className="hidden lg:flex items-center">
        {backButton?.show && (
          <button
            className="flex items-center gap-2 text-[14px] text-[#71717a] hover:text-black dark:text-[#a1a1aa] dark:hover:text-[#d2d2d2] transition-colors cursor-pointer"
            onClick={backButton.onClick}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="currentColor" />
            </svg>
            {backButton.text}
          </button>
        )}
      </div>
      {/* Mobile: hamburger menu button */}
      <button onClick={onMenuClick} className="p-2 lg:hidden">
        <MenuIcon className="size-8" />
      </button>

      {/* Desktop: Wallet connection (hidden on mobile) */}
      {connected && publicKey ? (
        <div className="relative hidden lg:block" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-4 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-[#D2FB95]">
              <PersonIcon className="size-6 text-black" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">My account</span>
              <span className="text-xs text-muted-foreground">{ellipsify(address, 4)}</span>
            </div>
            <ChevronDownIcon className="size-6 text-foreground" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden z-50">
              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <DisconnectIcon className="size-5" />
                <span>Disconnect wallet</span>
              </button>

              {/* Theme Toggle */}
              <div>
                <button
                  onClick={() => setIsThemeSubmenuOpen(!isThemeSubmenuOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <SunIcon className="size-5" />
                    <span>Light / Dark</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getCurrentThemeIcon()}
                    <ChevronRightIcon className={clsx('size-5 transition-transform', isThemeSubmenuOpen && 'rotate-90')} />
                  </div>
                </button>

                {/* Theme Submenu - Inline */}
                {isThemeSubmenuOpen && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50">
                    <button
                      onClick={() => handleThemeChange('light')}
                      className="w-full flex items-center justify-between px-4 pl-12 py-2.5 text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <SunIcon className="size-4" />
                        <span>Light</span>
                      </div>
                      {mounted && theme === 'light' && <Check className="size-4 text-primary" />}
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className="w-full flex items-center justify-between px-4 pl-12 py-2.5 text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MoonIcon className="size-4" />
                        <span>Dark</span>
                      </div>
                      {mounted && theme === 'dark' && <Check className="size-4 text-primary" />}
                    </button>
                    <button
                      onClick={() => handleThemeChange('system')}
                      className="w-full flex items-center justify-between px-4 pl-12 py-2.5 text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="size-4 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V14C20 15.1046 19.1046 16 18 16H6C4.89543 16 4 15.1046 4 14V6Z" stroke="currentColor" strokeWidth="2"/>
                            <path d="M9 20H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M12 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </span>
                        <span>System</span>
                      </div>
                      {mounted && theme === 'system' && <Check className="size-4 text-primary" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden lg:block">
          <DynamicWidget />
        </div>
      )}
    </header>
  )
}
