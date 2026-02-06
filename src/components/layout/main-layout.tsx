import { useState, useCallback } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { useHeader } from '@/contexts/header-context'
import { CookieConsent } from '@/components/cookie-consent'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { backButton } = useHeader()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(true)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#131314]">
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <div className="lg:pl-64">
        <Header onMenuClick={handleMenuClick} backButton={backButton} />
        <main className="p-4 lg:p-6">
          <div className="max-w-[1200px] mx-auto">{children}</div>
        </main>
      </div>
      <CookieConsent />
    </div>
  )
}
