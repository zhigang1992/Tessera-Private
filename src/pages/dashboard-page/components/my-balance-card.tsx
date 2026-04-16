import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@/hooks/use-wallet'
import { getUserDashboard, getTradersOverview } from '@/services'
import { AppTokenIcon } from '@/components/app-token-icon'
import { AppTokenName } from '@/components/app-token-name'
import { DEFAULT_BASE_TOKEN_ID, getAppToken } from '@/config'

export function MyBalanceCard() {
  const token = getAppToken(DEFAULT_BASE_TOKEN_ID)
  const { connected, publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()

  const { data: userDashboard } = useQuery({
    queryKey: ['userDashboard', DEFAULT_BASE_TOKEN_ID, walletAddress],
    queryFn: () => getUserDashboard(DEFAULT_BASE_TOKEN_ID, walletAddress),
    enabled: connected && !!walletAddress,
    refetchInterval: 10000, // Refetch every 10 seconds
  })

  const { data: tradersOverview } = useQuery({
    queryKey: ['tradersOverview', walletAddress],
    queryFn: () => getTradersOverview(walletAddress),
    enabled: connected && !!walletAddress,
    refetchInterval: 10000, // Refetch every 10 seconds
  })

  const displayBalance = !connected ? '—' : userDashboard?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '0.00'
  const displayTesseraPoints = !connected ? '—' : tradersOverview?.tradingPoints?.toLocaleString('en-US') ?? '0'
  const displayTokenBalance = !connected ? '—' : userDashboard?.tokenBalance.toFixed(2) ?? '0.00'

  return (
    <div className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] border border-[rgba(17,17,17,0.15)] rounded-2xl p-4 flex flex-col lg:flex-row gap-2.5">
      {/* My Balance */}
      <div className="bg-[rgba(255,255,255,0.5)] rounded-lg px-4 lg:px-6 py-4 w-full lg:w-[240px]">
        <p className="text-sm font-medium text-black leading-5">My Balance</p>
        <p className="text-2xl lg:text-3xl font-semibold text-black leading-9">
          {connected ? '$' : ''}{displayBalance}
        </p>
      </div>

      {/* My Tessera points */}
      <div className="bg-[rgba(255,255,255,0.5)] rounded-lg px-4 lg:px-6 py-4 w-full lg:w-[240px]">
        <p className="text-sm font-medium text-black leading-5">My Tessera points</p>
        <p className="text-2xl lg:text-3xl font-semibold text-black leading-9">
          {displayTesseraPoints}
        </p>
      </div>

      {/* Token Info */}
      <div className="flex-1 bg-[rgba(255,255,255,0.5)] rounded-lg px-4 lg:px-6 py-4">
        <div className="flex flex-col gap-2.5">
          {/* Token Header */}
          <div className="flex items-center gap-2.5">
            <AppTokenIcon token={token} className="w-14 h-14 lg:w-[72px] lg:h-[72px]" size={72} />
            <div className="flex flex-col">
              <p className="text-sm font-bold text-black leading-5">
                {userDashboard?.tokenName ?? <AppTokenName token={token} />}
              </p>
              <p className="text-2xl lg:text-3xl font-semibold text-black leading-9">
                {displayTokenBalance}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
