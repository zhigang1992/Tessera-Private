import { Card } from '@/components/ui/card'
import { Info, ExternalLink } from 'lucide-react'
import { AppTokenIcon } from '@/components/app-token-icon'
import { AppTokenName } from '@/components/app-token-name'
import { useAuctionToken } from '../../context'

export function TokenInfoCard() {
  const token = useAuctionToken()
  const metadata = token.metadata ?? {}

  return (
    <Card className="p-6 bg-white dark:bg-[#323334]">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden shrink-0">
            <AppTokenIcon token={token} size={48} />
          </div>
          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2 mb-1">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-1">
                <AppTokenName token={token} />
              </h3>
              {metadata.type && (
                <div className="flex items-center gap-2">
                  <span className="bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.03)] text-[#71717a] dark:text-[#999] text-[10px] font-semibold px-2 py-1 rounded tracking-wider">
                    {metadata.type}
                  </span>
                </div>
              )}
            </div>
            {metadata.website && (
              <a
                href={metadata.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#06a800] hover:underline inline-flex items-center gap-1"
              >
                Official Website
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {metadata.description && (
          <p className="text-sm text-foreground leading-relaxed">
            {metadata.description.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
              if (part.match(/^https?:\/\//)) {
                return (
                  <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#06a800] hover:underline"
                  >
                    {part}
                  </a>
                )
              }
              return part
            })}
          </p>
        )}

        {(metadata.auctionMechanism || metadata.vestingTerms) && (
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 w-full">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-zinc-400" />
                <h4 className="text-sm font-semibold text-foreground">Auction Mechanism</h4>
              </div>
              <p className="text-xs text-[#71717a] dark:text-[#999] leading-relaxed">
                {metadata.auctionMechanism ?? 'Details coming soon.'}
              </p>
            </div>
            {metadata.vestingTerms && (
              <div className="bg-[#f6f6f6] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-4 w-full">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-zinc-400" />
                  <h4 className="text-sm font-semibold text-foreground">Vesting Terms</h4>
                </div>
                <p className="text-xs text-[#71717a] dark:text-[#999] leading-relaxed">{metadata.vestingTerms}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
