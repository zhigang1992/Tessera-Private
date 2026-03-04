import { createContext, ReactNode, useCallback, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import type { WalletError } from '@solana/wallet-adapter-base'
import type { SolanaClient } from 'gill'
import { createSolanaClient } from 'gill'
import { toast } from 'sonner'
import { solanaMobileWalletAdapter } from './solana-mobile-wallet-adapter'
import { SolanaClusterProvider, SolanaCluster, useSolanaCluster } from './solana-cluster-context'
import { RPC_ENDPOINTS } from '@/config'

// Use environment variable for mainnet RPC or fall back to public endpoint

const CLUSTERS: SolanaCluster[] = [
  {
    id: 'solana:devnet',
    label: 'Devnet',
    endpoint: RPC_ENDPOINTS.devnet,
    url: 'devnet',
  },
  {
    id: 'solana:mainnet',
    label: 'Mainnet',
    endpoint: RPC_ENDPOINTS['mainnet-beta'],
    url: 'mainnet',
  },
]

solanaMobileWalletAdapter({ clusters: CLUSTERS })

const SolanaClientContext = createContext<SolanaClient | null>(null)

function SolanaProviderInner({ children }: { children: ReactNode }) {
  const { cluster } = useSolanaCluster()

  const client = useMemo(() => createSolanaClient({ urlOrMoniker: cluster.url }), [cluster.url])

  // Use empty array to let wallets auto-register via Wallet Standard
  // Phantom, Solflare, and other modern wallets register themselves automatically
  const wallets = useMemo(() => [], [])

  // Handle wallet errors with user-friendly messages
  const onError = useCallback((error: WalletError) => {
    console.error('Wallet error:', error)

    // Provide specific error messages based on error type
    const errorMessage = error.message || 'Unknown wallet error'

    // Check for common error patterns
    if (errorMessage.includes('User rejected') || errorMessage.includes('rejected the request')) {
      toast.error('Connection cancelled')
    } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      toast.error('Connection timeout - please try again')
    } else if (errorMessage.includes('not found') || errorMessage.includes('not installed')) {
      toast.error('Wallet not found - please install it first')
    } else if (errorMessage.includes('network') || errorMessage.includes('RPC')) {
      toast.error('Network error - please check your connection')
    } else {
      // Generic fallback for other errors
      toast.error(`Wallet connection failed: ${errorMessage}`)
    }
  }, [])

  return (
    <SolanaClientContext.Provider value={client}>
      <ConnectionProvider endpoint={cluster.endpoint}>
        <WalletProvider autoConnect wallets={wallets} onError={onError}>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SolanaClientContext.Provider>
  )
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  return (
    <SolanaClusterProvider clusters={CLUSTERS}>
      <SolanaProviderInner>{children}</SolanaProviderInner>
    </SolanaClusterProvider>
  )
}
