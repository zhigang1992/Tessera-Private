import { useEffect } from 'react'
import { useWallet } from '@/hooks/use-wallet'
import { useNavigate, useParams } from 'react-router'
import { Card } from '@/components/ui/card'
import { AppTokenName } from '@/components/app-token-name'
import { AppTokenIcon } from '@/components/app-token-icon'
import { AppTokenAmount } from '@/components/app-token-amount'
import { useAuctionToken } from '../../context'
import { mathIs } from 'math-literal'
import type { UsePresaleVaultReturn } from '@/hooks/use-presale-vault'
import { AuctionPhaseNav, type AuctionPhaseNavProps } from '../auction/auction-phase-nav'

interface PresaleHeaderCardProps {
  presaleVault: UsePresaleVaultReturn
  phaseNav: AuctionPhaseNavProps
}

export function PresaleHeaderCard({ presaleVault, phaseNav }: PresaleHeaderCardProps) {
  const wallet = useWallet()
  const navigate = useNavigate()
  const params = useParams<{ tokenId?: string }>()
  const token = useAuctionToken()

  if (!presaleVault.available) return null

  const {
    config,
    vaultInfo,
    vaultStateDisplay,
    escrowInfo,
    presaleEndsIn,
    presaleStartsIn,
    totalRaised,
    targetRaise,
    maxIndividualDeposit,
    userDeposited,
    progressPercentage,
    refreshVaultInfo,
  } = presaleVault

  const presaleLabel = config.label

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => refreshVaultInfo(), 30000)
    return () => clearInterval(interval)
  }, [refreshVaultInfo])

  const quoteToken = config?.quoteToken ?? null

  const progressWidth = Math.min(progressPercentage, 100)
  const hasPosition = escrowInfo && mathIs`${escrowInfo.totalDeposited} > ${0}`

  const depositsNotStarted = vaultInfo?.presaleStartTime && vaultInfo.presaleStartTime.getTime() > Date.now()

  const statusText = !vaultInfo
    ? 'Loading...'
    : vaultInfo.state === 'deposit_open'
      ? depositsNotStarted
        ? `${presaleLabel} Opens in`
        : `${presaleLabel} Ends in`
      : vaultInfo.state === 'completed'
        ? `${presaleLabel} Complete`
        : vaultInfo.state === 'not_started'
          ? `${presaleLabel} Starting Soon`
          : `${presaleLabel} Ended`

  return (
    <Card className="p-6 bg-white dark:bg-[#323334]">
      <div className="flex flex-col gap-6">
        {/* Shared title */}
        <div className="flex items-center gap-3">
          <AppTokenIcon token={token} size={40} className="w-10 h-10" />
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-1">
              <AppTokenName token={token} /> Liquidity Auction
            </h2>
            {!depositsNotStarted && vaultStateDisplay && (
              <span
                className="text-[10px] font-semibold px-2 py-1 rounded"
                style={{ backgroundColor: `${vaultStateDisplay.color}20`, color: vaultStateDisplay.color }}
              >
                {vaultStateDisplay.label}
              </span>
            )}
            {vaultInfo && !vaultInfo.isPermissionless && (
              <button
                onClick={() => navigate(`/auction/${params.tokenId}/whitelist?vault=${config.id}`)}
                className="text-xs font-medium text-[#06a800] hover:text-[#059000] underline transition-colors ml-auto"
              >
                Check Whitelist
              </button>
            )}
            {params.tokenId === 'T-Kalshi' && (
              <button
                onClick={() => navigate(`/auction/${params.tokenId}/eligibility`)}
                className={`text-xs font-medium text-[#06a800] hover:text-[#059000] underline transition-colors ${vaultInfo && !vaultInfo.isPermissionless ? '' : 'ml-auto'}`}
              >
                Check Eligibility
              </button>
            )}
          </div>
        </div>

        {/* Phase sub-tabs */}
        <AuctionPhaseNav {...phaseNav} />

        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Raised */}
          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col gap-4">
            <div className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">TOTAL RAISED</div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                {quoteToken && (
                  <AppTokenAmount
                    token={quoteToken}
                    amount={totalRaised}
                    showSymbol
                    minimumFractionDigits={0}
                    maximumFractionDigits={0}
                    className="text-2xl font-semibold font-mono text-foreground"
                  />
                )}
                <span className="bg-[rgba(210,251,149,0.5)] text-foreground text-xs font-medium px-2 py-0.5 rounded">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-zinc-200 dark:bg-[rgba(255,255,255,0.1)] rounded-full h-2 overflow-hidden">
                  <div className="bg-[#06a800] h-full rounded-full transition-all" style={{ width: `${progressWidth}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#71717a] dark:text-[#999]">
                    Max Cap:{' '}
                    {quoteToken && <AppTokenAmount token={quoteToken} amount={targetRaise} showSymbol className="font-mono" />}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col justify-between gap-4">
            <span className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">VAULT STATUS</span>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-[#71717a] dark:text-[#999]">{statusText}</span>
                {depositsNotStarted && presaleStartsIn ? (
                  <div className="flex items-center gap-1.5 font-mono text-xl font-semibold text-foreground">
                    <span>{presaleStartsIn.hours}h</span>
                    <span>{presaleStartsIn.minutes}m</span>
                    <span>{presaleStartsIn.seconds}s</span>
                  </div>
                ) : presaleEndsIn ? (
                  <div className="flex items-center gap-1.5 font-mono text-xl font-semibold text-foreground">
                    <span>{presaleEndsIn.hours}h</span>
                    <span>{presaleEndsIn.minutes}m</span>
                    <span>{presaleEndsIn.seconds}s</span>
                  </div>
                ) : (
                  <span className="font-mono text-xl font-semibold text-foreground">-</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#71717a] dark:text-[#999]">Mode</span>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#71717a] dark:text-[#999]">
                    {vaultInfo?.mode === 'fcfs'
                      ? 'First Come First Served'
                      : vaultInfo?.mode === 'prorata'
                        ? 'Pro-Rata'
                        : vaultInfo?.mode === 'fixed_price'
                          ? 'Fixed Price'
                          : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* My Position */}
          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">MY POSITION</span>
              {hasPosition && (
                <span className="bg-[rgba(210,251,149,0.5)] text-white text-[10px] font-semibold px-2 py-1 rounded">
                  Active
                </span>
              )}
            </div>
            {wallet.connected ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#71717a] dark:text-[#999]">Deposited</span>
                  {quoteToken && (
                    <AppTokenAmount
                      token={quoteToken}
                      amount={userDeposited}
                      showSymbol
                      className="text-sm font-semibold font-mono text-foreground"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#71717a] dark:text-[#999]">Claimable</span>
                  <AppTokenAmount
                    token={token}
                    amount={presaleVault.availableToClaim}
                    showSymbol
                    className="text-sm font-semibold font-mono text-foreground"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Connect wallet to view your position</p>
            )}
          </div>

          {/* Presale Info */}
          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 flex flex-col justify-between gap-4">
            <span className="text-[10px] font-medium text-[#71717a] dark:text-[#999] tracking-wider">{presaleLabel.toUpperCase()} INFO</span>
            <div className="flex flex-col gap-2.5">
              {vaultInfo?.averageTokenPrice != null && vaultInfo.averageTokenPrice > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      ${vaultInfo.averageTokenPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-[#71717a] dark:text-[#999]">/ token</span>
                  </div>
                  <div className="h-px bg-zinc-300 dark:bg-[#666]" />
                  <div className="flex flex-col gap-1 text-[10px]">
                    <div className="flex items-center space-x-1">
                      <span className="text-[#71717a] dark:text-[#999]">Immediate Release:</span>
                      <span className="font-mono text-foreground">{vaultInfo.immediateReleasePercentage}%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1 text-[10px]">
                  <div className="flex items-center space-x-1">
                    <span className="text-[#71717a] dark:text-[#999]">Price determined at close</span>
                  </div>
                  {vaultInfo && (
                    <div className="flex items-center space-x-1">
                      <span className="text-[#71717a] dark:text-[#999]">Immediate Release:</span>
                      <span className="font-mono text-foreground">{vaultInfo.immediateReleasePercentage}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
