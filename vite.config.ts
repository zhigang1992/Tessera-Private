import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import { cloudflare } from '@cloudflare/vite-plugin'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({}),
    react(),
    svgr(),
    tailwindcss(),
    viteTsconfigPaths({
      root: resolve(__dirname),
    }),
    cloudflare(),
  ],
  server: {
    port: parseInt(process.env.PORT || '6173', 10),
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      // Proxy API endpoints to Cloudflare Workers local dev server
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
      // Proxy geo-check endpoint
      '/geo-check.json': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
})
