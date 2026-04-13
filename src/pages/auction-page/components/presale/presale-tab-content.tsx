import type { ResolvedPresaleVaultEntry } from '@/config'
import { usePresaleVault } from '@/hooks/use-presale-vault'
import { useAuctionTokenId } from '../../context'
import { PresaleHeaderCard } from './presale-header-card'
import { PresaleDepositCard } from './presale-deposit-card'
import type { AuctionPhaseNavProps } from '../auction/auction-phase-nav'

interface PresaleTabContentProps {
  presaleConfig: ResolvedPresaleVaultEntry
  phaseNav: AuctionPhaseNavProps
}

export function PresaleTabContent({ presaleConfig, phaseNav }: PresaleTabContentProps) {
  const tokenId = useAuctionTokenId()
  const presaleVault = usePresaleVault(tokenId, presaleConfig)

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PresaleHeaderCard presaleVault={presaleVault} phaseNav={phaseNav} />
      <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
        <div className="w-full md:basis-0 md:grow md:min-w-0 order-2 md:order-1">
          {/* Placeholder for presale progress/info */}
        </div>
        <div className="w-full md:w-[400px] md:flex-shrink-0 order-1 md:order-2">
          <PresaleDepositCard presaleVault={presaleVault} />
        </div>
      </div>
    </div>
  )
}
