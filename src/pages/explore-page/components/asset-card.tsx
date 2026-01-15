import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ExploreAsset } from '@/services'
import ExternalLinkIcon from './_/external-link.svg?react'
import SwapIcon from './_/swap.svg?react'
import GavelIcon from './_/gavel.svg?react'
import HourglassIcon from './_/hourglass.svg?react'

interface AssetCardProps {
  asset: ExploreAsset
  onAction?: (asset: ExploreAsset) => void
}

export function AssetCard({ asset, onAction }: AssetCardProps) {
  const handleAction = () => {
    onAction?.(asset)
  }

  return (
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-700">
      {/* Header */}
      <div
        className="p-5 pt-5 pb-0 h-[118px] flex justify-between"
        style={{ backgroundColor: asset.headerColor }}
      >
        <div className="flex flex-col gap-2">
          <span className="bg-white/20 text-white text-[11px] font-medium px-2 py-1 rounded w-fit">
            {asset.category}
          </span>
          <h3 className="text-xl font-semibold text-white">{asset.name}</h3>
          <p className="text-xs text-white/70">{asset.ticker}</p>
        </div>
        <button className="text-white/70 hover:text-white transition-colors h-fit">
          <ExternalLinkIcon className="w-[14px] h-[14px]" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Price</span>
          <span className="text-base font-semibold text-foreground">
            ${asset.price.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Valuation at Price</span>
          <span className="text-base font-semibold text-foreground">{asset.valuation}</span>
        </div>

        {/* Action Button */}
        {asset.status === 'trading' && (
          <Button
            onClick={handleAction}
            className="w-full h-9 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-[13px] font-medium"
          >
            <SwapIcon className="w-4 h-4 mr-2" />
            Buy / Sell
          </Button>
        )}
        {asset.status === 'auction' && (
          <Button
            onClick={handleAction}
            className="w-full h-9 bg-[#d2fb95] text-zinc-900 hover:bg-[#c4ed87] text-[13px] font-medium"
          >
            <GavelIcon className="w-4 h-4 mr-2" />
            Join Auction
          </Button>
        )}
        {asset.status === 'coming_soon' && (
          <Button
            disabled
            className="w-full h-9 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-[13px] font-medium cursor-not-allowed"
          >
            <HourglassIcon className="w-4 h-4 mr-2" />
            Coming Soon
          </Button>
        )}
      </div>
    </Card>
  )
}
