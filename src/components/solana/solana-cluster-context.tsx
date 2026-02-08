import { CURRENT_NETWORK } from '@/config'
import { createContext, ReactNode, useContext, useMemo } from 'react'

export type SolanaClusterId = 'solana:devnet' | 'solana:localnet' | 'solana:mainnet'

export interface SolanaCluster {
  id: SolanaClusterId
  label: string
  endpoint: string
  url: string
}

interface SolanaClusterContextValue {
  cluster: SolanaCluster
  clusters: SolanaCluster[]
}

const SolanaClusterContext = createContext<SolanaClusterContextValue | null>(null)

export function SolanaClusterProvider({ clusters, children }: { clusters: SolanaCluster[]; children: ReactNode }) {

  const cluster = CURRENT_NETWORK === 'mainnet-beta' ? clusters[1] : clusters[0]

  const value = useMemo<SolanaClusterContextValue>(() => {
    return {
      cluster,
      clusters,
    }
  }, [cluster, clusters])

  return <SolanaClusterContext.Provider value={value}>{children}</SolanaClusterContext.Provider>
}

export function useSolanaCluster() {
  const value = useContext(SolanaClusterContext)
  if (!value) {
    throw new Error('useSolanaCluster must be used within a SolanaClusterProvider')
  }
  return value
}
