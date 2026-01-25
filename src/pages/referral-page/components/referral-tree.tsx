import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import TreeIcon from './_/tree.svg?react'
import PersonIcon from './_/person.svg?react'
import { getTraderLayers } from '@/services'

// Default empty data for when wallet is not connected
const emptyLayers = [
  { layer: 'L1', tradersReferred: 0, points: 0 },
  { layer: 'L2', tradersReferred: 0, points: 0 },
  { layer: 'L3', tradersReferred: 0, points: 0 },
]

export function ReferralTree() {
  const { connected } = useWallet()
  const { data = [], isLoading } = useQuery({
    queryKey: ['traderLayers'],
    queryFn: getTraderLayers,
    enabled: connected,
  })

  // Use empty data when wallet not connected, otherwise use fetched data
  const displayData = !connected ? emptyLayers : (data.length > 0 ? data : emptyLayers)
  const showLoading = connected && isLoading

  return (
    <div className="flex flex-col md:flex-row md:items-stretch items-center rounded-[16px] bg-white dark:bg-[#323334] p-4 md:px-6 md:py-4 gap-4 md:gap-6 border dark:border-[rgba(210,210,210,0.1)] border-[rgba(17,17,17,0.15)]">
      {/* Tree Visualization */}
      <div className="w-full md:w-auto flex justify-center md:justify-start shrink-0">
        <div className="bg-white p-[10px] rounded-[8px]">
          <TreeIcon className="w-[300px] h-[220px] md:w-[320px] md:h-[235px] object-contain text-zinc-900" />
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px md:w-px md:h-auto dark:bg-[#393b3d] bg-[#d9d9d9]" />

      {/* Data Table */}
      <div className="flex-1 flex flex-col justify-center gap-[10px] min-w-0 w-full">
        {/* Header */}
        <div className="hidden md:flex justify-between px-[10px]">
          <span className="flex-1 text-[12px] font-medium text-zinc-500 dark:text-[#71717a]">Trader Layers</span>
          <span className="flex-1 text-[12px] font-medium text-zinc-500 dark:text-[#71717a]">Traders Referred</span>
          <span className="flex-1 text-[12px] font-medium text-zinc-500 dark:text-[#71717a]">Points</span>
        </div>
        <div className="md:hidden flex justify-between px-2 text-[11px] font-medium text-zinc-500 dark:text-[#71717a]">
          <span className="flex-1">Trader Layers</span>
          <span className="flex-1 text-center">Traders Referred</span>
          <span className="flex-1 text-right">Points</span>
        </div>

        {/* Rows */}
        <div className="flex flex-col">
          {showLoading ? (
            <div className="px-[10px] py-4 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            displayData.map((row, index) => (
              <div
                key={row.layer}
                className={`flex justify-between items-center px-2 md:px-[10px] rounded-md md:rounded-none ${
                  index % 2 === 0 ? 'bg-zinc-50 dark:bg-[#27272a] py-2 md:py-2' : 'py-3 md:py-4'
                }`}
              >
                <span className="flex-1 text-[13px] md:text-[14px] font-semibold text-zinc-900 dark:text-[#d2d2d2]">
                  {row.layer}
                </span>
                <div className="flex-1 flex items-center justify-center md:justify-start gap-[5px]">
                  <PersonIcon className="size-5 md:size-6 text-zinc-500 dark:text-[#71717a]" />
                  <span className="text-[13px] md:text-[14px] text-zinc-500 dark:text-[#71717a]">{row.tradersReferred}</span>
                </div>
                <span className="flex-1 text-[13px] md:text-[14px] text-zinc-900 dark:text-[#d2d2d2] text-right md:text-left">
                  {row.points}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
