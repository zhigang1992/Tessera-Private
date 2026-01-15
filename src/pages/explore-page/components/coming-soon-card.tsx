import { Card } from '@/components/ui/card'
import { Clock } from 'lucide-react'

export function ComingSoonCard() {
  return (
    <Card className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-2 h-[250px]">
      <Clock className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
      <p className="text-[13px] text-zinc-400 dark:text-zinc-500">More Assets Coming Soon</p>
    </Card>
  )
}
