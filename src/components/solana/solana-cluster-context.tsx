import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

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
  setCluster: (clusterId: SolanaClusterId) => void
}

const STORAGE_KEY = 'solana-cluster-id'

const SolanaClusterContext = createContext<SolanaClusterContextValue | null>(null)

export function SolanaClusterProvider({
  clusters,
  children,
}: {
  clusters: SolanaCluster[]
  children: ReactNode
}) {
  const defaultCluster = clusters[0]
  const [clusterId, setClusterId] = useState<SolanaClusterId>(() => {
    if (typeof window === 'undefined') {
      return defaultCluster.id
    }
    const storedId = window.localStorage.getItem(STORAGE_KEY) as SolanaClusterId | null
    const clusterExists = storedId && clusters.some((cluster) => cluster.id === storedId)
    return clusterExists ? storedId! : defaultCluster.id
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, clusterId)
    }
  }, [clusterId])

  const cluster = useMemo(
    () => clusters.find((item) => item.id === clusterId) ?? defaultCluster,
    [clusterId, clusters, defaultCluster],
  )

  const value = useMemo<SolanaClusterContextValue>(() => {
    return {
      cluster,
      clusters,
      setCluster: (nextClusterId) => {
        setClusterId((prev) => {
          const exists = clusters.some((item) => item.id === nextClusterId)
          return exists ? nextClusterId : prev
        })
      },
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
