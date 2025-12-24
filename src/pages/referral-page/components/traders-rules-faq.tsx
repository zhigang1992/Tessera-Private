import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqItems = [
  {
    question: 'How do I earn trading points?',
    answer: 'Simply trade on the platform. Points are automatically calculated based on your trading volume.',
  },
  {
    question: 'When do points update?',
    answer: 'Points are updated in real-time after each completed trade.',
  },
  {
    question: 'Can I transfer my points?',
    answer: 'No, trading points are tied to your account and cannot be transferred.',
  },
  {
    question: 'How Trading Points Work',
    answer: '1. Earn points for every trade you make\n2. Volume matters - higher volume earns more points\n3. Track your progress in the dashboard',
  },
  {
    question: 'What is the point structure?',
    answer: 'Buy: 1 point per $100 (Standard rate)\nSell: 1 point per $100 (Standard rate)\nReferral Bonus: +10% when using referral code',
  },
]

export function TradersRulesFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div id="rules-faq" className="rounded-2xl bg-white dark:bg-[#18181B] p-4 lg:p-6">
      <h2 className="text-lg font-bold text-foreground dark:text-[#D2D2D2]">Rules & FAQ</h2>

      <div className="my-4 h-px bg-gray-100 dark:bg-[#27272A]" />

      <div className="space-y-2">
        {faqItems.map((item, index) => (
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
                  'h-4 w-4 text-muted-foreground dark:text-[#71717A] transition-transform duration-200',
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
                <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground dark:text-[#A1A1AA] whitespace-pre-line leading-relaxed">
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
