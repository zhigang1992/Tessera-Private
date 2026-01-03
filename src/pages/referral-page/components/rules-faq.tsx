import { Smile, ShieldCheck, CreditCard, Mail, Globe, Clock } from 'lucide-react'
import { CollapsibleFaq, type FaqCategory } from '@/components/ui/collapsible-faq'

const faqCategories: FaqCategory[] = [
  {
    label: 'General',
    items: [
      {
        question: 'Is there a minimum volume for trades to be displayed or hidden?',
        answer: 'We display all referees\' trading activity regardless of the traded size.',
        icon: <Smile className="size-6 text-black dark:text-white" />,
      },
      {
        question: 'If a trade involves swapping multiple assets, how is it displayed?',
        answer: 'It displays the starting asset to the final asset without showing the assets involved in between.',
        icon: <ShieldCheck className="size-6 text-black dark:text-white" />,
      },
      {
        question: 'Do you separate trades between traders referred from L1s, L2s, and L3s?',
        answer: 'We display all trades executed by your referees without separating their referral tiers.',
        icon: <CreditCard className="size-6 text-black dark:text-white" />,
      },
      {
        question: 'Do you display activities outside of trading?',
        answer: 'If your referee transfers their tokens to another address or used DeFi-related activities, we will still display that under the Trading History.\n\nHowever, subsequent transactions from the new address will not be recorded if they are outside of the referral system or beyond L3.',
        icon: <Mail className="size-6 text-black dark:text-white" />,
      },
      {
        question: 'Are Tessera tokens supported on popular DEX aggregators?',
        answer: 'Yes, most Token-2022 standard tokens (including Tessera tokens) are supported on popular Solana-based DEX aggregators.',
        icon: <Globe className="size-6 text-black dark:text-white" />,
      },
      {
        question: "What's the difference of using Tessera's UI to trade vs other Solana-based DEX aggregators?",
        answer: 'Our UI by default displays the correct token without the need to manually check token contract to prevent you from interacting with the wrong token.',
        icon: <ShieldCheck className="size-6 text-black dark:text-white" />,
      },
      {
        question: 'Are the tokens still tradable after the IPO?',
        answer: 'Yes, you will still be able to trade them for up to 180 days after the IPO. After 180 days have passed, all tokens will only be redeemable for USDC.',
        icon: <Clock className="size-6 text-black dark:text-white" />,
      },
    ],
  },
]

export function RulesFaq() {
  return <CollapsibleFaq id="rules-faq" categories={faqCategories} />
}
