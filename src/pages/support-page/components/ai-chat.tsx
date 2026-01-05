import { useState } from 'react'
import { ChevronLeft, Paperclip, Send, Bot, User } from 'lucide-react'
import { type LiveIssue } from '@/services'

type Message = {
  id: string
  type: 'user' | 'system' | 'agent'
  content: string
  timestamp: string
  sender?: string
}

interface AiChatProps {
  issue?: LiveIssue
  initialQuery?: string
  onBack: () => void
}

export function AiChat({ issue, initialQuery, onBack }: AiChatProps) {
  const [replyText, setReplyText] = useState('')

  const issueMessages: Message[] = [
    {
      id: '1',
      type: 'user',
      content:
        "I'm trying to connect my Phantom wallet but it keeps spinning. I've tried refreshing.",
      timestamp: '10:23 AM',
      sender: 'You',
    },
    {
      id: '2',
      type: 'system',
      content:
        'Thank you for the report. Our automated system is checking the bridge status.',
      timestamp: '10:24 AM',
      sender: 'System',
    },
    {
      id: '3',
      type: 'agent',
      content:
        "Hi James, we noticed a slight congestion on the Solana RPC node. Could you try switching to 'Mainnet-Beta' in your wallet settings?",
      timestamp: '10:28 AM',
      sender: 'Support Agent',
    },
  ]

  const searchMessages: Message[] = initialQuery
    ? [
        {
          id: '1',
          type: 'user',
          content: initialQuery,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          sender: 'You',
        },
        {
          id: '2',
          type: 'system',
          content:
            'Thanks for your question! Our AI agent is processing your request...',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          sender: 'System',
        },
      ]
    : []

  const messages = issue ? issueMessages : searchMessages

  return (
    <div className="fixed inset-0 top-[64px] lg:left-64 bg-[#f5f5f5] dark:bg-zinc-950 flex flex-col z-10">
      {/* Header - Fixed at top */}
      <div className="bg-white dark:bg-zinc-900 border-b border-[#e4e4e7] dark:border-zinc-800 px-4 py-4 shrink-0">
        <button
          className="flex items-center gap-2 text-[14px] text-[#71717a] hover:text-black dark:hover:text-white transition-colors mb-4"
          onClick={onBack}
        >
          <ChevronLeft className="w-3 h-3" />
          Back to Support Center
        </button>

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {issue ? (
              <>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[14px] text-[#71717a]">
                    #{issue.id}
                  </span>
                  <span
                    className="text-[10px] font-medium px-[6px] py-[2px] rounded-[4px] leading-[18px]"
                    style={{
                      backgroundColor:
                        issue.status === 'checking' ? '#ffe6c1' : '#bbf6be',
                      color: issue.status === 'checking' ? '#e07d00' : '#008806',
                    }}
                  >
                    {issue.status === 'checking' ? 'Checking' : 'Complete'}
                  </span>
                </div>
                <h1 className="text-[20px] md:text-[24px] font-semibold mb-0 dark:text-white truncate">
                  {issue.title}
                </h1>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-5 h-5 text-[#71717a]" />
                  <span className="text-[14px] text-[#71717a]">
                    Tessera AI Agent
                  </span>
                </div>
                <h1 className="text-[20px] md:text-[24px] font-semibold mb-0 dark:text-white">
                  AI Support Chat
                </h1>
              </>
            )}
          </div>
          {issue && (
            <span className="text-[12px] text-[#71717a] shrink-0">
              {issue.submittedTime}
            </span>
          )}
        </div>
      </div>

      {/* Chat Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-[800px] mx-auto flex flex-col gap-[16px] md:gap-[24px]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col gap-[8px] ${message.type === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message Header */}
              <div
                className={`flex items-center gap-[8px] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {message.type === 'user' && (
                  <>
                    <div className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-full bg-[#d2fb95] flex items-center justify-center shrink-0">
                      <span className="text-[10px] md:text-[11px] font-semibold text-black tracking-[0.0645px]">
                        JD
                      </span>
                    </div>
                    <span className="text-[12px] md:text-[13px] font-medium text-[#18181b] dark:text-white tracking-[0.0645px]">
                      {message.sender}
                    </span>
                    <span className="text-[10px] md:text-[11px] text-[#a1a1aa] tracking-[0.0645px]">
                      {message.timestamp}
                    </span>
                  </>
                )}
                {message.type === 'system' && (
                  <>
                    <div className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-full bg-[#e5e5e5] dark:bg-zinc-700 flex items-center justify-center shrink-0">
                      <Bot className="w-[12px] h-[12px] md:w-[14px] md:h-[14px] text-[#71717a]" />
                    </div>
                    <span className="text-[12px] md:text-[13px] font-medium text-[#18181b] dark:text-white tracking-[0.0645px]">
                      {message.sender}
                    </span>
                    <span className="text-[10px] md:text-[11px] text-[#a1a1aa] tracking-[0.0645px]">
                      {message.timestamp}
                    </span>
                  </>
                )}
                {message.type === 'agent' && (
                  <>
                    <div className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-full bg-[#18181b] flex items-center justify-center shrink-0">
                      <User className="w-[12px] h-[12px] md:w-[14px] md:h-[14px] text-white" />
                    </div>
                    <span className="text-[12px] md:text-[13px] font-medium text-[#18181b] dark:text-white tracking-[0.0645px]">
                      {message.sender}
                    </span>
                    <span className="text-[10px] md:text-[11px] text-[#a1a1aa] tracking-[0.0645px]">
                      {message.timestamp}
                    </span>
                  </>
                )}
              </div>

              {/* Message Content */}
              {message.type === 'user' && (
                <div className="bg-[#d2fb95] rounded-tl-[16px] rounded-bl-[16px] rounded-br-[16px] px-[12px] md:px-[16px] py-[10px] md:py-[12px] max-w-[85%] md:max-w-[480px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                  <p className="text-[13px] leading-[20px] text-[#18181b] tracking-[-0.0762px]">
                    {message.content}
                  </p>
                </div>
              )}
              {message.type === 'system' && (
                <div className="bg-white dark:bg-zinc-800 rounded-tr-[16px] rounded-bl-[16px] rounded-br-[16px] px-[12px] md:px-[16px] py-[10px] md:py-[12px] max-w-[85%] md:max-w-[480px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                  <p className="text-[13px] leading-[20px] text-[#18181b] dark:text-zinc-300 tracking-[-0.0762px]">
                    {message.content}
                  </p>
                </div>
              )}
              {message.type === 'agent' && (
                <div className="bg-[#18181b] rounded-tr-[16px] rounded-bl-[16px] rounded-br-[16px] px-[12px] md:px-[16px] py-[10px] md:py-[12px] max-w-[85%] md:max-w-[480px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                  <p className="text-[13px] leading-[20px] text-white tracking-[-0.0762px]">
                    {message.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="bg-white dark:bg-zinc-900 border-t border-[#e4e4e7] dark:border-zinc-800 px-4 py-3 shrink-0">
        <div className="max-w-[800px] mx-auto">
          <button className="hidden md:flex items-center gap-2 text-[14px] text-[#71717a] hover:text-black dark:hover:text-white transition-colors mb-3">
            <Paperclip className="w-4 h-4" />
            Attach File
          </button>

          <div className="flex items-end gap-2 md:gap-3">
            <button className="md:hidden bg-[#f6f6f6] dark:bg-zinc-800 rounded-[8px] w-[44px] h-[44px] flex items-center justify-center shrink-0">
              <Paperclip className="w-4 h-4 text-[#71717a]" />
            </button>
            <div className="flex-1 bg-[#f6f6f6] dark:bg-zinc-800 rounded-[12px] px-3 md:px-4 py-2 md:py-3 min-h-[44px] md:min-h-[48px]">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply here..."
                className="w-full bg-transparent text-[14px] text-black dark:text-white outline-none resize-none placeholder:text-[#a1a1aa]"
                rows={1}
              />
            </div>
            <button className="bg-black rounded-[8px] w-[44px] h-[44px] md:w-[48px] md:h-[48px] flex items-center justify-center hover:bg-[#333] transition-colors shrink-0">
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
