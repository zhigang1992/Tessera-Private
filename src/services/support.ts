import {
  sendToOpenAI,
  streamFromOpenAI,
  type ChatHistory,
} from './chat/openai'
import { sleep } from './utils'

// ============ Types ============

export type IssueStatus = 'checking' | 'complete'

export interface LiveIssue {
  id: string
  title: string
  status: IssueStatus
  submittedTime: string
}

export interface LiveIssuesResponse {
  items: LiveIssue[]
  total: number
}

export type MessageType = 'user' | 'system' | 'agent'

export interface ChatAttachment {
  id: string
  name: string
  type: string // MIME type
  url: string // data URL or blob URL
  size: number
}

export interface ChatMessage {
  id: string
  type: MessageType
  content: string
  timestamp: string
  sender: string
  attachments?: ChatAttachment[]
}

export interface ChatMessagesResponse {
  messages: ChatMessage[]
  issueId?: string
}

export interface SendMessageResponse {
  userMessage: ChatMessage
  replyMessage: ChatMessage
}

// ============ Mock Data ============

const mockLiveIssues: LiveIssue[] = [
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

// Mock chat history for existing issues
const mockChatHistory: Record<string, ChatMessage[]> = {
  '2941': [
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
  ],
  '2880': [
    {
      id: '1',
      type: 'user',
      content: 'My bridge transaction has been pending for over an hour.',
      timestamp: '9:15 AM',
      sender: 'You',
    },
    {
      id: '2',
      type: 'system',
      content: 'We are investigating your bridge transaction.',
      timestamp: '9:16 AM',
      sender: 'System',
    },
    {
      id: '3',
      type: 'agent',
      content:
        'Your transaction has been successfully processed. The funds should now appear in your wallet.',
      timestamp: '9:45 AM',
      sender: 'Support Agent',
    },
  ],
}

// Store chat history for OpenAI context
const chatHistoryStore: Map<string, ChatHistory> = new Map()

// ============ Helper Functions ============

function formatTimestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function getSessionId(issueId?: string): string {
  return issueId || 'default-session'
}

function generateIssueId(): string {
  return `issue-${Date.now()}`
}

// ============ LocalStorage Functions ============

const STORAGE_KEY = 'tessera_live_issues'
const MESSAGES_STORAGE_PREFIX = 'tessera_messages_'

function getLiveIssuesFromStorage(): LiveIssue[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error reading live issues from localStorage:', error)
    return []
  }
}

function saveLiveIssuesToStorage(issues: LiveIssue[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues))
  } catch (error) {
    console.error('Error saving live issues to localStorage:', error)
  }
}

function getMessagesFromStorage(issueId: string): ChatMessage[] {
  try {
    const stored = localStorage.getItem(`${MESSAGES_STORAGE_PREFIX}${issueId}`)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error reading messages from localStorage:', error)
    return []
  }
}

function saveMessagesToStorage(issueId: string, messages: ChatMessage[]): void {
  try {
    localStorage.setItem(`${MESSAGES_STORAGE_PREFIX}${issueId}`, JSON.stringify(messages))
  } catch (error) {
    console.error('Error saving messages to localStorage:', error)
  }
}

function deleteMessagesFromStorage(issueId: string): void {
  try {
    localStorage.removeItem(`${MESSAGES_STORAGE_PREFIX}${issueId}`)
  } catch (error) {
    console.error('Error deleting messages from localStorage:', error)
  }
}

export function createNewConversation(title: string): LiveIssue {
  const newIssue: LiveIssue = {
    id: generateIssueId(),
    title,
    status: 'checking',
    submittedTime: 'just now',
  }

  const issues = getLiveIssuesFromStorage()
  issues.unshift(newIssue) // Add to beginning
  saveLiveIssuesToStorage(issues)

  return newIssue
}

export function closeConversation(issueId: string): void {
  const issues = getLiveIssuesFromStorage()
  const filteredIssues = issues.filter((issue) => issue.id !== issueId)
  saveLiveIssuesToStorage(filteredIssues)
  deleteMessagesFromStorage(issueId)
}

// ============ API Functions ============

export async function getLiveIssues(): Promise<LiveIssuesResponse> {
  await sleep(500)
  const items = getLiveIssuesFromStorage()
  return {
    items,
    total: items.length,
  }
}

