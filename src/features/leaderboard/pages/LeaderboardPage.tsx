import { useState } from 'react'
import { useWallet } from '@/hooks/use-wallet'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ThemeToggleButton } from '@/components/theme-toggle-button'
import LeaderboardHeader from '../ui/leaderboard-header'
import { LeaderboardTable } from '../ui/leaderboard-table'
import { useLeaderboard } from '../hooks/use-leaderboard'
import type { LeaderboardType } from '../types'
import infoImg1 from '@/assets/info/info1.png'
import infoImg2 from '@/assets/info/info2.png'
import infoImg3 from '@/assets/info/info3.png'
import infoImg4 from '@/assets/info/info4.png'
import brain from '@/assets/info/brain.png'

// Brain - pulsing glow effect with subtle movement
const brainVariants = {
  animate: {
    y: [0, -10, 0, -5, 0],
    rotate: [8, 12, 6, 10, 8],
    scale: [1, 1.06, 1, 1.03, 1],
    transition: {
      duration: 4,
      ease: 'easeInOut' as const,
      repeat: Infinity,
    },
  },
}

const tabs: { id: LeaderboardType; label: string }[] = [
  { id: 'trading', label: 'Trading Leaderboard' },
  { id: 'referral', label: 'Referral Leaderboard' },
]

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('trading')
  const [page, setPage] = useState(1)
  const { publicKey } = useWallet()
  const { data, isLoading, error } = useLeaderboard(page, activeTab, publicKey?.toBase58())

  const handleTabChange = (tab: LeaderboardType) => {
    setActiveTab(tab)
    setPage(1) // Reset to first page when switching tabs
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white dark:bg-black sm:pb-24">
      <div className="mx-auto flex w-full max-w-[1366px] flex-col px-0 pt-0 sm:px-6 sm:pt-6 md:px-10 lg:flex-row lg:items-start lg:justify-center lg:gap-6 lg:px-16 lg:pt-10">
        {/* Left panel - Leaderboard content */}
        <div className="relative flex w-full flex-col gap-4 bg-[#fefefe] dark:bg-[#111111] bg-contain bg-repeat py-6 px-4 sm:rounded-2xl sm:px-0 lg:w-[60%] lg:gap-4 lg:p-12">
          <LeaderboardHeader />

          <div className="h-px rounded-full bg-[#000] dark:bg-[#27272A]" />

          <h1 className="text-2xl font-bold text-black dark:text-white font-[Poppins]">Leaderboard</h1>

          {/* Tabs */}
          <div className="flex items-center gap-2 border border-black/15 dark:border-white/15 rounded-lg p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  activeTab === tab.id
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center">
              <p className="text-center text-sm text-red-500">Failed to load leaderboard. Please try again later.</p>
            </div>
          ) : (
            <LeaderboardTable
              entries={data?.entries ?? []}
              currentPage={data?.currentPage ?? 1}
              totalPages={data?.totalPages ?? 1}
              onPageChange={setPage}
              isLoading={isLoading}
              currentUserAddress={publicKey?.toBase58()}
              type={activeTab}
            />
          )}

          {/* Footer */}
          <div className="mt-4 flex items-center justify-start gap-3 text-center text-xs text-black/50 dark:text-white/50">
            <span>© 2025 Tessera PE. All rights reserved.</span>
            <ThemeToggleButton />
          </div>
        </div>

        {/* Right panel - Info cards */}
        <div className="relative hidden w-full lg:flex lg:w-[40%] lg:flex-col lg:gap-6 lg:self-start">
          {[infoImg1, infoImg2, infoImg3, infoImg4].map((img, index) => (
            <img className="w-full" key={index} src={img} alt={`info-${index + 1}`} />
          ))}

          {/* Brain - pulsing glow effect */}
          <motion.div
            className="absolute -right-8 top-1/2 -translate-y-[50%] z-1 hidden w-[120px] md:block lg:-right-12 lg:w-[160px] xl:-right-24 xl:w-[215px]"
            variants={brainVariants}
            animate="animate"
          >
            <img src={brain} className="w-full" alt="Brain" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
