import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import { App } from './app.tsx'
// Bootstrap URL-hash wallet for testing (registers a Wallet Standard wallet if a private key is present in the URL hash)
import './dev/url-key-wallet'

if (import.meta.env.DEV) {
  import('eruda').then((eruda) => eruda.default.init())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// Patch BigInt so we can log it using JSON.stringify without any errors
declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}
