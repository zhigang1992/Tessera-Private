import { buildSocialCardShareText, isSocialCardTokenId, type SocialCardTokenId } from '@/lib/social-card'

export { isSocialCardTokenId, type SocialCardTokenId }

function normalizeTwitterHandle(twitterHandle?: string | null): string | null {
  if (!twitterHandle) return null
  const cleaned = twitterHandle.trim().replace(/^@+/, '')
  return cleaned || null
}

function getFunctionsOrigin(): string {
  if (typeof window === 'undefined') return ''
  const apiPort = import.meta.env.VITE_API_PORT?.trim()
  if (!apiPort) return window.location.origin

  try {
    const url = new URL(window.location.origin)
    url.port = apiPort
    return url.origin
  } catch {
    return window.location.origin
  }
}

function openTwitterIntent(text: string, shareLink: string): void {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`
  window.open(twitterUrl, '_blank', 'noopener,noreferrer')
}

export function getSocialCardShareLink(wallet: string, twitterHandle?: string | null): string {
  const baseOrigin = getFunctionsOrigin()
  if (!baseOrigin) return ''
  const params = new URLSearchParams({ wallet })
  const handle = normalizeTwitterHandle(twitterHandle)
  if (handle) {
    params.set('handle', handle)
  }
  return `${baseOrigin}/sc?${params.toString()}`
}

export function getSocialCardImageUrl(wallet: string, twitterHandle?: string | null): string {
  const baseOrigin = getFunctionsOrigin()
  if (!baseOrigin) return ''
  const params = new URLSearchParams({ wallet })
  const handle = normalizeTwitterHandle(twitterHandle)
  if (handle) {
    params.set('handle', handle)
  }
  return `${baseOrigin}/api/social/card?${params.toString()}`
}

export function shareSocialCardOnTwitter(
  wallet: string,
  tokenName: string,
  twitterHandle?: string | null,
): void {
  const shareLink = getSocialCardShareLink(wallet, twitterHandle)
  if (!shareLink) return
  const text = buildSocialCardShareText(tokenName)
  openTwitterIntent(text, shareLink)
}

export function getApprovedEligibilityShareLink(twitterHandle?: string | null): string {
  const baseOrigin = getFunctionsOrigin()
  if (!baseOrigin) return ''
  const params = new URLSearchParams()
  const handle = normalizeTwitterHandle(twitterHandle)
  if (handle) {
    params.set('handle', handle)
  }
  const query = params.toString()
  return `${baseOrigin}/approved${query ? `?${query}` : ''}`
}

export function buildApprovedEligibilityShareText(
  tokenName: string,
  twitterHandle?: string | null,
): string {
  const handle = normalizeTwitterHandle(twitterHandle)
  const handleSuffix = handle ? ` as @${handle}` : ''
  return `I just passed Tessera Pre-Sale 2 eligibility for ${tokenName}${handleSuffix}. @Tessera_PE`
}

export function buildApprovedEligibilityPostContent(
  tokenName: string,
  twitterHandle?: string | null,
): string {
  const text = buildApprovedEligibilityShareText(tokenName, twitterHandle)
  const shareLink = getApprovedEligibilityShareLink(twitterHandle)
  return shareLink ? `${text} ${shareLink}` : text
}

export function shareApprovedEligibilityOnTwitter(
  tokenName: string,
  twitterHandle?: string | null,
): void {
  const shareLink = getApprovedEligibilityShareLink(twitterHandle)
  if (!shareLink) return
  const text = buildApprovedEligibilityShareText(tokenName, twitterHandle)
  openTwitterIntent(text, shareLink)
}
