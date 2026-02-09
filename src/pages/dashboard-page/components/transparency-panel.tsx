import { getAllReserveData } from '@/services'
import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useState } from 'react'

export function TransparencyPanel() {
  const [reserveTooltipOpen, setReserveTooltipOpen] = useState(false)
  const [tokensTooltipOpen, setTokensTooltipOpen] = useState(false)
  const { data: reserveData, isLoading, isError } = useQuery({
    queryKey: ['reserveData'],
    queryFn: getAllReserveData,
    refetchInterval: 60000, // Refresh every minute
  })

  const LedgerLensTooltip = ({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) => (
    <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
      <Tooltip.Root open={isOpen} onOpenChange={onOpenChange}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center touch-manipulation p-0.5"
            onPointerDown={(e) => {
              e.preventDefault()
              onOpenChange(!isOpen)
            }}
          >
            <Info className="w-3 h-3 text-[#71717a] cursor-help" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="max-w-[280px] px-3 py-2 bg-black text-white text-xs leading-[1.4] rounded-lg z-50 shadow-lg"
            sideOffset={4}
            side="bottom"
            align="center"
            collisionPadding={16}
            onPointerDownOutside={() => onOpenChange(false)}
          >
            Real-time proof of reserves provided by LedgerLens, https://ledgerlens.io/
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Real-Time Reserve Data Panel - Full Width */}
      <div className="w-full bg-white dark:bg-[#1a1a1b] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] rounded-2xl">
        <div className="p-4 md:p-6">
          <div className="flex flex-col gap-4 md:gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-lg font-normal text-black dark:text-[#d2d2d2] leading-7">
                  Real-Time Reserve Data
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col">
              <div className="flex flex-col gap-2 md:gap-2">
                {/* Table - with horizontal scroll on mobile */}
                <div className="flex flex-col gap-2.5 overflow-x-auto">
                  {/* Table Header */}
                  <div className="min-w-[400px]">
                    <div className="flex items-center gap-2.5 px-2.5 py-0">
                      <div className="flex-1">
                        <p className="text-xs font-normal text-[#71717a] leading-4 whitespace-nowrap">
                          Asset
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-normal text-[#71717a] leading-4 whitespace-nowrap">
                            Reserve
                          </p>
                          <LedgerLensTooltip isOpen={reserveTooltipOpen} onOpenChange={setReserveTooltipOpen} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-normal text-[#71717a] leading-4 whitespace-nowrap">
                            Tokens
                          </p>
                          <LedgerLensTooltip isOpen={tokensTooltipOpen} onOpenChange={setTokensTooltipOpen} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-normal text-[#71717a] leading-4 whitespace-nowrap">
                          Chainlink
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="min-w-[400px]">
                    <div className="h-px w-full bg-[rgba(17,17,17,0.15)] dark:bg-[rgba(210,210,210,0.1)]" />
                  </div>

                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex items-center justify-center py-6">
                      <p className="text-sm text-[#71717a]">Loading reserve data...</p>
                    </div>
                  )}

                  {/* Error State */}
                  {isError && (
                    <div className="flex items-center justify-center py-6">
                      <p className="text-sm text-red-500">Failed to load reserve data</p>
                    </div>
                  )}

                  {/* Table Rows */}
                  {!isLoading && !isError && reserveData && (
                    <div className="flex flex-col gap-1.5 min-w-[400px]">
                      {reserveData.map((item) => (
                        <div
                          key={item.asset}
                          className="bg-[#EEFFD3] dark:bg-[rgba(210,251,149,0.1)]"
                        >
                          <div className="flex items-center gap-2.5 p-2.5">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-[#404040] dark:text-[#d2d2d2] leading-5 whitespace-nowrap">
                                {item.asset}
                              </p>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-normal text-black dark:text-[#d2d2d2] leading-5 whitespace-nowrap">
                                {item.reserve}
                              </p>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-normal text-black dark:text-[#d2d2d2] leading-5 whitespace-nowrap">
                                {item.tokens}
                              </p>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-normal text-black dark:text-[#d2d2d2] leading-5 whitespace-nowrap">
                                {item.chainlink}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoading && !isError && reserveData && reserveData.length === 0 && (
                    <div className="flex items-center justify-center py-6">
                      <p className="text-sm text-[#71717a]">No reserve data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
