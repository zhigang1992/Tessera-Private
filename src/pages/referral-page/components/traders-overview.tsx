import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import TableViewIcon from './_/table-view.svg?react'
import { getTradersOverview, formatCurrency } from '@/services'

export function TradersOverview() {
  const { connected } = useWallet()
  const { data, isLoading } = useQuery({
    queryKey: ['tradersOverview'],
    queryFn: getTradersOverview,
    enabled: connected,
  })

  // Show dash when wallet not connected or loading
  const showDash = !connected || isLoading

  return (
    <div className="flex flex-col md:flex-row gap-[10px]">
      {/* Trading Volume Card */}
      <div className="flex-1 flex items-center justify-between bg-[#d2fb95] dark:bg-[#d2fb95] rounded-[16px] p-6 overflow-hidden">
        <div className="flex flex-col gap-[5px]">
          <p className="text-[12px] text-zinc-900 dark:text-zinc-900">Your trading vol</p>
          <p className="text-[28px] font-light text-zinc-900 dark:text-zinc-900 font-martian leading-none h-10 flex items-center">
            {showDash ? '—' : formatCurrency(data?.tradingVolume ?? 0)}
          </p>
        </div>
        <TableViewIcon className="size-14 text-zinc-700 shrink-0" />
      </div>

      {/* Active Referral Code Card */}
      <div className="flex-1 flex items-center justify-between bg-white rounded-[16px] px-4 py-6">
        <div className="flex flex-col gap-[5px] w-full">
          <p className="text-[12px] text-zinc-900">Active referral code</p>
          <div className="flex items-center w-full">
            <div className="bg-[#d2fb95] w-full rounded-[4px] px-6 h-10 flex items-center justify-center">
              <span className="text-[16px] font-semibold text-zinc-900 font-martian">
                {showDash ? '—' : (data?.activeReferralCode ?? '—')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Points Card */}
      <div className="flex-1 flex items-center justify-between bg-white rounded-[16px] px-4 py-6">
        <div className="flex flex-col gap-[5px]">
          <p className="text-[12px] text-zinc-900">Your trading point</p>
          <p className="text-[28px] font-light text-zinc-900 font-martian leading-none h-10 flex items-center">
            {showDash ? '—' : (data?.tradingPoints?.toLocaleString() ?? '—')}
          </p>
        </div>
      </div>
    </div>
  )
}
