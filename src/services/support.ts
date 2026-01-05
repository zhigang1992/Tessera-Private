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

export interface ChatMessage {
  id: string
  type: MessageType
  content: string
  timestamp: string
  sender: string
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

// Simulated AI responses based on keywords
const aiResponses: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ['spacex', 'trade spacex', 'how to trade'],
    response:
      'To trade SpaceX tokens on Tessera:\n\n1. Connect your Solana wallet (Phantom, Solflare, etc.)\n2. Navigate to the Trade page\n3. Select T-SPACEX from the token list\n4. Enter the amount you want to buy or sell\n5. Confirm the transaction in your wallet\n\nSpaceX tokens are available 24/7 with instant settlement!',
  },
  {
    keywords: ['kyc', 'verification', 'identity'],
    response:
      'No, Tessera does not require KYC (Know Your Customer) verification. Our platform is built on permissionless infrastructure, allowing anyone with a Web3 wallet to trade instantly without identity verification or accreditation requirements.',
  },
  {
    keywords: ['fee', 'gas', 'cost'],
    response:
      'Tessera fees are minimal:\n\n• Trading fee: 0.3% per swap\n• Gas costs: ~0.00001 SOL per transaction (Solana network fees)\n\nThere are no deposit or withdrawal fees. All fees are transparently shown before you confirm any transaction.',
  },
  {
    keywords: ['wallet', 'connect', 'phantom', 'solflare'],
    response:
      'We support all major Solana wallets:\n\n• Phantom\n• Solflare\n• Backpack\n• Any wallet supporting Solana connection protocols\n\nTo connect, click the "Connect Wallet" button in the top right corner and select your wallet provider.',
  },
  {
    keywords: ['technical', 'support', 'help'],
    response:
      "I'm here to help with technical issues! Please describe your problem in detail, including:\n\n• What action you were trying to perform\n• Any error messages you saw\n• Your wallet type\n\nI'll do my best to assist you or connect you with a human support agent if needed.",
  },
]

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

function findAiResponse(content: string): string {
  const lowerContent = content.toLowerCase()

  for (const item of aiResponses) {
    if (item.keywords.some((keyword) => lowerContent.includes(keyword))) {
      return item.response
    }
  }

  // Default response
  return "Thanks for your message! I'm processing your request. Our AI is analyzing your question to provide the most helpful response. If you need immediate assistance, please join our Discord community or try one of the quick questions above."
}

// ============ API Functions ============

export async function getLiveIssues(): Promise<LiveIssuesResponse> {
  await sleep(500)
  return {
    items: mockLiveIssues,
    total: mockLiveIssues.length,
  }
}

export async function getChatMessages(
  issueId?: string
): Promise<ChatMessagesResponse> {
  await sleep(300)

  if (issueId && mockChatHistory[issueId]) {
    return {
      messages: mockChatHistory[issueId],
      issueId,
    }
  }

  return {
    messages: [],
    issueId,
  }
}

export async function sendMessage(
  content: string,
  _issueId?: string
): Promise<SendMessageResponse> {
  await sleep(800)

  const timestamp = formatTimestamp()

  const userMessage: ChatMessage = {
    id: generateMessageId(),
    type: 'user',
    content,
    timestamp,
    sender: 'You',
  }

  // Simulate AI thinking delay
  await sleep(1000)

  const replyMessage: ChatMessage = {
    id: generateMessageId(),
    type: 'system',
    content: findAiResponse(content),
    timestamp: formatTimestamp(),
    sender: 'Tessera AI',
  }

  return {
    userMessage,
    replyMessage,
  }
}
