import { useQuery } from '@tanstack/react-query'
import { getExploreAssets, type ExploreAsset } from '@/services'
import { AssetCard } from './components/asset-card'
import { ComingSoonCard } from './components/coming-soon-card'
import HelpCircleIcon from './components/_/help-circle.svg?react'

export default function ExplorePage() {
  const { data: assets } = useQuery({
    queryKey: ['exploreAssets'],
    queryFn: getExploreAssets,
  })

  const handleAssetAction = (asset: ExploreAsset) => {
    if (asset.status === 'trading') {
      alert(`Navigate to trade page for ${asset.name}`)
    } else if (asset.status === 'auction') {
      alert(`Navigate to auction page for ${asset.name}`)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Explore</h1>
        <button className="flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-foreground transition-colors">
          <HelpCircleIcon className="w-[18px] h-[18px]" />
          Learn More
        </button>
      </div>

      {/* Subtitle */}
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
        Discover and track the world's most innovative private companies.
      </p>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets?.map((asset) => (
          <AssetCard key={asset.id} asset={asset} onAction={handleAssetAction} />
        ))}
        <ComingSoonCard />
      </div>
    </div>
  )
}
