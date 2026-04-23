// Shared source-of-truth for the PWA web manifest.
//
// Consumed by:
// - vite.config.ts (passed into VitePWA to emit dist/manifest.webmanifest at build)
// - functions/manifest.webmanifest.ts (serves it dynamically at runtime, bypassing
//   Cloudflare's zone-level Bot Fight challenge which otherwise blocks
//   application/manifest+json requests from non-browser user agents).

import type { ManifestOptions } from 'vite-plugin-pwa'

export const pwaManifest: Partial<ManifestOptions> = {
  id: '/',
  name: 'Tessera',
  short_name: 'Tessera',
  description: 'Tessera, Private Equity for Everyone',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#131314',
  background_color: '#131314',
  lang: 'en',
  categories: ['finance'],
  icons: [
    { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    {
      src: 'maskable-icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
}
