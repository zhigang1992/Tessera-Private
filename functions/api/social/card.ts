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

const CARD_WIDTH = 1361
const CARD_HEIGHT = 766

function bgUrl(variant: 'a' | 'b' | 'c'): string {
  return `https://r2.tessera.fun/horizontal_card_${variant}.png`
}

// Overlay positions are in 1361×766 card space. Title, "AT", Tessera logo,
// and the ENTRY/GAIN/HELD labels are all baked into the bg image — we only
// paint the dynamic bits on top.
function generateSocialCardHTML(stats: SocialCardStats): string {
  const gainColor = stats.gain.startsWith('+')
    ? '#AAD36D'
    : stats.gain.startsWith('-')
      ? '#ff5c5c'
      : '#ffffff'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Tessera share card</title>
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
    /* bg files differ by a few px; stretch so the baked-in text lands at
       the same 1361×766 coords across every variant. */
    object-fit: fill;
    z-index: 0;
  }
  .valuation {
    position: absolute;
    left: 164px; top: 320px;
    font-size: 64px; font-weight: 600; line-height: 1;
    letter-spacing: -0.02em;
    color: #AAD36D;
    z-index: 2;
  }
  .handle {
    position: absolute;
    left: 56px; top: 458px;
    font-size: 48px; font-weight: 500; line-height: 1;
    letter-spacing: -0.01em;
    color: #ffffff;
    z-index: 2;
  }
  .stats {
    position: absolute;
    left: 60px; top: 615px; width: 584px;
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    z-index: 2;
  }
  .stat-value {
    text-align: center;
    font-size: 44px; font-weight: 800; line-height: 1;
    letter-spacing: -0.02em;
    color: #ffffff;
  }
</style>
</head>
<body>
  <img src="${escapeHtml(bgUrl(stats.variant))}" alt="" class="bg">
  <div class="valuation">${escapeHtml(stats.valuation)}</div>
  <div class="handle">${escapeHtml(stats.handle)}</div>
  <div class="stats">
    <div class="stat-value">${escapeHtml(stats.entry)}</div>
    <div class="stat-value" style="color:${gainColor}">${escapeHtml(stats.gain)}</div>
    <div class="stat-value">${escapeHtml(stats.held)}</div>
  </div>
</body>
</html>`
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
  const html = generateSocialCardHTML(stats)

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
