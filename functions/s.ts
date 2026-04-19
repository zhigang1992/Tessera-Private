/**
 * Share endpoint for social media sharing with Open Graph meta tags
 *
 * This endpoint generates a page with proper OG tags for social media previews,
 * then redirects to the main app with the referral code.
 *
 * Usage: /s?code=XXXXX&bg=1
 *
 * Query Parameters:
 * - code: Referral code (required)
 * - bg: Background number 1-6 (optional, defaults to 1)
 */

interface Env {
  // Add any environment variables if needed
}

const SEO = {
  title: 'Tessera, Private Equity for Everyone',
  description: 'Join Tessera with my referral code and get in early first',
  siteName: 'Tessera',
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const bg = url.searchParams.get('bg') || '1'

  // Validate code
  if (!code || !/^[a-zA-Z0-9]{4,12}$/.test(code)) {
    return new Response('Invalid or missing referral code', { status: 400 })
  }

  // Validate background number
  const bgNum = parseInt(bg, 10)
  const validBg = !isNaN(bgNum) && bgNum >= 1 && bgNum <= 6 ? bgNum : 1

  // Construct image URL - use absolute URL for social media
  const origin = url.origin
  const imageUrl = `${origin}/api/referral/image?code=${encodeURIComponent(code)}&bg=${validBg}`

  // Redirect URL - go to /referral with code param to trigger bind modal
  const redirectUrl = `${origin}/referral?code=${encodeURIComponent(code)}`

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${SEO.title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <meta name="theme-color" content="#131314" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Tessera" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />

    <!-- Primary Meta Tags -->
    <meta name="title" content="${SEO.title}" />
    <meta name="description" content="${SEO.description}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url.href}" />
    <meta property="og:title" content="${SEO.title}" />
    <meta property="og:description" content="${SEO.description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="800" />
    <meta property="og:image:height" content="450" />
    <meta property="og:site_name" content="${SEO.siteName}" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url.href}" />
    <meta name="twitter:title" content="${SEO.title}" />
    <meta name="twitter:description" content="${SEO.description}" />
    <meta name="twitter:image" content="${imageUrl}" />
  </head>
  <body>
    <script>
      // Redirect to main app after a short delay to allow social media crawlers to read meta tags
      setTimeout(() => {
        window.location.href = "${redirectUrl}";
      }, 100);
    </script>
  </body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Allow social media crawlers to cache for a reasonable time
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
