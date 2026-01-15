import { Card } from '@/components/ui/card'
import { VestingChart } from './vesting-chart'

export function VestingChartCard() {
  return (
    <Card className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] dark:from-[#1e1f20] dark:to-[#d2fb95] border-0 p-6 h-full">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Release Schedule</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[#1d8f00] rounded-full" />
              <span className="text-zinc-600 dark:text-zinc-400">Unlocked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[#aaa] rounded-full" />
              <span className="text-zinc-600 dark:text-zinc-400">Locked</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          <VestingChart />
        </div>
      </div>
    </Card>
  )
}
