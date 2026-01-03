import { useState, type ReactNode } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FaqItem {
  question: string
  answer: string | ReactNode
  icon?: ReactNode
}

export interface FaqCategory {
  label: string
  items: FaqItem[]
}

interface CollapsibleFaqProps {
  id?: string
  title?: string
  /** Simple list of FAQ items (no categories) */
  items?: FaqItem[]
  /** FAQ items organized by category with tabs */
  categories?: FaqCategory[]
  className?: string
  /** Default icon for items without a specific icon */
  defaultIcon?: ReactNode
}

export function CollapsibleFaq({
  id,
  title = 'FAQ',
  items,
  categories,
  className,
  defaultIcon,
}: CollapsibleFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState(0)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  // Get current items based on whether we have categories or simple items
  const currentItems = categories ? categories[activeCategory]?.items ?? [] : items ?? []

  const renderIcon = (item: FaqItem) => {
    const icon = item.icon ?? defaultIcon ?? <HelpCircle className="size-5 lg:size-6 text-black dark:text-white" />
    return (
      <div className="flex size-10 lg:size-12 shrink-0 items-center justify-center rounded-lg border border-zinc-400 dark:border-zinc-600">
        {icon}
      </div>
    )
  }

  return (
    <div
      id={id}
      className={cn(
        'rounded-2xl bg-white dark:bg-[#18181B] px-4 lg:px-6 pt-4 lg:pt-6 pb-6 lg:pb-10',
        className
      )}
    >
      {/* Title */}
      <div className="flex items-center justify-center">
        <h2 className="text-2xl lg:text-3xl font-medium text-foreground dark:text-[#D2D2D2]">
          {title}
        </h2>
      </div>

      {/* Category Tabs */}
      {categories && categories.length > 0 && (
        <div className="mt-4 lg:mt-6 flex flex-wrap items-center justify-center gap-[5px]">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveCategory(index)
                setOpenIndex(null)
              }}
              className={cn(
                'h-8 lg:h-10 rounded-full px-3 lg:px-4 text-sm lg:text-base font-medium transition-colors',
                activeCategory === index
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'border-2 border-black text-black hover:bg-black/5 dark:border-white dark:text-white dark:hover:bg-white/5'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="my-4 lg:my-6 h-px bg-black/15 dark:bg-white/15" />

      {/* FAQ Items */}
      <div className="flex flex-col gap-3 lg:gap-4">
        {currentItems.map((item, index) => (
          <div key={index}>
            <div className="flex gap-3 lg:gap-6">
              {/* Icon */}
              <div className="flex h-10 lg:h-12 items-center">
                {renderIcon(item)}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                {/* Question Row */}
                <button
                  onClick={() => toggleItem(index)}
                  className="flex min-h-10 lg:h-12 w-full items-center justify-between text-left gap-2"
                >
                  <span className="text-sm lg:text-base font-semibold text-[#404040] dark:text-[#D2D2D2]">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      'size-5 lg:size-6 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-300',
                      openIndex === index && 'rotate-180'
                    )}
                  />
                </button>

                {/* Answer */}
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    openIndex === index
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="pr-6 lg:pr-10 pt-0 pb-2 text-xs lg:text-sm leading-5 text-zinc-500 dark:text-[#A1A1AA]">
                      {typeof item.answer === 'string' ? (
                        <p className="whitespace-pre-line">{item.answer}</p>
                      ) : (
                        item.answer
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            {index < currentItems.length - 1 && (
              <div className="mt-3 lg:mt-4 h-px bg-black/15 dark:bg-white/15" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
