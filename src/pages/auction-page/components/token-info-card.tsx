import { Card } from '@/components/ui/card'
import { Info, ExternalLink } from 'lucide-react'

// Mock data for token info
const mockTokenInfo = {
  name: 'T-SpaceX Token',
  type: 'PRE-IPO DERIVATIVE',
  website: 'https://spacex.com',
  description:
    'TspaceX is a synthetic asset engineered to track the valuation of SpaceX equity in private secondary markets. It provides institutional-grade price exposure to the space economy before public listing.',
  vestingTerms:
    'Tokens claimed from the vault are subject to a 24-hour lockup post-auction to ensure market stability during the initial discovery phase.',
  auctionMechanism:
    'Funds are deposited into a single liquidity bin. The auction runs for a set duration. If oversubscribed, participants receive a pro-rata share based on their contribution share.',
}

export function TokenInfoCard() {
  const data = mockTokenInfo

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden">
            <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="18" fill="url(#gradient)" />
              <g transform="translate(6, 13)">
                <path
                  d="M0 5.5L4 0H8L6 3.5H12L11 5.5H5L3 8L0 5.5Z"
                  fill="white"
                  opacity="0.9"
                />
                <path d="M15 2.5L13 5H18L17 7H11L9 10L24 10L22 7H20L22 5H24L15 2.5Z" fill="white" />
              </g>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#005288" />
                  <stop offset="1" stopColor="#00A8E8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold text-foreground">{data.name}</h3>
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-semibold px-2 py-1 rounded tracking-wider">
                {data.type}
              </span>
              <button className="text-zinc-400 hover:text-foreground transition-colors">
                <Info className="w-4 h-4" />
              </button>
            </div>
            <a
              href={data.website}
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
        <p className="text-sm text-foreground leading-relaxed">{data.description}</p>

        {/* Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#f6f6f6] dark:bg-zinc-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-zinc-400" />
              <h4 className="text-sm font-semibold text-foreground">Vesting Terms</h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{data.vestingTerms}</p>
          </div>
          <div className="bg-[#f6f6f6] dark:bg-zinc-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-zinc-400" />
              <h4 className="text-sm font-semibold text-foreground">Auction Mechanism</h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {data.auctionMechanism}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
