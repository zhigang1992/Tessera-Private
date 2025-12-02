import { createContext, ReactNode, useContext, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import type { SolanaClient } from 'gill'
import { createSolanaClient } from 'gill'
import { solanaMobileWalletAdapter } from './solana-mobile-wallet-adapter'
import { SolanaClusterProvider, SolanaCluster, useSolanaCluster } from './solana-cluster-context'

const CLUSTERS: SolanaCluster[] = [
  {
    id: 'solana:devnet',
    label: 'Devnet',
    endpoint: clusterApiUrl(WalletAdapterNetwork.Devnet),
    url: 'devnet',
  },
  {
    id: 'solana:mainnet',
    label: 'Mainnet',
    endpoint: clusterApiUrl(WalletAdapterNetwork.Mainnet),
    url: 'mainnet',
  },
  {
    id: 'solana:localnet',
    label: 'Localnet',
    endpoint: 'http://127.0.0.1:8899',
    url: 'localnet',
  },
]

solanaMobileWalletAdapter({ clusters: CLUSTERS })

const SolanaClientContext = createContext<SolanaClient | null>(null)

function SolanaProviderInner({ children }: { children: ReactNode }) {
  const { cluster } = useSolanaCluster()

  const client = useMemo(() => createSolanaClient({ urlOrMoniker: cluster.url }), [cluster.url])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [],
  )

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

export function useSolanaClientContext() {
  const client = useContext(SolanaClientContext)
  if (!client) {
    throw new Error('useSolanaClientContext must be used within SolanaProvider')
  }
  return client
}
