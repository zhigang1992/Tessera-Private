import { useQuery } from '@tanstack/react-query'
import { getUserDashboard } from '@/services'
import TokenSpacexIcon from './_/token-spacex.svg?react'

export function MyBalanceCard() {
  const { data: userDashboard } = useQuery({
    queryKey: ['userDashboard'],
    queryFn: getUserDashboard,
  })

  return (
    <div className="bg-white dark:bg-[#323334] border border-black/15 dark:border-[rgba(210,210,210,0.1)] rounded-2xl p-4 flex flex-col lg:flex-row gap-2.5">
      {/* My Balance */}
      <div className="bg-zinc-50 dark:bg-[#1e1f20] rounded-lg px-4 lg:px-6 py-4 w-full lg:w-[240px]">
        <p className="text-sm font-medium text-foreground dark:text-[#d2d2d2] leading-5">My Balance</p>
        <p className="text-2xl lg:text-3xl font-semibold text-foreground dark:text-white leading-9">
          ${userDashboard?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '0.00'}
        </p>
      </div>

      {/* Token Info */}
      <div className="flex-1 bg-zinc-50 dark:bg-[#1e1f20] rounded-lg px-4 lg:px-6 py-4">
        <div className="flex flex-col gap-2.5">
          {/* Token Header */}
          <div className="flex items-center gap-2.5">
            <TokenSpacexIcon className="w-14 h-14 lg:w-[72px] lg:h-[72px]" />
            <div className="flex flex-col">
              <p className="text-sm font-bold text-foreground dark:text-[#d2d2d2] leading-5">
                {userDashboard?.tokenName ?? 'T-SpaceX Token'}
              </p>
              <p className="text-2xl lg:text-3xl font-semibold text-foreground dark:text-white leading-9">
                {userDashboard?.tokenBalance.toFixed(2) ?? '0.00'}
              </p>
            </div>
          </div>

          {/* Health Factor */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground dark:text-white">Health Factor</span>
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.6 6.62C17.16 6.62 15.8 7.18 14.83 8.15L12 10.98L9.17 8.15C8.2 7.18 6.84 6.62 5.4 6.62C2.42 6.62 0 9.04 0 12C0 14.96 2.42 17.38 5.4 17.38C6.84 17.38 8.2 16.82 9.17 15.85L12 13.02L14.83 15.85C15.8 16.82 17.16 17.38 18.6 17.38C21.58 17.38 24 14.96 24 12C24 9.04 21.58 6.62 18.6 6.62ZM5.4 15.38C3.53 15.38 2 13.85 2 12C2 10.15 3.53 8.62 5.4 8.62C6.31 8.62 7.16 8.99 7.78 9.61L10.59 12.42L7.78 15.23C7.16 15.85 6.31 16.22 5.4 16.22V15.38ZM18.6 15.38C17.69 15.38 16.84 15.01 16.22 14.39L13.41 11.58L16.22 8.77C16.84 8.15 17.69 7.78 18.6 7.78C20.47 7.78 22 9.31 22 11.16C22 13.01 20.47 14.54 18.6 14.54V15.38Z"
                  className="fill-foreground dark:fill-white"
                />
              </svg>
            </div>
            <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5">
              <div
                className="bg-foreground dark:bg-white h-2.5 rounded-full transition-all"
                style={{ width: `${userDashboard?.healthFactor ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
