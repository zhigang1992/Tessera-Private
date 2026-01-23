import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { TableHeader } from '@/components/ui/table-header'
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
    <div className="flex flex-col lg:flex-row lg:items-stretch items-center rounded-[16px] bg-white dark:bg-[#323334] px-4 lg:px-6 py-4 gap-4 lg:gap-6 border dark:border-[rgba(210,210,210,0.1)] border-[rgba(17,17,17,0.15)]">
      {/* Tree Visualization */}
      <div className="flex items-center justify-center shrink-0">
        <TreeIcon className="w-full max-w-[200px] lg:max-w-[260px] h-auto text-zinc-900 dark:text-zinc-100" />
      </div>

      {/* Divider */}
      <div className="w-full h-px lg:w-px lg:h-auto dark:bg-[#393b3d] bg-[#d9d9d9]" />

      {/* Data Table */}
      <div className="flex-1 flex flex-col gap-[10px] min-w-0 w-full">
        {/* Header */}
        <div className="hidden lg:flex justify-between px-2 lg:px-[10px]">
          <TableHeader
            columns={[
              { label: 'Trader Layers', className: 'flex-1' },
              { label: 'Traders Referred', className: 'flex-1' },
              { label: 'Points', className: 'flex-1' },
            ]}
            className="px-0"
          />
        </div>
        <div className="lg:hidden flex justify-between px-2 text-[11px] text-zinc-500 dark:text-[#71717a]">
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
                className={`flex justify-between items-center px-2 lg:px-[10px] rounded-md lg:rounded-none ${
                  index % 2 === 0 ? 'bg-zinc-50 dark:bg-[#323334] py-2' : 'py-3 lg:py-4'
                }`}
              >
                <span className="flex-1 text-[13px] lg:text-[14px] font-semibold text-zinc-900 dark:text-[#d2d2d2]">
                  {row.layer}
                </span>
                <div className="flex-1 flex items-center justify-center lg:justify-start gap-[5px]">
                  <PersonIcon className="size-5 lg:size-6 text-zinc-500 dark:text-white" />
                  <span className="text-[13px] lg:text-[14px] text-zinc-500 dark:text-[#d2d2d2]">{row.tradersReferred}</span>
                </div>
                <span className="flex-1 text-[13px] lg:text-[14px] text-zinc-900 dark:text-[#d2d2d2] text-right lg:text-left">
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
