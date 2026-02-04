import { Card } from '@/components/ui/card'
import { VestingChart } from './vesting-chart'
import { useAuctionAlphaVault } from '../../context'

export function VestingChartCard() {
  const { vaultInfo, claimInfo, config } = useAuctionAlphaVault()

  // Calculate chart data from real vault info
  const vestingDurationHours = vaultInfo?.vestingDurationHours ?? 24
  const totalAllocation = claimInfo
    ? parseFloat(claimInfo.totalAllocation) / 10 ** config.baseDecimals
    : 0

  // Calculate current progress through vesting period
  let currentProgressHours = 0
  if (vaultInfo?.vestingStartTime && vaultInfo?.vestingEndTime) {
    const now = Date.now()
    const startTime = vaultInfo.vestingStartTime.getTime()
    const endTime = vaultInfo.vestingEndTime.getTime()

    if (now >= startTime && now <= endTime) {
      const elapsed = now - startTime
      const total = endTime - startTime
      currentProgressHours = (elapsed / total) * vestingDurationHours
    } else if (now > endTime) {
      currentProgressHours = vestingDurationHours
    }
  }

  return (
    <Card className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] p-6 h-full">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-black">Release Schedule</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[#1d8f00] rounded-full" />
              <span className="text-[#666]">Unlocked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[#aaa] rounded-full" />
              <span className="text-[#666]">Locked</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          <VestingChart
            totalTokens={totalAllocation}
            totalHours={vestingDurationHours}
            currentProgressHours={currentProgressHours}
          />
        </div>
      </div>
    </Card>
  )
}
