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

// ============ API Functions ============

export async function getLiveIssues(): Promise<LiveIssuesResponse> {
  await sleep(500)
  return {
    items: mockLiveIssues,
    total: mockLiveIssues.length,
  }
}
