export type TradingVolumeResponse = {
  volumeUsd: number
  linkedWalletCount: number
  wallets: string[]
}

export type SocialPostResponse = {
  hasPosted: boolean
  tweetUrl: string | null
}

export async function fetchTradingVolume(wallet: string): Promise<TradingVolumeResponse> {
  const res = await fetch(`/api/eligibility/trading-volume?wallet=${encodeURIComponent(wallet)}`)
  if (!res.ok) {
    throw new Error(`trading-volume request failed: ${res.status}`)
  }
  return (await res.json()) as TradingVolumeResponse
}

export async function fetchSocialPost(handle: string): Promise<SocialPostResponse> {
  const res = await fetch(`/api/eligibility/social-post?handle=${encodeURIComponent(handle)}`)
  if (!res.ok) {
    throw new Error(`social-post request failed: ${res.status}`)
  }
  return (await res.json()) as SocialPostResponse
}
