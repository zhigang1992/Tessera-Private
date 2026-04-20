import { buildSocialCardShareText, isSocialCardTokenId, type SocialCardTokenId } from '@/lib/social-card'

export { isSocialCardTokenId, type SocialCardTokenId }

export function getSocialCardShareLink(wallet: string, tokenId: SocialCardTokenId): string {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams({ wallet, tokenId })
  return `${window.location.origin}/sc?${params.toString()}`
}

export function getSocialCardImageUrl(wallet: string, tokenId: SocialCardTokenId): string {
  const params = new URLSearchParams({ wallet, tokenId })
  return `/api/social/card?${params.toString()}`
}

export function shareSocialCardOnTwitter(wallet: string, tokenId: SocialCardTokenId, tokenName: string): void {
  const shareLink = getSocialCardShareLink(wallet, tokenId)
  if (!shareLink) return
  const text = buildSocialCardShareText(tokenName)
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`
  window.open(twitterUrl, '_blank', 'noopener,noreferrer')
}
