import { useNavigate } from 'react-router'
import { clsx } from 'clsx'
import { useAuctionPresaleVaultConfigs, useAuctionToken, useAuctionTokenId } from '../../context'
import type { AuctionPhaseSummaryMap } from '@/hooks/use-auction-phase-summaries'
import { formatBigNumber, type BigNumberValue } from '@/lib/bignumber'

export interface AuctionPhaseNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  summaries: AuctionPhaseSummaryMap
}

function formatDuration(startTime: Date, endTime: Date): string {
  const diff = endTime.getTime() - startTime.getTime()
  if (diff <= 0) return '0h'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d  ${hours}h`
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h  ${minutes}m`
}

function formatAllocation(amount: BigNumberValue): string {
  return formatBigNumber(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function AuctionPhaseNav({ activeTab, onTabChange, summaries }: AuctionPhaseNavProps) {
  const token = useAuctionToken()
  const tokenId = useAuctionTokenId()
  const presaleConfigs = useAuctionPresaleVaultConfigs()
  const navigate = useNavigate()

  const subTabs = [
    ...presaleConfigs.map((pc) => ({
      id: pc.id,
      label: pc.label,
      isPresale: true,
      presaleId: pc.id,
    })),
    { id: 'auction', label: token.auctionTabLabel ?? 'Public', isPresale: false, presaleId: null as string | null },
  ]

  // Don't render if only one tab
  if (subTabs.length <= 1) return null

  const showEligibility = tokenId === 'T-Kalshi'

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
      {subTabs.map((tab) => {
        const isActive = activeTab === tab.id
        const summary = summaries[tab.id]
        const duration = summary?.startTime && summary?.endTime ? formatDuration(summary.startTime, summary.endTime) : null
        const allocation = summary?.allocation ? formatAllocation(summary.allocation) : null
        return (
          <div
            key={tab.id}
            role="button"
            tabIndex={0}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onTabChange(tab.id)
              }
            }}
            className={clsx(
              'relative w-full sm:flex-1 sm:min-w-[160px] rounded-lg px-[18px] py-[10px] flex flex-col gap-2 items-start text-left transition-all border-2 cursor-pointer',
              isActive
                ? 'bg-[#d2fb95] border-[#111] text-black'
                : 'bg-[#f6f6f6] dark:bg-white/[0.03] border-transparent text-black dark:text-[#d2d2d2] hover:bg-[#ececec] dark:hover:bg-white/[0.05]',
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-bold leading-[21px]">{tab.label}</span>
              {duration && (
                <span
                  className={clsx(
                    'text-[10px] font-mono leading-[15px] px-2 py-1 rounded-full',
                    isActive
                      ? 'bg-black/10 text-black'
                      : 'bg-black/[0.05] dark:bg-white/10 text-black dark:text-[#d2d2d2]',
                  )}
                >
                  {duration}
                </span>
              )}
            </div>
            {allocation && (
              <>
                <div className={clsx('h-px w-full', isActive ? 'bg-black/20' : 'bg-black/20 dark:bg-white/10')} />
                <div className="flex items-center justify-between w-full">
                  <span
                    className={clsx(
                      'text-sm font-medium leading-[15px] tracking-[0.6172px]',
                      isActive ? 'text-[#666]' : 'text-[#666] dark:text-[#999]',
                    )}
                  >
                    Allocation
                  </span>
                  <span className="text-sm font-mono font-semibold leading-6">{allocation}</span>
                </div>
              </>
            )}
            {showEligibility && tab.isPresale && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/auction/${tokenId}/eligibility`)
                }}
                className="mt-1 bg-[#111] hover:bg-[#333] rounded text-white text-xs font-medium px-3 py-1.5 transition-colors whitespace-nowrap"
              >
                Check Eligibility
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
