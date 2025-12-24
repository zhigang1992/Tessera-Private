import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FaqItem {
  question: string
  answer: string
}

interface CollapsibleFaqProps {
  id?: string
  title?: string
  items: FaqItem[]
  className?: string
}

export function CollapsibleFaq({ id, title = 'Rules & FAQ', items, className }: CollapsibleFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div id={id} className={cn('rounded-2xl bg-white dark:bg-[#18181B] p-4 lg:p-6', className)}>
      <h2 className="text-lg font-bold text-foreground dark:text-[#D2D2D2]">{title}</h2>

      <div className="my-4 h-px bg-gray-100 dark:bg-[#27272A]" />

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-100 dark:border-[#27272A] overflow-hidden"
          >
            <button
              onClick={() => toggleItem(index)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#27272A]"
            >
              <span className="text-sm font-medium text-foreground dark:text-[#D2D2D2]">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 flex-shrink-0 text-muted-foreground dark:text-[#71717A] transition-transform duration-200',
                  openIndex === index && 'rotate-180'
                )}
              />
            </button>
            <div
              className={cn(
                'grid transition-all duration-300 ease-in-out',
                openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 pt-4 text-sm text-muted-foreground dark:text-[#A1A1AA] whitespace-pre-line leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
