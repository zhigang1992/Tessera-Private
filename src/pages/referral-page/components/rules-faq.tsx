import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqItems = [
  {
    question: 'How do I get my referral code?',
    answer: 'Click the "Create new code" button above to generate your unique referral code.',
  },
  {
    question: 'When will I receive my rewards?',
    answer: 'Rewards are distributed weekly every Monday at 00:00 UTC.',
  },
  {
    question: 'Is there a limit to how many people I can refer?',
    answer: 'No, there is no limit! The more you refer, the more you earn.',
  },
  {
    question: 'How It Works',
    answer: '1. Share your referral code with friends and family\n2. Earn rewards when they sign up and trade\n3. Track your progress in the dashboard',
  },
  {
    question: 'What is the reward structure?',
    answer: 'L1 (Direct referral): 10% commission\nL2 (Referral of referral): 5% commission\nL3 (Third level): 2% commission',
  },
]

export function RulesFaq() {
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
