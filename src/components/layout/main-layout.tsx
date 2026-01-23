import { useState, useCallback } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(true)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <div className="lg:pl-64">
        <Header onMenuClick={handleMenuClick} />
        <main className="p-4 lg:p-6">
          <div className="max-w-[1200px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
