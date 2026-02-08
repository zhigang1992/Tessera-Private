import { createContext, ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import type { SolanaClient } from 'gill'
import { createSolanaClient } from 'gill'
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

  return (
    <SolanaClientContext.Provider value={client}>
      <ConnectionProvider endpoint={cluster.endpoint}>
        <WalletProvider autoConnect wallets={wallets}>
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

