import { useQuery } from '@tanstack/react-query'
import MoneyIcon from './_/money.svg?react'
import { getRewardsOverview, formatSOL } from '@/services'

export function RewardsOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['rewardsOverview'],
    queryFn: getRewardsOverview,
  })

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:h-[128px]">
      {/* Rewards Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#fff] to-[#D2FB95] p-6 h-full">
        <div className="relative z-10">
          <p className="text-sm text-black/60">Rewards</p>
          <p className="text-4xl font-bold text-black font-inria">
            {isLoading ? '—' : formatSOL(data?.rewards ?? 0)}
          </p>
        </div>
        {/* Money Stack Illustration */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4">
          <MoneyIcon />
        </div>
      </div>

      {/* Referral Points Card */}
      <div className="rounded-2xl  bg-white p-6">
        <p className="text-sm text-muted-foreground">Referral Points</p>
        <p className="mt-2 text-2xl font-bold text-black">
          {isLoading ? '—' : (data?.referralPoints?.toLocaleString() ?? '—')}
        </p>
      </div>
    </div>
  )
}


