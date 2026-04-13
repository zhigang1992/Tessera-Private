import { useAuctionPresaleVaultConfigs, useAuctionToken } from '../../context'
import type { AuctionPhaseSummaryMap } from '@/hooks/use-auction-phase-summaries'
import { formatBigNumber, type BigNumberValue } from '@/lib/bignumber'

export interface AuctionPhaseNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  summaries: AuctionPhaseSummaryMap
}

function formatCountdown(endTime: Date): string {
  const now = Date.now()
  const diff = endTime.getTime() - now
  if (diff <= 0) return 'Ended'
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
  const presaleConfigs = useAuctionPresaleVaultConfigs()

  const subTabs = [
    ...presaleConfigs.map((pc) => ({
      id: pc.id,
      label: pc.label,
    })),
    { id: 'auction', label: token.auctionTabLabel ?? 'Public' },
  ]

  // Don't render if only one tab
  if (subTabs.length <= 1) return null

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${subTabs.length}, 1fr)` }}>
      {subTabs.map((tab) => {
        const isActive = activeTab === tab.id
        const summary = summaries[tab.id]
        const countdown = summary?.endTime ? formatCountdown(summary.endTime) : null
        const allocation = summary?.allocation ? formatAllocation(summary.allocation) : null
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 rounded-lg text-left text-sm transition-all border ${
              isActive
                ? 'bg-[#d2fb95] dark:bg-[#2a4a1a] border-[#d2fb95] dark:border-[#4ade80] text-black dark:text-[#d2d2d2]'
                : 'bg-white dark:bg-[#2a2a2b] border-[#e4e4e7] dark:border-[#404040] text-[#71717a] dark:text-[#d2d2d2]/50 hover:border-[#a1a1aa] dark:hover:border-[#666]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{tab.label}</span>
              {countdown && (
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                    isActive
                      ? 'bg-[#06a800]/20 text-[#06a800]'
                      : 'bg-zinc-100 dark:bg-[#404040] text-[#71717a] dark:text-[#999]'
                  }`}
                >
                  {countdown}
                </span>
              )}
            </div>
            {allocation && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-current opacity-60">Allocation</span>
                <span className="text-sm font-semibold">{allocation}</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
