import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Info, ExternalLink } from 'lucide-react'
import { getAuctionTokenInfo } from '@/services'
import TokenIcon from './_/t.svg?react'

export function TokenInfoCard() {
  const { data: tokenInfo } = useQuery({
    queryKey: ['auctionTokenInfo'],
    queryFn: getAuctionTokenInfo,
  })

  return (
    <Card className="p-6 bg-white dark:bg-[#323334]">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden shrink-0">
            <TokenIcon />
          </div>
          <div className="flex-1">
            {/* Mobile: stacked layout, Desktop: inline layout */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2 mb-1">
              <h3 className="text-xl font-semibold text-foreground">{tokenInfo?.name ?? 'Loading...'}</h3>
              <div className="flex items-center gap-2">
                <span className="bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] text-[#71717a] dark:text-[#999] text-[10px] font-semibold px-2 py-1 rounded tracking-wider">
                  {tokenInfo?.type ?? '-'}
                </span>
              </div>
            </div>
            {/* Website link */}
            <a
              href={tokenInfo?.website ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#06a800] hover:underline inline-flex items-center gap-1"
            >
              Official Website
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground leading-relaxed">{tokenInfo?.description ?? ''}</p>

        {/* Info Boxes - Mobile: vertical stack, Desktop: 2 cols */}
        <div className="flex">
          <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 w-full">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-zinc-400" />
              <h4 className="text-sm font-semibold text-foreground">Auction Mechanism</h4>
            </div>
            <p className="text-xs text-[#71717a] dark:text-[#999] leading-relaxed">
              {tokenInfo?.auctionMechanism ?? ''}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
