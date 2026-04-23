import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { pwaManifest } from './shared/pwa-manifest'

// Opt in to a real service worker with `VITE_SW_ENABLED=true`. When unset
// (the default), VitePWA still emits the web manifest + icons (the PWA
// identity — Bubblewrap reads the manifest at init time) but generates a
// self-destroying SW that unregisters itself on users who previously had one,
// so flipping this off is safe for existing installs.
const swEnabled = process.env.VITE_SW_ENABLED === 'true'

function resolveCommitSha(): string {
  if (process.env.CF_PAGES_COMMIT_SHA) return process.env.CF_PAGES_COMMIT_SHA
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __COMMIT_SHA__: JSON.stringify(resolveCommitSha()),
  },
  plugins: [
    nodePolyfills({}),
    react(),
    svgr(),
    tailwindcss(),
    viteTsconfigPaths({
      //
      root: resolve(__dirname),
    }),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      selfDestroying: !swEnabled,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'pwa-source-icon.svg'],
      // manifest is served by functions/manifest.webmanifest.ts; disable VitePWA's
      // static emission and the auto-injected <link> (we add that to index.html
      // ourselves so the source of truth stays in shared/pwa-manifest.ts).
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/s(?:\?|$)/,
          /^\/geo-check\.json$/,
          /^\/\.well-known\//,
        ],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.tesseralab\.co\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tessera-cdn',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: parseInt(process.env.PORT || '6173', 10),
    proxy: {
      // Proxy API endpoints to Cloudflare Workers local dev server
      '/api': {
        target: `http://localhost:${process.env.VITE_API_PORT || '8788'}`,
        changeOrigin: true,
      },
      // Proxy geo-check endpoint
      '/geo-check.json': {
        target: `http://localhost:${process.env.VITE_API_PORT || '8788'}`,
        changeOrigin: true,
      },
    },
  },
})
