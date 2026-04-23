import { apiClient } from '@/features/referral/lib/api-client'

export const PRESALE_SNAPSHOT_DATE = '2026-04-27'
export const LIFETIME_VOLUME_THRESHOLD_USD = 5000
export const SNAPSHOT_VOLUME_THRESHOLD_USD = 1000

export type TradingVolumeResponse = {
  volumeUsd: number
  linkedWalletCount: number
  wallets: string[]
  mockedWalletCount?: number
}

export type SnapshotVolumeResponse = {
  volumeUsd: number
  snapshotDate: string
  linkedWalletCount?: number
  mockedWalletCount?: number
}

export type SolanaMobileStatus = 'met' | 'unmet'

export type SocialPostResponse = {
  hasPosted: boolean
  tweetId: string | null
  tweetUrl: string | null
}

export class SocialPostError extends Error {
  code: string
  status: number
  retryAfterSeconds?: number
  constructor(code: string, status: number, message: string, retryAfterSeconds?: number) {
    super(message)
    this.name = 'SocialPostError'
    this.code = code
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export async function fetchTradingVolume(wallet: string): Promise<TradingVolumeResponse> {
  const res = await fetch(`/api/eligibility/trading-volume?wallet=${encodeURIComponent(wallet)}`)
  if (!res.ok) throw new Error(`trading-volume request failed: ${res.status}`)
  return (await res.json()) as TradingVolumeResponse
}

export async function fetchSnapshotVolume(wallet: string): Promise<SnapshotVolumeResponse> {
  const res = await fetch(`/api/eligibility/snapshot-volume?wallet=${encodeURIComponent(wallet)}`)
  if (!res.ok) throw new Error(`snapshot-volume request failed: ${res.status}`)
  const data = (await res.json()) as {
    volumeUsd: number
    linkedWalletCount?: number
    mockedWalletCount?: number
  }
  return {
    volumeUsd: data.volumeUsd,
    snapshotDate: PRESALE_SNAPSHOT_DATE,
    linkedWalletCount: data.linkedWalletCount,
    mockedWalletCount: data.mockedWalletCount,
  }
}

export async function fetchSolanaMobileEligibility(wallet: string): Promise<SolanaMobileStatus> {
  const res = await fetch(`/api/eligibility/solana-mobile?wallet=${encodeURIComponent(wallet)}`)
  if (!res.ok) throw new Error(`solana-mobile request failed: ${res.status}`)
  const data = (await res.json()) as { status: SolanaMobileStatus }
  return data.status
}

export type QualifiedVia =
  | 'snapshot_volume'
  | 'solana_mobile'
  | 'volume_twitter'
  | 'admin_manual'
  | 'admin_csv'

export type WhitelistApplication = {
  qualified: boolean
  walletAddress?: string
  qualifiedVia?: QualifiedVia
  tradingVolumeUsd?: number | null
  snapshotVolumeUsd?: number | null
  solanaMobileEligible?: boolean | null
  twitterHandle?: string | null
  twitterConnected?: boolean
  socialPostFound?: boolean
  socialPostTweetUrl?: string | null
  presale1Selected: boolean
  adminNote?: string | null
  qualifiedAt?: string
  selectedAt?: string | null
}

export async function fetchWhitelistApplication(wallet: string): Promise<WhitelistApplication> {
  const res = await fetch(`/api/whitelist/applications?wallet=${encodeURIComponent(wallet)}`)
  if (!res.ok) throw new Error(`whitelist application request failed: ${res.status}`)
  return (await res.json()) as WhitelistApplication
}

export class WhitelistAutoWriteError extends Error {
  code: string
  status: number
  constructor(code: string, status: number, message: string) {
    super(message)
    this.name = 'WhitelistAutoWriteError'
    this.code = code
    this.status = status
  }
}

export type WhitelistAutoWriteResult =
  | { kind: 'qualified'; application: WhitelistApplication }
  | {
      kind: 'not_eligible'
      details?: {
        tradingVolumeUsd?: number | null
        snapshotVolumeUsd?: number | null
        solanaMobileEligible?: boolean | null
        twitterConnected?: boolean
      }
    }

/**
 * Called immediately after the user clicks "Check Eligibility" and the client
 * has run the three checks. The server re-runs the checks and upserts the
 * application row if any option passes. Passing `tokenId` lets the server
 * also refresh social-card state on the same row without a separate call.
 */
export async function qualifyWhitelist(tokenId: string | null): Promise<WhitelistAutoWriteResult> {
  const sessionToken = apiClient.getToken()
  if (!sessionToken) {
    throw new WhitelistAutoWriteError('not_signed_in', 401, 'Sign in with your wallet first.')
  }
  const res = await fetch('/api/whitelist/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify(tokenId ? { tokenId } : {}),
  })
  const data = (await res.json().catch(() => ({}))) as WhitelistApplication & {
    error?: string
    detail?: string
    reason?: string
    details?: WhitelistAutoWriteResult extends { kind: 'not_eligible'; details: infer D } ? D : never
  }
  if (!res.ok) {
    throw new WhitelistAutoWriteError(
      data.error ?? `http_${res.status}`,
      res.status,
      data.detail ?? data.error ?? `Check failed (${res.status})`,
    )
  }
  if (data.qualified === false) {
    return { kind: 'not_eligible', details: data.details }
  }
  return { kind: 'qualified', application: data as WhitelistApplication }
}

export async function fetchSocialPost(tokenId: string): Promise<SocialPostResponse> {
  const sessionToken = apiClient.getToken()
  if (!sessionToken) {
    throw new SocialPostError('not_signed_in', 401, 'Sign in with your wallet first.')
  }
  const res = await fetch(`/api/eligibility/social-post?tokenId=${encodeURIComponent(tokenId)}`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  })
  const data = (await res.json().catch(() => ({}))) as {
    hasPosted?: boolean
    tweetId?: string | null
    tweetUrl?: string | null
    error?: string
    retryAfterSeconds?: number
  }
  if (!res.ok) {
    const code = data.error ?? `http_${res.status}`
    const message =
      code === 'twitter_not_verified'
        ? 'Verify Twitter ownership in Settings first.'
        : code === 'twitter_api_not_configured'
          ? 'Twitter lookup is temporarily unavailable.'
          : code === 'twitter_api_error'
            ? 'Twitter lookup failed. Try again later.'
            : code === 'rate_limited'
              ? `Checked too recently. Try again in ${data.retryAfterSeconds ?? 30}s.`
              : code === 'invalid_token_id'
                ? 'This auction does not support a social card check.'
                : `Check failed (${res.status})`
    throw new SocialPostError(code, res.status, message, data.retryAfterSeconds)
  }
  return {
    hasPosted: !!data.hasPosted,
    tweetId: data.tweetId ?? null,
    tweetUrl: data.tweetUrl ?? null,
  }
}
