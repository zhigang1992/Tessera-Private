import { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { getRpcEndpoint } from '@/config'
import { WalletLinkPage } from './index'

/**
 * Standalone React tree for `/wallet-link`.
 *
 * Intentionally does NOT mount `<DynamicProvider>` or the main-app
 * `<SolanaProvider>` — we want a fresh wallet-adapter context, unconnected
 * from whatever wallet the user has signed into on the main app. The page is
 * designed to be opened in a new tab.
 *
 * `autoConnect={false}` + a fresh `localStorageKey` prevents this flow from
 * grabbing whichever wallet the main-app tab is using, and vice versa.
 */
export function WalletLinkApp() {
  const endpoint = useMemo(() => getRpcEndpoint(), [])
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={[]} autoConnect={false} localStorageKey="tessera-wallet-link:wallet-name">
          <WalletLinkPage />
          <Toaster position="bottom-left" />
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  )
}