export async function getChatMessages(
  issueId?: string
): Promise<ChatMessagesResponse> {
  await sleep(300)

  if (issueId) {
    // First check localStorage for saved messages
    const savedMessages = getMessagesFromStorage(issueId)
    if (savedMessages.length > 0) {
      return {
        messages: savedMessages,
        issueId,
      }
    }

    // Fall back to mock data if available
    if (mockChatHistory[issueId]) {
      return {
        messages: mockChatHistory[issueId],
        issueId,
      }
    }
  }

  return {
    messages: [],
    issueId,
  }
}

export async function sendMessage(
  content: string,
  issueId?: string,
  attachments?: ChatAttachment[]
): Promise<SendMessageResponse> {
  const timestamp = formatTimestamp()
  const sessionId = getSessionId(issueId)

  const userMessage: ChatMessage = {
    id: generateMessageId(),
    type: 'user',
    content,
    timestamp,
    sender: 'You',
    attachments,
  }

  // Get or initialize chat history for this session
  const history = chatHistoryStore.get(sessionId) || []

  // Prepare message content (include attachment info if present)
  let messageContent = content
  if (attachments && attachments.length > 0) {
    const attachmentInfo = attachments
      .map((a) => `[Attached: ${a.name}]`)
      .join(' ')
    messageContent = `${content}\n\n${attachmentInfo}`
  }

  let responseContent: string

  try {
    // Call OpenAI API
    responseContent = await sendToOpenAI(messageContent, history)

    // Update chat history
    history.push({ role: 'user', content: messageContent })
    history.push({ role: 'assistant', content: responseContent })
    chatHistoryStore.set(sessionId, history)
  } catch (error) {
    console.error('OpenAI API error:', error)
    responseContent =
      "I'm sorry, I encountered an error while processing your request. Please try again later or contact our support team via Discord or Telegram."
  }

  const replyMessage: ChatMessage = {
    id: generateMessageId(),
    type: 'system',
    content: responseContent,
    timestamp: formatTimestamp(),
    sender: 'Tessera AI',
  }

  // Save messages to localStorage if we have an issueId
  if (issueId) {
    const existingMessages = getMessagesFromStorage(issueId)
    const updatedMessages = [...existingMessages, userMessage, replyMessage]
    saveMessagesToStorage(issueId, updatedMessages)
  }

  return {
    userMessage,
    replyMessage,
  }
}

// Streaming version of sendMessage
export async function sendMessageStream(
  content: string,
  issueId?: string,
  attachments?: ChatAttachment[],
  onChunk?: (chunk: string) => void
): Promise<SendMessageResponse> {
  const timestamp = formatTimestamp()
  const sessionId = getSessionId(issueId)

  const userMessage: ChatMessage = {
    id: generateMessageId(),
    type: 'user',
    content,
    timestamp,
    sender: 'You',
    attachments,
  }

  // Get or initialize chat history for this session
  const history = chatHistoryStore.get(sessionId) || []

  // Prepare message content (include attachment info if present)
  let messageContent = content
  if (attachments && attachments.length > 0) {
    const attachmentInfo = attachments
      .map((a) => `[Attached: ${a.name}]`)
      .join(' ')
    messageContent = `${content}\n\n${attachmentInfo}`
  }

  let responseContent: string

  try {
    // Call OpenAI API with streaming
    responseContent = await streamFromOpenAI(
      messageContent,
      history,
      onChunk || (() => {})
    )

    // Update chat history
    history.push({ role: 'user', content: messageContent })
    history.push({ role: 'assistant', content: responseContent })
    chatHistoryStore.set(sessionId, history)
  } catch (error) {
    console.error('OpenAI API error:', error)
    responseContent =
      "I'm sorry, I encountered an error while processing your request. Please try again later or contact our support team via Discord or Telegram."
  }

  const replyMessage: ChatMessage = {
    id: generateMessageId(),
    type: 'system',
    content: responseContent,
    timestamp: formatTimestamp(),
    sender: 'Tessera AI',
  }

  // Save messages to localStorage if we have an issueId
  if (issueId) {
    const existingMessages = getMessagesFromStorage(issueId)
    const updatedMessages = [...existingMessages, userMessage, replyMessage]
    saveMessagesToStorage(issueId, updatedMessages)
  }

  return {
    userMessage,
    replyMessage,
  }
}
