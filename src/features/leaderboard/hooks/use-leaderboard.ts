import { useQuery } from '@tanstack/react-query'
import { fetchLeaderboard } from '../lib/graphql-client'
import type { LeaderboardEntry } from '../types'

const PAGE_SIZE = 10

export function useLeaderboard(page: number = 1) {
  const offset = (page - 1) * PAGE_SIZE

  return useQuery({
    queryKey: ['leaderboard', page],
    queryFn: async () => {
      const data = await fetchLeaderboard(PAGE_SIZE, offset)

      const entries: LeaderboardEntry[] = data.view_owner_referral_stats.map((entry, index) => ({
        ...entry,
        rank: offset + index + 1,
      }))

      const totalCount = data.view_owner_referral_stats_aggregate.aggregate.count
      const totalPages = Math.ceil(totalCount / PAGE_SIZE)

      return {
        entries,
        totalCount,
        totalPages,
        currentPage: page,
      }
    },
    staleTime: 30000, // 30 seconds
  })
}
