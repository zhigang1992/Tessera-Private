import { useQuery } from '@tanstack/react-query'
import CmputedIcon from './_/cmputed.svg?react'
import { getTradersOverview, formatCurrency } from '@/services'

export function TradersOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['tradersOverview'],
    queryFn: getTradersOverview,
  })

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:h-[128px]">
      {/* Trading Volume Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#fff] to-[#D2FB95] p-6 h-full">
        <div className="relative z-10">
          <p className="text-sm text-black/60">Your trading vol</p>
          <p className="text-4xl font-bold text-black font-inria">
            {isLoading ? '—' : formatCurrency(data?.tradingVolume ?? 0)}
          </p>
        </div>
        {/* Money Stack Illustration */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4">
          <CmputedIcon />
        </div>
      </div>

      {/* Active Referral Code Card */}
      <div className="rounded-2xl bg-white p-6">
        <p className="text-sm text-muted-foreground">Active referral code</p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-2xl font-medium text-black">{isLoading ? '—' : (data?.activeReferralCode ?? '—')}</p>
        </div>
      </div>

      {/* Trading Points Card */}
      <div className="rounded-2xl bg-white p-6">
        <p className="text-sm text-muted-foreground">Your trading point</p>
        <p className="mt-2 text-2xl font-medium text-black">
          {isLoading ? '—' : (data?.tradingPoints?.toLocaleString() ?? '—')}
        </p>
      </div>
    </div>
  )
}
