import { useAuctionAlphaVault, useAuctionPresaleVaultConfigs, useAuctionToken } from '../../context'

interface AuctionTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AuctionTabs({ activeTab, onTabChange }: AuctionTabsProps) {
  const { config } = useAuctionAlphaVault()
  const token = useAuctionToken()
  const presaleConfigs = useAuctionPresaleVaultConfigs()

  const tabs = [
    ...presaleConfigs.map((pc) => ({
      id: `presale-${pc.id}`,
      label: pc.label,
    })),
    { id: 'auction', label: token.auctionTabLabel ?? 'Auction' },
    { id: 'vesting', label: config.hasVestingPeriod ? 'Vesting' : 'Claim' },
  ]

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center p-1 bg-zinc-200 dark:bg-[#1e1f20] rounded-xl w-full lg:w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 lg:flex-none px-4 lg:px-6 py-2 text-sm lg:text-base font-normal rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#323334] text-foreground dark:text-[#d2d2d2] shadow-sm'
                : 'text-[#71717a] dark:text-[#d2d2d2]/50 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
