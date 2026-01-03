import { useQuery } from '@tanstack/react-query'
import TreeIcon from './_/tree.svg?react'
import DarkTreeIcon from './_/dark-tree.svg?react'
import PersonIcon from './_/person.svg?react'
import { getTraderLayers } from '@/services'

export function ReferralTree() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['traderLayers'],
    queryFn: getTraderLayers,
  })

  return (
    <div className="flex flex-col lg:flex-row items-center rounded-[16px] bg-white dark:bg-[#18181B] px-6 py-4 gap-6">
      {/* Tree Visualization */}
      <div className="flex items-center justify-center shrink-0">
        <TreeIcon className="w-full max-w-[260px] h-auto dark:hidden" />
        <DarkTreeIcon className="w-full max-w-[260px] h-auto hidden dark:block" />
      </div>

      {/* Divider */}
      <div className="w-full h-px lg:w-px lg:h-full lg:self-stretch bg-[#D9D9D9] dark:bg-[#27272A]" />

      {/* Data Table */}
      <div className="flex-1 flex flex-col gap-[10px] min-w-0 w-full">
        {/* Header */}
        <div className="flex justify-between px-[10px] text-[12px] text-zinc-500">
          <span className="flex-1">Trader Layers</span>
          <span className="flex-1">Traders Referred</span>
          <span className="flex-1">Points</span>
        </div>

        {/* Rows */}
        <div className="flex flex-col">
          {isLoading ? (
            <div className="px-[10px] py-4 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            data.map((row, index) => (
              <div
                key={row.layer}
                className={`flex justify-between items-center px-[10px] ${
                  index % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-800/50 py-2' : 'py-4'
                }`}
              >
                <span className="flex-1 text-[14px] font-semibold text-zinc-900 dark:text-zinc-200">
                  {row.layer}
                </span>
                <div className="flex-1 flex items-center gap-[5px]">
                  <PersonIcon className="size-6 text-zinc-500" />
                  <span className="text-[14px] text-zinc-500">{row.tradersReferred}</span>
                </div>
                <span className="flex-1 text-[14px] text-zinc-900 dark:text-zinc-200">
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
