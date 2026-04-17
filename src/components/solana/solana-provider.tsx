import { createContext, ReactNode, useMemo } from 'react'
import { ConnectionProvider } from '@solana/wallet-adapter-react'
import type { SolanaClient } from 'gill'
import { createSolanaClient } from 'gill'
import { solanaMobileWalletAdapter } from './solana-mobile-wallet-adapter'
import { SolanaClusterProvider, SolanaCluster, useSolanaCluster } from './solana-cluster-context'
import { RPC_ENDPOINTS } from '@/config'

// Wallet UI and connection lifecycle are owned by Dynamic (see <DynamicProvider>).
// This provider only owns the read-only Connection context (for useConnection()) and
// cluster switching for the gill client.

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

// Register Solana Mobile Wallet via Wallet Standard so Dynamic can discover it.
solanaMobileWalletAdapter({ clusters: CLUSTERS })

const SolanaClientContext = createContext<SolanaClient | null>(null)

function SolanaProviderInner({ children }: { children: ReactNode }) {
  const { cluster } = useSolanaCluster()

  const client = useMemo(() => createSolanaClient({ urlOrMoniker: cluster.url }), [cluster.url])

  return (
    <SolanaClientContext.Provider value={client}>
      <ConnectionProvider endpoint={cluster.endpoint}>{children}</ConnectionProvider>
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

