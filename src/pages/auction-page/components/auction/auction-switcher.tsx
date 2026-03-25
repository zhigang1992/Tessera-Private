import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { AppTokenIcon } from '@/components/app-token-icon'
import type { AppToken } from '@/config'
import { getAuctionTokens } from '@/config'

interface AuctionSwitcherProps {
  activeTokenId: string
}

export function AuctionSwitcher({ activeTokenId }: AuctionSwitcherProps) {
  const auctionTokens = getAuctionTokens()

  return (
    <div className="flex gap-3 overflow-x-auto">
      {auctionTokens.map((token) => (
        <AuctionSwitcherTab
          key={token.id}
          token={token}
          isActive={token.id === activeTokenId}
        />
      ))}
    </div>
  )
}

function AuctionSwitcherTab({
  token,
  isActive,
}: {
  token: AppToken
  isActive: boolean
}) {
  return (
    <Link
      to={`/auction/${token.routeSegment}`}
      className={cn(
        'flex items-center gap-3 rounded-2xl px-5 py-3 transition-colors min-w-fit',
        isActive
          ? 'bg-black text-white dark:bg-white dark:text-black'
          : 'bg-white dark:bg-[#2a2b2c] text-foreground dark:text-[#d2d2d2] hover:bg-zinc-50 dark:hover:bg-[#323334]',
      )}
    >
      <AppTokenIcon token={token.id} size={32} className="rounded-full" />
      <span className="font-semibold text-sm whitespace-nowrap">{token.displayName}</span>
      {token.auctionLive ? (
        <span className="flex items-center gap-1 bg-[#D2FB95] text-black px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">
          <span className="w-1.5 h-1.5 bg-[#06a800] rounded-full" />
          Auction Live
        </span>
      ) : (
        <span className="bg-zinc-200 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-300 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">
          Complete
        </span>
      )}
    </Link>
  )
}
