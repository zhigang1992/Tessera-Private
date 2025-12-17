import { Sidebar } from './sidebar'
import { Header } from './header'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
