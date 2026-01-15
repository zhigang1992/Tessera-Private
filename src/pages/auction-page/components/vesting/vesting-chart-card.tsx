import { Card } from '@/components/ui/card'
import { VestingChart } from './vesting-chart'

export function VestingChartCard() {
  return (
    <Card className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] dark:from-[#1a2c0d] dark:to-[#243a12] p-6 h-full">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Release Schedule</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#aad36d] rounded-full" />
              <span className="text-zinc-600 dark:text-zinc-400">Unlocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
              <span className="text-zinc-600 dark:text-zinc-400">Locked</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0">
          <VestingChart />
        </div>
      </div>
    </Card>
  )
}
