import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSolana } from '@/components/solana/use-solana'
import { type SolanaClusterId, useSolanaCluster } from '@/components/solana/solana-cluster-context'

export function ClusterDropdown() {
  const { cluster } = useSolana()
  const { clusters, setCluster } = useSolanaCluster()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{cluster.label}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup value={cluster.id} onValueChange={(cluster) => setCluster(cluster as SolanaClusterId)}>
          {clusters.map((cluster) => {
            return (
              <DropdownMenuRadioItem key={cluster.id} value={cluster.id}>
                {cluster.label}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
