import { Card } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

interface PresaleProgressPlaceholderProps {
  label: string
}

export function PresaleProgressPlaceholder({ label }: PresaleProgressPlaceholderProps) {
  return (
    <Card className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] p-6 h-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-black">{label} Progress</h3>
        </div>
        <div className="h-[392px] flex flex-col items-center justify-center gap-3">
          <BarChart3 className="w-12 h-12 text-black/20" />
          <p className="text-sm text-black/40 font-medium">Data not available</p>
        </div>
      </div>
    </Card>
  )
}
