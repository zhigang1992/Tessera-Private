import { Card } from '@/components/ui/card'
import HourglassEmptyIcon from './_/hourglass-empty.svg?react'

export function ComingSoonCard() {
  return (
    <Card className="rounded-2xl border-2 border-dashed border-[#e0e0e0] dark:border-[#333333] bg-transparent flex flex-col items-center justify-center gap-2 min-h-[250px]">
      <HourglassEmptyIcon className="w-6 h-6 text-[#d4d4d8]" />
      <p className="text-[13px] text-[#a1a1aa] leading-normal">More Assets Coming Soon</p>
    </Card>
  )
}
