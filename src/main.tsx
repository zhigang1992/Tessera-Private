import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { App } from './app.tsx'
import { WalletLinkApp } from './pages/wallet-link-page/wallet-link-app'
// Bootstrap URL-hash wallet for testing (registers a Wallet Standard wallet if a private key is present in the URL hash)
import './dev/url-key-wallet'

// Set `VITE_SW_ENABLED=true` at build time to ship a real service worker.
// When the toggle is off we must NOT call registerSW() — vite-plugin-pwa would
// install a self-destroying SW that reloads the page on activate, creating an
// infinite reload loop (each load re-registers the SW). Instead, manually
// unregister any pre-existing SW so users who opted in previously get cleaned
// up on their next visit. The web manifest (and PWA install prompt) is always
// shipped and unaffected by this toggle.
if (import.meta.env.VITE_SW_ENABLED === 'true') {
  const updateSW = registerSW({
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('pwa:need-refresh', { detail: { updateSW } }))
    },
  })
} else if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister()
    }
    if (registrations.length > 0 && 'caches' in window) {
      void caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    }
  })
}

// `/wallet-link` is a self-contained mini-app with its own wallet-adapter
// context; it mounts *without* the Dynamic provider tree so its connection
// state can't interact with the main app's Dynamic session. Opened in a new
// tab by design.
const isWalletLinkRoute = window.location.pathname.startsWith('/wallet-link')

if (import.meta.env.PROD) {
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-48HVYG7HHF'
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  gtag('js', new Date())
  gtag('config', 'G-48HVYG7HHF')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isWalletLinkRoute ? <WalletLinkApp /> : <App />}
  </StrictMode>,
)
// Patch BigInt so we can log it using JSON.stringify without any errors
declare global {
  interface Window {
    dataLayer: unknown[]
  }
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}
