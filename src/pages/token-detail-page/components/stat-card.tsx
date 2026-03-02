import type { ReactNode } from 'react'
import { Info } from 'lucide-react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: ReactNode
  hasInfo?: boolean
}

export function StatCard({ icon, label, value, hasInfo = false }: StatCardProps) {
  return (
    <div className="rounded-lg px-3 py-2 flex items-center gap-3 md:gap-4 bg-[#f4f4f5] dark:bg-[#3f3f46]">
      <div className="flex items-center justify-center shrink-0 size-9 md:size-12 rounded-full bg-white dark:bg-[#27272a]">
        {icon}
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[12px] text-[#71717a] leading-4 uppercase">
            {label}
          </span>
          {hasInfo && (
            <Info className="w-3.5 h-3.5 text-[#71717a] shrink-0" />
          )}
        </div>
        <span className="text-sm md:text-base font-bold leading-4 text-[#18181b] dark:text-[#d2d2d2]">
          {value}
        </span>
      </div>
    </div>
  )
}
