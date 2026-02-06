import { useQuery } from '@tanstack/react-query'
import { getExploreAssets, type ExploreAsset } from '@/services'
import { AssetCard } from './components/asset-card'
import { AssetCardSkeleton } from './components/asset-card-skeleton'
import HelpCircleIcon from './components/_/help-circle.svg?react'

export default function ExplorePage() {
  const { data: assets, isLoading } = useQuery({
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
        <h1 className="text-[24px] font-semibold text-black dark:text-[#d2d2d2]">Explore</h1>
        <a href="/support" className="flex items-center gap-1 text-[13px] text-[#71717a] hover:text-black dark:hover:text-[#d2d2d2] transition-colors">
          <HelpCircleIcon className="w-[18px] h-[18px]" />
          Learn More
        </a>
      </div>

      {/* Subtitle */}
      <p className="text-[13px] text-[#71717a] leading-normal">
        Discover and track innovative private companies and prediction markets.
      </p>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {isLoading ? (
          <>
            <AssetCardSkeleton />
            <AssetCardSkeleton />
          </>
        ) : (
          <>
            {assets?.map((asset) => (
              <AssetCard key={asset.id} asset={asset} onAction={handleAssetAction} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
