import { CollapsibleFaq, type FaqItem } from '@/components/ui/collapsible-faq'

const faqItems: FaqItem[] = [
  {
    question: 'Is there a minimum volume for trades to be displayed or hidden?',
    answer: 'We display all referees\' trading activity regardless of the traded size.',
  },
  {
    question: 'If a trade involves swapping multiple assets, how is it displayed?',
    answer: 'It displays the starting asset to the final asset without showing the assets involved in between.',
  },
  {
    question: 'Do you separate trades between traders referred from L1s, L2s, and L3s?',
    answer: 'We display all trades executed by your referees without separating their referral tiers.',
  },
  {
    question: 'Do you display activities outside of trading?',
    answer: 'If your referee transfers their tokens to another address or used DeFi-related activities, we will still display that under the Trading History.\n\nHowever, subsequent transactions from the new address will not be recorded if they are outside of the referral system or beyond L3.',
  },
]

export function RulesFaq() {
  return <CollapsibleFaq id="rules-faq" items={faqItems} />
}
