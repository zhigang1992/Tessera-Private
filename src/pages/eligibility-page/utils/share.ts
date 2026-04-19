export type SocialCardTokenId = 'T-SpaceX' | 'T-Kalshi'

export function isSocialCardTokenId(value: string | null | undefined): value is SocialCardTokenId {
  return value === 'T-SpaceX' || value === 'T-Kalshi'
}

export function getSocialCardShareLink(wallet: string, tokenId: SocialCardTokenId): string {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams({ wallet, tokenId })
  return `${window.location.origin}/sc?${params.toString()}`
}

export function getSocialCardImageUrl(wallet: string, tokenId: SocialCardTokenId): string {
  const params = new URLSearchParams({ wallet, tokenId })
  return `/api/social/card?${params.toString()}`
}

export function shareSocialCardOnTwitter(
  wallet: string,
  tokenId: SocialCardTokenId,
  tokenName: string,
): void {
  const shareLink = getSocialCardShareLink(wallet, tokenId)
  if (!shareLink) return
  const text = `I'm in on ${tokenName} via @Tessera_PE — private equity for everyone, on-chain, no KYC.`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`
  window.open(twitterUrl, '_blank', 'noopener,noreferrer')
}
