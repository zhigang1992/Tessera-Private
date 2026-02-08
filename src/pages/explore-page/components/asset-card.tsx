import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ExploreAsset } from '@/services'
import ExternalLinkIcon from './_/external-link.svg?react'
import SwapIcon from './_/swap.svg?react'
import GavelIcon from './_/gavel.svg?react'
import HourglassIcon from './_/hourglass.svg?react'
import { PRODUCTION_MODE } from '@/config'

interface AssetCardProps {
  asset: ExploreAsset
  onAction?: (asset: ExploreAsset) => void
}

export function AssetCard({ asset, onAction }: AssetCardProps) {
  const handleAction = () => {
    onAction?.(asset)
  }

  return (
    <Card className="overflow-hidden rounded-2xl border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] bg-white dark:bg-[#323334] hover:shadow-[0px_4px_8px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
      {/* Header */}
      <div
        className="aspect-[4/3] px-5 py-5 flex justify-between items-start bg-cover bg-center"
        style={{
          backgroundColor: asset.headerColor,
          ...(asset.headerImage && { backgroundImage: `url(${asset.headerImage})` }),
        }}
      >
        <div className="flex-1">
          <div className="inline-block px-2 py-1 rounded bg-[#18181b]/10 text-[#18181b] text-[11px] font-medium mb-3 leading-normal">
            {asset.category}
          </div>
          <h3 className="text-xl font-semibold text-[#18181b] mb-1 leading-normal">{asset.name}</h3>
          <p className="text-xs text-[#52525b] leading-normal">{asset.ticker}</p>
        </div>
        {!PRODUCTION_MODE && (
          <button className="text-[#71717a] hover:text-[#18181b] transition-colors h-fit">     
               <ExternalLinkIcon className="w-[14px] h-[14px]" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#71717a] leading-normal">Price</span>
          <span className="text-base font-semibold text-[#18181b] dark:text-[#d2d2d2] leading-normal">
            {asset.price != null ? '$' + asset.price.toFixed(2) : "TBA"}
          </span>
        </div>
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs text-[#71717a] leading-normal">Valuation at Price</span>
          <span className="text-base font-semibold text-[#18181b] dark:text-[#d2d2d2] leading-normal">{asset.valuation ?? "TBA"}</span>
        </div>

        {/* Action Button */}
        {asset.status === 'trading' && (
          <Button
            onClick={handleAction}
            className="w-full rounded-lg py-2.5 px-4 bg-[#18181b] dark:bg-white text-white dark:text-black hover:bg-[#27272a] dark:hover:bg-gray-100 text-[13px] font-medium leading-normal flex items-center justify-center gap-1.5"
          >
            <SwapIcon className="w-4 h-4" />
            Buy / Sell
          </Button>
        )}
        {asset.status === 'auction' && (
          <Button
            onClick={handleAction}
            className="w-full rounded-lg py-2.5 px-4 bg-[#d2fb95] text-[#18181b] hover:bg-[#c5ed88] text-[13px] font-medium leading-normal flex items-center justify-center gap-1.5"
          >
            <GavelIcon className="w-4 h-4" />
            Join Auction
          </Button>
        )}
        {asset.status === 'coming_soon' && (
          <Button
            disabled
            className="w-full rounded-lg py-2.5 px-4 bg-[#f4f4f5] dark:bg-[#3f3f46] text-[#a1a1aa] dark:text-[#71717a] text-[13px] font-medium leading-normal cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <HourglassIcon className="w-4 h-4" />
            Coming Soon
          </Button>
        )}
      </div>
    </Card>
  )
}
