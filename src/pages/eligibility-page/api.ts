import { apiClient } from '@/features/referral/lib/api-client'

export type TradingVolumeResponse = {
  volumeUsd: number
  linkedWalletCount: number
  wallets: string[]
}

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
  if (!res.ok) {
    throw new Error(`trading-volume request failed: ${res.status}`)
  }
  return (await res.json()) as TradingVolumeResponse
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
