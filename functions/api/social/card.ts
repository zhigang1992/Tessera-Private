import type { D1Database, KVNamespace, PagesFunction, R2Bucket } from '@cloudflare/workers-types'

import { parseWalletAddress } from '../../lib/wallet-link'
import {
  getSocialCardStats,
  isSocialCardTokenId,
  type SocialCardStats,
  type SocialCardTokenId,
} from '../../lib/social-card-stats'

type Env = {
  DB: D1Database
  SESSION_KV: KVNamespace
  REFERRAL_IMAGES: R2Bucket
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_API_TOKEN: string
  APP_ENV?: string
}

interface BrowserRenderingResponse {
  success: boolean
  result: { screenshot: string }
  errors?: Array<{ message: string }>
}

const CARD_WIDTH = 932
const CARD_HEIGHT = 1248
const BACKGROUND_URL = 'https://r2.tessera.fun/social_card_bg.png'
const LOGO_URL = 'https://r2.tessera.fun/TerreraLogo.png'

function generateSocialCardHTML(
  tokenId: SocialCardTokenId,
  stats: SocialCardStats,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Tessera ${tokenId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${CARD_WIDTH}px;
    height: ${CARD_HEIGHT}px;
    position: relative;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    overflow: hidden;
    color: #ffffff;
  }
  .bg {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    z-index: 0;
  }
  .top-bar {
    position: absolute;
    left: 48px; right: 48px; top: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 2;
  }
  .logo {
    height: 52px;
    width: auto;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6));
  }
  .token-badge {
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 999px;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.08em;
    backdrop-filter: blur(8px);
    text-transform: uppercase;
  }
  .bottom-scrim {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 52%;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0.55) 55%,
      rgba(0, 0, 0, 0.85) 100%
    );
    z-index: 1;
  }
  .stats {
    position: absolute;
    left: 48px; right: 48px;
    bottom: 72px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 24px;
    z-index: 2;
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .stat-label {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    opacity: 0.72;
  }
  .stat-value {
    font-size: 56px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .stat-value.gain-positive { color: #3ddc84; }
  .stat-value.gain-negative { color: #ff5c5c; }
  .footer {
    position: absolute;
    left: 48px; right: 48px; bottom: 32px;
    font-size: 18px;
    font-weight: 500;
    opacity: 0.65;
    letter-spacing: 0.04em;
    z-index: 2;
  }
</style>
</head>
<body>
  <img src="${escapeHtml(BACKGROUND_URL)}" alt="" class="bg">
  <div class="bottom-scrim"></div>

  <div class="top-bar">
    <img src="${escapeHtml(LOGO_URL)}" alt="Tessera" class="logo">
    <div class="token-badge">${escapeHtml(tokenId)}</div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-label">Entry</div>
      <div class="stat-value">${escapeHtml(stats.entry)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Gain</div>
      <div class="stat-value ${gainClass(stats.gain)}">${escapeHtml(stats.gain)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Held</div>
      <div class="stat-value">${escapeHtml(stats.held)}</div>
    </div>
  </div>

  <div class="footer">tessera.fun — private equity, on-chain, no KYC</div>
</body>
</html>`
}

function gainClass(gain: string): string {
  if (gain.startsWith('+')) return 'gain-positive'
  if (gain.startsWith('-')) return 'gain-negative'
  return ''
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const walletParam = url.searchParams.get('wallet')
  const tokenIdParam = url.searchParams.get('tokenId')
  const refresh = url.searchParams.get('refresh') === '1'

  let wallet: string
  try {
    wallet = parseWalletAddress(walletParam).address
  } catch (err) {
    return Response.json({ error: 'Invalid wallet', detail: (err as Error).message }, { status: 400 })
  }

  if (!tokenIdParam || !isSocialCardTokenId(tokenIdParam)) {
    return Response.json({ error: 'Invalid or missing tokenId' }, { status: 400 })
  }
  const tokenId: SocialCardTokenId = tokenIdParam

  const cacheKey = `social-card-${wallet}-${tokenId}.png`

  if (!refresh) {
    const existing = await env.REFERRAL_IMAGES.get(cacheKey)
    if (existing) {
      return new Response(existing.body, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
        },
      })
    }
  }

  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
    console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN')
    return Response.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const stats = await getSocialCardStats(env, wallet, tokenId)
  const html = generateSocialCardHTML(tokenId, stats)

  const renderUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/snapshot`

  const renderResponse = await fetch(renderUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html,
      viewport: { width: CARD_WIDTH, height: CARD_HEIGHT },
      screenshotOptions: { fullPage: false, type: 'png' },
      gotoOptions: { waitUntil: 'load', timeout: 15000 },
    }),
  })

  if (!renderResponse.ok) {
    const errorText = await renderResponse.text()
    console.error('Browser Rendering API error:', errorText)
    return Response.json({ error: 'Failed to generate image', details: errorText }, { status: 502 })
  }

  const renderData = (await renderResponse.json()) as BrowserRenderingResponse
  if (!renderData.success || !renderData.result?.screenshot) {
    console.error('Browser Rendering returned unsuccessful response:', renderData)
    return Response.json({ error: 'Failed to generate screenshot', details: renderData.errors }, { status: 502 })
  }

  const buffer = Uint8Array.from(atob(renderData.result.screenshot), (c) => c.charCodeAt(0))

  await env.REFERRAL_IMAGES.put(cacheKey, buffer, {
    httpMetadata: { contentType: 'image/png' },
  })

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
