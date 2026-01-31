/**
 * Cloudflare Pages Function for Geo-blocking Check
 *
 * This file is automatically deployed when you deploy to Cloudflare Pages.
 * It will be available at: https://your-domain.com/geo-check.json
 *
 * Cloudflare Pages automatically provides the CF-IPCountry header.
 */

interface Env {
  // Add any environment variables here if needed
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // Get country code from Cloudflare headers
  const country = context.request.headers.get('CF-IPCountry') || null

  // Return JSON response
  return new Response(
    JSON.stringify({
      country: country,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  )
}
