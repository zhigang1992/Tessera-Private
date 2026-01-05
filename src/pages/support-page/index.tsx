import { useState } from 'react'
import {
  Search,
  Globe,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Rocket,
  ShieldCheck,
  Fuel,
  MessageCircle,
  Headphones,
  Bot,
  ArrowUpRight,
} from 'lucide-react'
import { AiChat, type LiveIssue } from './components/ai-chat'

type FAQCategory = {
  id: string
  title: string
  icon: React.ReactNode
  questions: Array<{
    question: string
    answer: string
  }>
}

export default function SupportPage() {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIssue, setSelectedIssue] = useState<LiveIssue | null>(null)

  const toggleQuestion = (questionKey: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionKey)) {
        newSet.delete(questionKey)
      } else {
        newSet.add(questionKey)
      }
      return newSet
    })
  }

  const faqCategories: FAQCategory[] = [
    {
      id: 'access',
      title: 'Access & Permissionless',
      icon: <Globe className="w-5 h-5" />,
      questions: [
        {
          question: 'Do I need to complete KYC or accreditation?',
          answer:
            'No, Tessera is built on a permissionless infrastructure. You do not need to provide personal identification or prove accreditation status to trade. Just connect your wallet.',
        },
        {
          question: 'Who can trade on Tessera?',
          answer:
            'Anyone with a compatible Web3 wallet can access and trade on Tessera. Our platform operates globally without geographic restrictions or user verification requirements.',
        },
        {
          question: 'Which wallets are supported for instant connection?',
          answer:
            'We support all major Solana wallets including Phantom, Solflare, Backpack, and any wallet that supports standard Solana connection protocols.',
        },
      ],
    },
    {
      id: 'trading',
      title: 'Trading & Liquidity',
      icon: <Zap className="w-5 h-5" />,
      questions: [
        {
          question: 'Is liquidity available 24/7?',
          answer:
            'Yes, Tessera operates 24/7 with continuous liquidity provided through our automated market maker (AMM) pools. You can trade anytime without waiting for traditional market hours.',
        },
        {
          question: 'How does instant settlement work?',
          answer:
            'All trades execute and settle instantly on-chain via smart contracts. Once your transaction is confirmed, ownership is transferred immediately without intermediaries or settlement delays.',
        },
        {
          question: 'Can I use Tessera tokens in other DeFi protocols?',
          answer:
            'Yes, all Tessera tokens are standard SPL tokens that can be freely used across the broader Solana DeFi ecosystem including lending platforms, yield farms, and other decentralized applications.',
        },
      ],
    },
    {
      id: 'legal',
      title: 'Legal & Security',
      icon: <Shield className="w-5 h-5" />,
      questions: [
        {
          question: 'How is the asset legally structured?',
          answer:
            'Each asset on Tessera is backed by a legally compliant structure that ensures real ownership rights. Our legal framework varies by asset type and jurisdiction to maintain regulatory compliance.',
        },
        {
          question: 'Is the platform non-custodial?',
          answer:
            'Yes, Tessera is fully non-custodial. You retain complete control of your private keys and assets at all times. We never have custody or control over your funds.',
        },
        {
          question: 'How do you ensure regulatory compliance without KYC?',
          answer:
            'We operate under regulatory frameworks that permit permissionless protocols. Compliance is maintained through smart contract design, transparent operations, and adherence to applicable securities and financial regulations.',
        },
      ],
    },
  ]

  const liveIssues: LiveIssue[] = [
    {
      id: '2941',
      title: 'Wallet Connection Issue',
      status: 'checking',
      submittedTime: '2 mins ago',
    },
    {
      id: '2880',
      title: 'Bridge Transaction',
      status: 'complete',
      submittedTime: '1 week ago',
    },
  ]

  // Show chat view if an issue is selected
  if (selectedIssue) {
    return <AiChat issue={selectedIssue} onBack={() => setSelectedIssue(null)} />
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      {/* AI Search Section */}
      <div className="bg-[#d2fb95] dark:bg-[#d2fb95] rounded-[16px] p-12 mb-6">
        <div className="max-w-[600px] mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-black" />
            <span className="text-black text-[16px]">Tessera AI Agent</span>
          </div>

          <h2 className="text-black text-center text-[32px] font-semibold mb-6">
            What would you like to know?
          </h2>

          <div className="bg-white rounded-[12px] pl-[16px] pr-[8px] py-[8px] mb-4 flex items-center gap-[12px]">
            <Search className="w-5 h-5 text-[#666]" />
            <input
              type="text"
              placeholder="Ask anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-black text-[16px] tracking-[-0.3125px] outline-none placeholder:text-[#999]"
            />
            <button className="bg-black rounded-[8px] w-[40px] h-[40px] p-[8px] hover:bg-[#333] transition-colors flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button className="bg-white hover:bg-gray-100 transition-colors rounded-[999px] px-4 py-2 text-black text-[14px] flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              How to trade SpaceX?
            </button>
            <button className="bg-white hover:bg-gray-100 transition-colors rounded-[999px] px-4 py-2 text-black text-[14px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Do I need KYC?
            </button>
            <button className="bg-white hover:bg-gray-100 transition-colors rounded-[999px] px-4 py-2 text-black text-[14px] flex items-center gap-2">
              <Fuel className="w-4 h-4" />
              Fees & Gas
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Left: Knowledge Base */}
        <div className="bg-white dark:bg-zinc-900 rounded-[16px] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[20px] font-semibold dark:text-white">
              Browse Knowledge Base
            </h3>
            <span className="text-[12px] text-[#71717a]">Updated today</span>
          </div>

          <div className="flex flex-col">
            {faqCategories.map((category, categoryIndex) => {
              return (
                <div key={category.id}>
                  {categoryIndex > 0 && (
                    <div className="bg-[#e4e4e7] dark:bg-zinc-700 h-px w-full my-6" />
                  )}

                  {/* Category Header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-[8px] border border-[#e4e4e7] dark:border-zinc-700 dark:text-white">
                        {category.icon}
                      </div>
                      <span className="font-semibold text-[16px] dark:text-white">
                        {category.title}
                      </span>
                    </div>

                    {/* Questions */}
                    <div className="flex flex-col gap-3">
                      {category.questions.map((q, qIndex) => {
                        const questionKey = `${category.id}-${qIndex}`
                        const isQuestionExpanded =
                          expandedQuestions.has(questionKey)

                        return (
                          <div
                            key={questionKey}
                            className="border-b border-[#f4f4f5] dark:border-zinc-800 last:border-b-0 pb-3 last:pb-0"
                          >
                            <button
                              onClick={() => toggleQuestion(questionKey)}
                              className="flex items-start justify-between w-full text-left hover:opacity-70 transition-opacity py-1"
                            >
                              <span className="text-[14px] text-[#404040] dark:text-zinc-300 pr-4 leading-[20px]">
                                {q.question}
                              </span>
                              {isQuestionExpanded ? (
                                <ChevronUp className="w-5 h-5 text-[#a1a1aa] shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-[#a1a1aa] shrink-0" />
                              )}
                            </button>

                            {isQuestionExpanded && (
                              <p className="text-[14px] text-[#71717a] mt-3 leading-[20px] pr-6">
                                {q.answer}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Live Issues & Community */}
        <div className="flex flex-col gap-6">
          {/* Live Issues */}
          <div className="bg-white dark:bg-zinc-900 rounded-[16px] p-6">
            <h3 className="text-[16px] font-semibold mb-4 dark:text-white">
              Live Issues
            </h3>

            <div className="flex flex-col gap-[12px]">
              {liveIssues.map((issue) => (
                <button
                  key={issue.id}
                  className="px-[16px] py-[12px] bg-[#f6f6f6] dark:bg-zinc-800 rounded-[8px] hover:bg-[#ececec] dark:hover:bg-zinc-700 transition-colors w-full text-left"
                  onClick={() => setSelectedIssue(issue)}
                >
                  <div className="flex flex-col gap-[5px] w-[240px]">
                    <span className="text-[14px] font-medium text-[#404040] dark:text-zinc-300 tracking-[-0.1504px] leading-[21px]">
                      #{issue.id} - {issue.title}
                    </span>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-medium px-[6px] py-[2px] rounded-[4px] leading-[18px]"
                        style={{
                          backgroundColor:
                            issue.status === 'checking' ? '#ffe6c1' : '#bbf6be',
                          color:
                            issue.status === 'checking' ? '#e07d00' : '#008806',
                        }}
                      >
                        {issue.status === 'checking' ? 'Checking' : 'Complete'}
                      </span>
                      <span className="text-[10px] font-normal text-[#71717a] leading-[18px] text-right w-[124px]">
                        Submitted {issue.submittedTime}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Community & Support */}
          <div className="bg-white dark:bg-zinc-900 rounded-[16px] p-6">
            <h3 className="text-[16px] font-semibold mb-2 dark:text-white">
              Community & Support
            </h3>
            <p className="text-[14px] text-[#71717a] mb-4 leading-[20px]">
              Join our community or chat with us for technical assistance.
            </p>

            <div className="flex flex-col gap-3">
              <button className="bg-black hover:bg-gray-800 transition-colors text-white rounded-[8px] px-4 py-3 flex items-center justify-center gap-2">
                <MessageCircle className="w-[18px] h-[18px]" />
                <span className="text-[14px] font-medium">
                  Discord Community
                </span>
              </button>

              <button
                className="bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors border border-[#a1a1aa] dark:border-zinc-600 rounded-[8px] px-4 py-3 flex items-center justify-center gap-2"
                onClick={() => setSelectedIssue(liveIssues[0])}
              >
                <Headphones className="w-[18px] h-[18px] dark:text-white" />
                <span className="text-[14px] font-medium dark:text-white">
                  Technical Support
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
