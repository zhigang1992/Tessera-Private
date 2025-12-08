import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { ThemeToggleButton } from '@/components/theme-toggle-button'
import LeaderboardHeader from '../ui/leaderboard-header'
import { LeaderboardTable } from '../ui/leaderboard-table'
import { useLeaderboard } from '../hooks/use-leaderboard'

export function LeaderboardPage() {
  const [page, setPage] = useState(1)
  const { publicKey } = useWallet()
  const { data, isLoading, error } = useLeaderboard(page)

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white dark:bg-black">
      <div className="mx-auto flex w-full max-w-[780px] flex-col gap-6 px-4 py-12 sm:px-6 md:px-10 lg:px-12">
        {/* Content card */}
        <div className="relative flex w-full flex-col gap-6 rounded-2xl bg-[#fefefe] dark:bg-[#111111] p-6 sm:p-12">
          <LeaderboardHeader />

          <div className="h-px rounded-full bg-[#000] dark:bg-[#27272A]" />

          <h1 className="text-2xl font-bold text-black dark:text-white font-[Poppins]">Referral Leaderboard</h1>

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
            />
          )}

          {/* Footer */}
          <div className="mt-4 flex items-center justify-start gap-3 text-center text-xs text-black/50 dark:text-white/50">
            <span>© 2025 Tessera PE. All rights reserved.</span>
            <ThemeToggleButton />
          </div>
        </div>
      </div>
    </div>
  )
}
