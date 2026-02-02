import { createRoot } from 'react-dom/client'
import './index.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import { App } from './app.tsx'
// Bootstrap URL-hash wallet for testing (registers a Wallet Standard wallet if a private key is present in the URL hash)
import './dev/url-key-wallet'

// Temporarily disable StrictMode due to wallet adapter connection issues
// See: https://github.com/anza-xyz/wallet-adapter/issues/686
createRoot(document.getElementById('root')!).render(<App />)
// Patch BigInt so we can log it using JSON.stringify without any errors
declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}
