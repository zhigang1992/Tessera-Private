import { getExplorerLink, GetExplorerLinkArgs } from 'gill'
import type { SolanaClusterMoniker } from 'gill'
import { ArrowUpRightFromSquare } from 'lucide-react'
import { useSolana } from '@/components/solana/use-solana'
import type { SolanaClusterId } from '@/components/solana/solana-cluster-context'

function toExplorerCluster(clusterId: SolanaClusterId): SolanaClusterMoniker | 'mainnet-beta' | 'localhost' {
  switch (clusterId) {
    case 'solana:mainnet':
      return 'mainnet'
    case 'solana:devnet':
      return 'devnet'
    case 'solana:localnet':
      return 'localnet'
    default:
      return 'mainnet'
  }
}

export function AppExplorerLink({
  className,
  label = '',
  ...link
}: GetExplorerLinkArgs & {
  className?: string
  label: string
}) {
  const { cluster } = useSolana()
  return (
    <a
      href={getExplorerLink({ ...link, cluster: toExplorerCluster(cluster.id) })}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? className : `link font-mono inline-flex gap-1`}
    >
      {label}
      <ArrowUpRightFromSquare size={12} />
    </a>
  )
}
