import { useAuctionAlphaVault, useAuctionPresaleVaultConfigs, useAuctionToken } from '../../context'

interface AuctionTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

/** Check whether the active tab belongs to the "Auction" top-level group */
function isAuctionGroup(tab: string) {
  return tab !== 'vesting' && tab !== 'claim'
}

export function AuctionTabs({ activeTab, onTabChange }: AuctionTabsProps) {
  const { config } = useAuctionAlphaVault()
  const token = useAuctionToken()
  const presaleConfigs = useAuctionPresaleVaultConfigs()

  const claimLabel = config.hasVestingPeriod ? 'Vesting' : 'Claim'
  const claimTab = config.hasVestingPeriod ? 'vesting' : 'claim'

  // Sub-tabs within "Auction": presale vaults + public auction
  const auctionSubTabs = [
    ...presaleConfigs.map((pc) => ({
      id: pc.id,
      label: pc.label,
    })),
    { id: 'auction', label: token.auctionTabLabel ?? 'Public' },
  ]

  const activeIsAuction = isAuctionGroup(activeTab)

  return (
    <div className="flex flex-col gap-3">
      {/* Top-level tabs: Auction | Claim */}
      <div className="flex items-center gap-3">
        <div className="flex items-center p-1 bg-zinc-200 dark:bg-[#1e1f20] rounded-xl w-fit">
          <button
            onClick={() => {
              if (!activeIsAuction) {
                // Switch back to first auction sub-tab
                const defaultSub = auctionSubTabs[0]?.id ?? 'auction'
                onTabChange(defaultSub)
              }
            }}
            className={`px-4 lg:px-6 py-2 text-sm lg:text-base font-normal rounded-lg transition-all ${
              activeIsAuction
                ? 'bg-white dark:bg-[#323334] text-foreground dark:text-[#d2d2d2] shadow-sm'
                : 'text-[#71717a] dark:text-[#d2d2d2]/50 hover:text-foreground'
            }`}
          >
            Auction
          </button>
          <button
            onClick={() => onTabChange(claimTab)}
            className={`px-4 lg:px-6 py-2 text-sm lg:text-base font-normal rounded-lg transition-all ${
              !activeIsAuction
                ? 'bg-white dark:bg-[#323334] text-foreground dark:text-[#d2d2d2] shadow-sm'
                : 'text-[#71717a] dark:text-[#d2d2d2]/50 hover:text-foreground'
            }`}
          >
            {claimLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
