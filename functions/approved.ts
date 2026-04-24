import type { PagesFunction } from '@cloudflare/workers-types'

type Env = Record<string, never>

const SEO = {
  title: 'Tessera — Pre-Sale 2 Eligibility Approved',
  description: 'I just passed Tessera Pre-Sale 2 eligibility. Private equity, on-chain, no KYC.',
  siteName: 'Tessera',
}

const LANDING_PATH = '/auction/T-SpaceX/eligibility'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const url = new URL(request.url)
  const handleParam = url.searchParams.get('handle')

  const origin = url.origin
  const imageParams = new URLSearchParams()
  if (handleParam) {
    imageParams.set('handle', handleParam)
  }
  if (url.searchParams.get('refresh') === '1') {
    imageParams.set('refresh', '1')
  }
  const imageQuery = imageParams.toString()
  const imageUrl = imageQuery ? `${origin}/api/social/approved-card?${imageQuery}` : `${origin}/api/social/approved-card`
  const redirectUrl = `${origin}${LANDING_PATH}`
  const redirectUrlJson = JSON.stringify(redirectUrl)

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(SEO.title)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <meta name="theme-color" content="#131314" />

    <meta name="title" content="${escapeHtml(SEO.title)}" />
    <meta name="description" content="${escapeHtml(SEO.description)}" />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(url.href)}" />
    <meta property="og:title" content="${escapeHtml(SEO.title)}" />
    <meta property="og:description" content="${escapeHtml(SEO.description)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1361" />
    <meta property="og:image:height" content="766" />
    <meta property="og:site_name" content="${escapeHtml(SEO.siteName)}" />
    <meta property="og:locale" content="en_US" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(url.href)}" />
    <meta name="twitter:title" content="${escapeHtml(SEO.title)}" />
    <meta name="twitter:description" content="${escapeHtml(SEO.description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  </head>
  <body>
    <script>
      setTimeout(() => { window.location.href = ${redirectUrlJson}; }, 100);
    </script>
  </body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
