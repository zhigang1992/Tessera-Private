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
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
            <TokenIcon/>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold text-foreground">{tokenInfo?.name ?? 'Loading...'}</h3>
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-semibold px-2 py-1 rounded tracking-wider">
                {tokenInfo?.type ?? '-'}
              </span>
              <button className="text-zinc-400 hover:text-foreground transition-colors">
                <Info className="w-4 h-4" />
              </button>
            </div>
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

        {/* Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#f6f6f6] dark:bg-zinc-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-zinc-400" />
              <h4 className="text-sm font-semibold text-foreground">Vesting Terms</h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {tokenInfo?.vestingTerms ?? ''}
            </p>
          </div>
          <div className="bg-[#f6f6f6] dark:bg-zinc-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-zinc-400" />
              <h4 className="text-sm font-semibold text-foreground">Auction Mechanism</h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {tokenInfo?.auctionMechanism ?? ''}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
