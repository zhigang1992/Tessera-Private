const SHARE_IMAGE_BASE = import.meta.env.VITE_REFERRAL_SHARE_IMAGE_BASE || '/api/referral/image'

export function getShareLink(codeSlug: string, background = 1): string {
  if (typeof window === 'undefined') {
    return ''
  }
  return `${window.location.origin}/s?code=${codeSlug}&bg=${background}`
}

export function getShareImageUrl(codeSlug: string, background = 1): string {
  const base = SHARE_IMAGE_BASE.endsWith('/') ? SHARE_IMAGE_BASE.slice(0, -1) : SHARE_IMAGE_BASE
  return `${base}?code=${encodeURIComponent(codeSlug)}&bg=${background}`
}

export function shareOnTwitter(codeSlug: string, background = 1): void {
  const shareLink = getShareLink(codeSlug, background)
  if (!shareLink) {
    return
  }
  const text = `Join me on owning a piece of the future, before everyone else; on-chain without KYC via @Tessera_PE`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`
  window.open(twitterUrl, '_blank', 'noopener,noreferrer')
}

export function shareOnTelegram(codeSlug: string, background = 1): void {
  const shareLink = getShareLink(codeSlug, background)
  if (!shareLink) {
    return
  }
  const text = `Own a piece of the future, before everyone else; on-chain without KYC`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`
  window.open(telegramUrl, '_blank', 'noopener,noreferrer')
}

export async function downloadShareImage(codeSlug: string, background = 1): Promise<boolean> {
  const shareImageUrl = getShareImageUrl(codeSlug, background)

  try {
    const response = await fetch(shareImageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${codeSlug}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  } catch (error) {
    console.error('Failed to download share image', error)
    return false
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard', error)
    return false
  }
}
