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
        'flex items-center gap-3 rounded-2xl border-2 px-6 py-3.5 transition-colors min-w-fit',
        isActive
          ? 'bg-[#D2FB95] border-[#2E7D32] text-black'
          : 'bg-white dark:bg-[#2a2b2c] border-zinc-200 dark:border-zinc-700 text-foreground dark:text-[#d2d2d2] hover:bg-zinc-50 dark:hover:bg-[#323334]',
      )}
    >
      <AppTokenIcon token={token.id} size={28} className="rounded-full" />
      <span className="font-bold text-base whitespace-nowrap">{token.displayName}</span>
    </Link>
  )
}
