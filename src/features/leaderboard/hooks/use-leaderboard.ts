import { useQuery } from '@tanstack/react-query'
import { fetchLeaderboard } from '../lib/graphql-client'
import { fromHasuraToNative, BigNumber } from '@/lib/bignumber'
import type { LeaderboardEntry, LeaderboardType } from '../types'

const PAGE_SIZE = 10

export function useLeaderboard(page: number = 1, type: LeaderboardType = 'trading') {
  const offset = (page - 1) * PAGE_SIZE

  return useQuery({
    queryKey: ['leaderboard', type, page],
    queryFn: async () => {
      const data = await fetchLeaderboard(PAGE_SIZE, offset, type)

      const entries: LeaderboardEntry[] = data.public_marts_leaderboard_summary.map((entry, index) => ({
        account: entry.account,
        rank: offset + index + 1,
        total_referrals: Number(entry.total_referrals) || 0,
        total_rewards_usd: BigNumber.toNumber(fromHasuraToNative(entry.total_rewards_usd || '0')),
        total_trading_points: BigNumber.toNumber(fromHasuraToNative(entry.total_trading_points || '0')),
        total_trading_volume: BigNumber.toNumber(fromHasuraToNative(entry.total_trading_volume || '0')),
      }))

      const totalCount = data.public_marts_leaderboard_summary_aggregate.aggregate.count
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
