import type { PagesFunction } from '@cloudflare/workers-types'

import { parseWalletAddress } from './lib/wallet-link'
import { isSocialCardTokenId } from './lib/social-card-stats'

type Env = Record<string, never>

const SEO = {
  title: 'Tessera — Private Equity for Everyone',
  description: 'Private equity, on-chain, no KYC. Get in early on Tessera.',
  siteName: 'Tessera',
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const url = new URL(request.url)
  const walletParam = url.searchParams.get('wallet')
  const tokenIdParam = url.searchParams.get('tokenId')
  const handleParam = url.searchParams.get('handle')

  let wallet: string
  try {
    wallet = parseWalletAddress(walletParam).address
  } catch {
    return new Response('Invalid or missing wallet', { status: 400 })
  }

  if (!tokenIdParam || !isSocialCardTokenId(tokenIdParam)) {
    return new Response('Invalid or missing tokenId', { status: 400 })
  }

  const origin = url.origin
  const imageParams = new URLSearchParams({
    wallet,
    tokenId: tokenIdParam,
  })
  if (handleParam) {
    imageParams.set('handle', handleParam)
  }
  const imageUrl = `${origin}/api/social/card?${imageParams.toString()}`
  const redirectUrl = `${origin}/auction/${encodeURIComponent(tokenIdParam)}/eligibility`

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${SEO.title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <meta name="theme-color" content="#131314" />

    <meta name="title" content="${SEO.title}" />
    <meta name="description" content="${SEO.description}" />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url.href}" />
    <meta property="og:title" content="${SEO.title}" />
    <meta property="og:description" content="${SEO.description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1361" />
    <meta property="og:image:height" content="766" />
    <meta property="og:site_name" content="${SEO.siteName}" />
    <meta property="og:locale" content="en_US" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url.href}" />
    <meta name="twitter:title" content="${SEO.title}" />
    <meta name="twitter:description" content="${SEO.description}" />
    <meta name="twitter:image" content="${imageUrl}" />
  </head>
  <body>
    <script>
      setTimeout(() => { window.location.href = "${redirectUrl}"; }, 100);
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
