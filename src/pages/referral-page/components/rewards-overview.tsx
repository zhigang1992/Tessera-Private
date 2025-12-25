import { useQuery } from '@tanstack/react-query'
import MoneyIcon from './_/money.svg?react'
import { getRewardsOverview, formatCurrency } from '@/services'

export function RewardsOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['rewardsOverview'],
    queryFn: getRewardsOverview,
  })

  return (
    <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2 md:h-[128px]">
      {/* Rewards Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#fff] to-[#D2FB95] dark:from-[#2a3a1a] dark:to-[#D2FB95] p-4 md:p-6 h-full">
        <div className="relative z-10">
          <p className="text-xs md:text-sm text-black/60 dark:text-[#D2D2D2]">Rewards</p>
          <p className="text-2xl md:text-4xl font-bold text-black font-inria dark:text-white">
            {isLoading ? '—' : formatCurrency(data?.rewards ?? 0)}
          </p>
        </div>
        {/* Money Stack Illustration */}
        <div className="absolute top-1/2 -translate-y-1/2 right-6">
          <MoneyIcon className="h-16 w-16 md:h-auto md:w-auto" />
        </div>
      </div>

      {/* Referral Points Card */}
      <div className="rounded-2xl bg-white dark:bg-[#18181B] p-4 md:p-6">
        <p className="text-xs md:text-sm text-muted-foreground">Referral Points</p>
        <p className="mt-1 md:mt-2 text-xl md:text-2xl font-bold text-foreground">
          {isLoading ? '—' : (data?.referralPoints?.toLocaleString() ?? '—')}
        </p>
      </div>
    </div>
  )
}


