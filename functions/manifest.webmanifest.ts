import { pwaManifest } from '../shared/pwa-manifest'

// Serve the PWA manifest dynamically to bypass Cloudflare's zone-level Bot
// Fight Mode, which 403s static `application/manifest+json` requests from
// non-browser user agents. The Seeker "Seed Vault Wallet" (com.solanamobile.wallet)
// fetches this URL during MWA identity verification with an Android HTTP client
// (not Chrome), so the static route was unreachable to it — MWABottomSheetActivity
// then silently finish()ed before binding the local WebSocket, manifesting as
// `ws://localhost:<port>/solana-wallet` → ERR_CONNECTION_REFUSED on the dApp side.
export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify(pwaManifest), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
