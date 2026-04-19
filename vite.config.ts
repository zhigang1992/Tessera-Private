import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'node:path'

// Opt in to a real service worker with `VITE_SW_ENABLED=true`. When unset
// (the default), VitePWA still emits the web manifest + icons (the PWA
// identity — Bubblewrap reads the manifest at init time) but generates a
// self-destroying SW that unregisters itself on users who previously had one,
// so flipping this off is safe for existing installs.
const swEnabled = process.env.VITE_SW_ENABLED === 'true'

// https://vite.dev/config/
export default defineConfig({
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
      manifest: {
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
      },
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
