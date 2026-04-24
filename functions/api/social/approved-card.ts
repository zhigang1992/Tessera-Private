import type { PagesFunction, R2Bucket } from '@cloudflare/workers-types'

type Env = {
  REFERRAL_IMAGES: R2Bucket
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_API_TOKEN: string
}

interface BrowserRenderingResponse {
  success: boolean
  result: { screenshot: string }
  errors?: Array<{ message: string }>
}

const CARD_WIDTH = 1361
const CARD_HEIGHT = 766
const APPROVED_BG_URL = 'https://r2.tessera.fun/approved.png'
const DEFAULT_HANDLE = '@Tessera_PE'

function normalizeHandleForDisplay(value: string | null): string {
  if (!value) return DEFAULT_HANDLE
  const cleaned = value.trim().replace(/^@+/, '')
  if (!cleaned) return DEFAULT_HANDLE
  if (!/^[a-zA-Z0-9_]{1,15}$/.test(cleaned)) return DEFAULT_HANDLE
  return `@${cleaned}`
}

function normalizeHandleForCache(displayHandle: string): string {
  return displayHandle.replace(/^@/, '').toLowerCase()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function generateApprovedCardHTML(handle: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Tessera approved card</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${CARD_WIDTH}px;
    height: ${CARD_HEIGHT}px;
    position: relative;
    overflow: hidden;
    background: #000000;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }
  .bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }
  .handle {
    position: absolute;
    left: 60px;
    top: 556px;
    font-size: 62px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.02em;
    color: #C7F488;
    z-index: 2;
  }
</style>
</head>
<body>
  <img src="${escapeHtml(APPROVED_BG_URL)}" alt="" class="bg">
  <div class="handle">${escapeHtml(handle)}</div>
</body>
</html>`
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const refresh = url.searchParams.get('refresh') === '1'
  const displayHandle = normalizeHandleForDisplay(url.searchParams.get('handle'))
  const cacheHandle = normalizeHandleForCache(displayHandle)
  const cacheKey = `approved-card-${cacheHandle}.png`

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

  const html = generateApprovedCardHTML(displayHandle)
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
