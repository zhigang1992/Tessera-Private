/**
 * Cloudflare Worker for Geo-blocking Check
 *
 * Deploy this as a Cloudflare Worker and configure it to handle requests to /geo-check.json
 *
 * Deployment instructions:
 * 1. Go to Cloudflare Dashboard > Workers & Pages
 * 2. Create a new Worker
 * 3. Paste this code
 * 4. Deploy
 * 5. Add a route in your domain settings: tessera.fun/geo-check.json -> your-worker
 *
 * Or use Cloudflare Pages Functions:
 * 1. Create a file at: functions/geo-check.json.js with this content
 * 2. Deploy via Cloudflare Pages
 */

export default {
  async fetch(request, env, ctx) {
    // Get country code from Cloudflare headers
    const country = request.headers.get('CF-IPCountry') || null

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
  },
}
