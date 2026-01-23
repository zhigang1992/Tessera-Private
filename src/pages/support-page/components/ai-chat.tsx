import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Paperclip, Send, Bot, User, Loader2, X } from 'lucide-react'
import Markdown from 'react-markdown'
import {
  type LiveIssue,
  type ChatMessage,
  type ChatAttachment,
  getChatMessages,
  sendMessageStream,
} from '@/services'

interface AiChatProps {
  issue?: LiveIssue
  initialQuery?: string
  onBack: () => void
}

function formatTimestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function AiChat({ issue, initialQuery, onBack }: AiChatProps) {
  const [replyText, setReplyText] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>(
    []
  )
  const [isWaitingForReply, setIsWaitingForReply] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasInitialQuerySentRef = useRef(false)

  // Fetch chat history for existing issues
  const { data: chatData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['chatMessages', issue?.id],
    queryFn: () => getChatMessages(issue?.id),
    enabled: !!issue?.id,
  })

  // Send message function with streaming
  const doSendMessage = async (content: string, attachments?: ChatAttachment[]) => {
    setIsWaitingForReply(true)
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const data = await sendMessageStream(
        content,
        issue?.id,
        attachments,
        (chunk) => {
          setStreamingContent((prev) => prev + chunk)
        }
      )
      // After streaming completes, add the final message
      setMessages((prev) => [...prev, data.replyMessage])
    } finally {
      setIsWaitingForReply(false)
      setIsStreaming(false)
      setStreamingContent('')
    }
  }

  // Initialize messages from chat history
  useEffect(() => {
    if (chatData?.messages) {
      setMessages(chatData.messages)
    }
  }, [chatData])

  // Handle initial query (from search)
  useEffect(() => {
    if (initialQuery && !issue && !hasInitialQuerySentRef.current) {
      hasInitialQuerySentRef.current = true
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        type: 'user',
        content: initialQuery,
        timestamp: formatTimestamp(),
        sender: 'You',
      }
      setMessages((prev) => [...prev, userMessage])
      doSendMessage(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, issue])

  // Scroll to bottom when messages change or when streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isWaitingForReply, streamingContent])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const attachment: ChatAttachment = {
          id: generateMessageId(),
          name: file.name,
          type: file.type,
          url: event.target?.result as string,
          size: file.size,
        }
        setPendingAttachments((prev) => [...prev, attachment])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleSendMessage = () => {
    const hasContent = replyText.trim() || pendingAttachments.length > 0
    if (hasContent && !isWaitingForReply) {
      const content = replyText.trim()
      const attachments =
        pendingAttachments.length > 0 ? [...pendingAttachments] : undefined
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        type: 'user',
        content: content || (attachments ? '[Attachment]' : ''),
        timestamp: formatTimestamp(),
        sender: 'You',
        attachments,
      }
      setMessages((prev) => [...prev, userMessage])
      setReplyText('')
      setPendingAttachments([])
      // Then send to API for AI response
      doSendMessage(content, attachments)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed inset-0 top-[64px] lg:left-64 bg-[#f5f5f5] dark:bg-[#131314] flex flex-col z-10">
      {/* Back Button - Above header */}
      <div className="bg-[#f5f5f5] dark:bg-[#131314] px-4 md:px-6 pt-3 md:pt-4 shrink-0">
        <button
          className="flex items-center gap-2 text-[12px] md:text-[14px] text-[#71717a] hover:text-black dark:hover:text-white transition-colors"
          onClick={onBack}
        >
          <ChevronLeft className="w-3 h-3" />
          Back to Support Center
        </button>
      </div>

      {/* Header - Fixed at top */}
      <div className="bg-[#f5f5f5] dark:bg-[#131314] border-b border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] px-4 md:px-6 py-3 md:py-4 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {issue ? (
              <>
                <div className="flex items-center gap-2 mb-1 md:mb-2 flex-wrap">
                  <span className="text-[12px] md:text-[14px] text-[#71717a]">
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
                <h1 className="text-[18px] md:text-[24px] font-semibold mb-0 text-black dark:text-[#d2d2d2] truncate">
                  {issue.title}
                </h1>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1 md:mb-2">
                  <Bot className="w-5 h-5 text-[#71717a]" />
                  <span className="text-[12px] md:text-[14px] text-[#71717a]">
                    Tessera AI Agent
                  </span>
                </div>
                <h1 className="text-[18px] md:text-[24px] font-semibold mb-0 text-black dark:text-[#d2d2d2]">
                  AI Support Chat
                </h1>
              </>
            )}
          </div>
          {issue && (
            <span className="text-[11px] md:text-[12px] text-[#71717a] whitespace-nowrap ml-2">
              {issue.submittedTime}
            </span>
          )}
        </div>
      </div>

      {/* Chat Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-[800px] mx-auto flex flex-col gap-[16px] md:gap-[24px]">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#71717a] animate-spin" />
            </div>
          ) : messages.length === 0 && !isWaitingForReply ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bot className="w-12 h-12 text-[#a1a1aa] mb-3" />
              <p className="text-[14px] text-[#71717a] mb-1">
                Start a conversation
              </p>
              <p className="text-[12px] text-[#a1a1aa]">
                Ask me anything about Tessera
              </p>
            </div>
          ) : (
            <>
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
                        <div className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-full bg-[#e5e5e5] flex items-center justify-center shrink-0">
                          <Bot className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] text-[#71717a]" />
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
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {message.attachments.map((attachment) =>
                            attachment.type.startsWith('image/') ? (
                              <img
                                key={attachment.id}
                                src={attachment.url}
                                alt={attachment.name}
                                className="max-w-[200px] max-h-[150px] rounded-[8px] object-cover"
                              />
                            ) : (
                              <div
                                key={attachment.id}
                                className="bg-white/50 rounded-[8px] px-3 py-2 text-[12px] text-[#18181b]"
                              >
                                {attachment.name}
                              </div>
                            )
                          )}
                        </div>
                      )}
                      {message.content && message.content !== '[Attachment]' && (
                        <p className="text-[13px] leading-[20px] text-[#18181b] tracking-[-0.0762px] whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                  )}
                  {message.type === 'system' && (
                    <div className="bg-white dark:bg-zinc-800 rounded-tr-[16px] rounded-bl-[16px] rounded-br-[16px] px-[12px] md:px-[16px] py-[10px] md:py-[12px] max-w-[85%] md:max-w-[480px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-[20px] text-[#18181b] dark:text-zinc-300 tracking-[-0.0762px] [&_p]:my-1.5 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-semibold [&_a]:text-[#16a34a] [&_a]:no-underline [&_a:hover]:underline">
                        <Markdown>{message.content}</Markdown>
                      </div>
                    </div>
                  )}
                  {message.type === 'agent' && (
                    <div className="bg-[#18181b] rounded-tr-[16px] rounded-bl-[16px] rounded-br-[16px] px-[12px] md:px-[16px] py-[10px] md:py-[12px] max-w-[85%] md:max-w-[480px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                      <p className="text-[13px] leading-[20px] text-white tracking-[-0.0762px] whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming/Loading indicator when sending message */}
              {isWaitingForReply && (
                <div className="flex flex-col gap-[8px] items-start animate-in fade-in duration-300">
                  {/* Message Header */}
                  <div className="flex items-center gap-[8px]">
                    <div className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-full bg-[#e5e5e5] flex items-center justify-center shrink-0">
                      <Bot className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] text-[#71717a]" />
                    </div>
                    <span className="text-[12px] md:text-[13px] font-medium text-[#18181b] dark:text-white tracking-[0.0645px]">
                      Tessera AI
                    </span>
                    {isStreaming && streamingContent && (
                      <span className="text-[10px] text-[#d2fb95] bg-[#18181b] px-1.5 py-0.5 rounded-full">
                        typing...
                      </span>
                    )}
                  </div>
                  {/* Streaming Content */}
                  <div className="bg-white dark:bg-zinc-800 rounded-tr-[16px] rounded-bl-[16px] rounded-br-[16px] px-[12px] md:px-[16px] py-[10px] md:py-[12px] max-w-[85%] md:max-w-[480px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                    {isStreaming && streamingContent ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-[20px] text-[#18181b] dark:text-zinc-300 tracking-[-0.0762px] [&_p]:my-1.5 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-semibold [&_a]:text-[#16a34a] [&_a]:no-underline [&_a:hover]:underline">
                        <Markdown>{streamingContent}</Markdown>
                        <span className="inline-block w-[3px] h-[16px] bg-[#d2fb95] rounded-full animate-pulse ml-1 align-middle" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-[#d2fb95] rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2 h-2 bg-[#d2fb95] rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2 h-2 bg-[#d2fb95] rounded-full animate-bounce" />
                        </div>
                        <span className="text-[13px] text-[#71717a]">
                          Thinking...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="bg-white dark:bg-[#1E1F20] border-t border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] px-4 md:px-6 py-3 md:py-4 shrink-0">
        <div className="max-w-[800px] mx-auto">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Pending attachments preview */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {pendingAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative group bg-[#f6f6f6] dark:bg-zinc-800 rounded-[8px] overflow-hidden"
                >
                  {attachment.type.startsWith('image/') ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-[80px] h-[80px] object-cover"
                    />
                  ) : (
                    <div className="w-[80px] h-[80px] flex items-center justify-center">
                      <Paperclip className="w-6 h-6 text-[#71717a]" />
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                    <p className="text-[10px] text-white truncate">
                      {attachment.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAttachClick}
            className="hidden md:flex items-center gap-2 text-[14px] text-[#71717a] hover:text-black dark:hover:text-white transition-colors mb-3"
          >
            <Paperclip className="w-4 h-4" />
            Attach File
          </button>

          <div className="flex items-end gap-2 md:gap-3">
            <button
              onClick={handleAttachClick}
              className="md:hidden bg-[#f6f6f6] dark:bg-zinc-800 rounded-[8px] w-[44px] h-[44px] flex items-center justify-center shrink-0 hover:bg-[#ececec] dark:hover:bg-zinc-700 transition-colors"
            >
              <Paperclip className="w-4 h-4 text-[#71717a]" />
            </button>
            <div className="flex-1 bg-[#e5e5e5] dark:bg-[#3f3f46] rounded-[12px] px-3 md:px-4 min-h-[44px] md:min-h-[48px] flex items-center">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your reply here..."
                className="w-full bg-transparent text-[14px] text-black dark:text-[#d2d2d2] outline-none resize-none placeholder:text-[#a1a1aa]"
                rows={1}
                disabled={isWaitingForReply}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={
                (!replyText.trim() && pendingAttachments.length === 0) ||
                isWaitingForReply
              }
              className="bg-black dark:bg-white rounded-[8px] w-[44px] h-[44px] md:w-[48px] md:h-[48px] flex items-center justify-center hover:bg-[#333] dark:hover:bg-[#e5e5e5] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWaitingForReply ? (
                <Loader2 className="w-5 h-5 text-white dark:text-black animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white dark:text-black" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
