import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { Trophy} from 'lucide-react'
import { getRewardsOverview, formatCurrency } from '@/services'
import AwardIcon from './_/award.svg?react'

export function RewardsOverview() {
  const { connected, publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()

  const { data, isLoading } = useQuery({
    queryKey: ['rewardsOverview', walletAddress],
    queryFn: getRewardsOverview,
    enabled: connected,
  })

  // Show dash when wallet not connected or loading
  const showDash = !connected || isLoading

  return (
    <div className="flex flex-col md:flex-row gap-[10px]">
      {/* Rewards Card */}
      <div className="flex-1 flex items-center justify-between bg-[#d2fb95] dark:bg-[#d2fb95] rounded-[16px] p-6 overflow-hidden border dark:border-[rgba(210,210,210,0.1)] border-[rgba(17,17,17,0.15)]">
        <div className="flex flex-col gap-[5px]">
          <p className="text-[12px] text-zinc-900 dark:text-zinc-900">Rewards</p>
          <p className="text-[40px] font-light text-zinc-900 dark:text-zinc-900 font-martian leading-none">
            {showDash ? '—' : formatCurrency(data?.rewards ?? 0)}
          </p>
        </div>
        <Trophy className="size-14 text-zinc-700 shrink-0" strokeWidth={1.5} />
      </div>

      {/* Referral Points Card */}
      <div className="flex-1 flex items-center justify-between bg-white dark:bg-[#323334] rounded-[16px] px-4 py-6 border dark:border-[rgba(210,210,210,0.1)] border-[rgba(17,17,17,0.15)]">
        <div className="flex flex-col gap-[5px]">
          <p className="text-[12px] text-zinc-900 dark:text-[#d2d2d2]">Referral Points</p>
          <p className="text-[40px] font-light text-zinc-900 dark:text-[#d2d2d2] font-martian leading-none">
            {showDash ? '—' : (data?.referralPoints?.toLocaleString() ?? '0')}
          </p>
        </div>
        <AwardIcon className="size-14 text-zinc-700 dark:text-[#d2d2d2] shrink-0" />
      </div>
    </div>
  )
}


