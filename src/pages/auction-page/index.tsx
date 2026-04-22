import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import { AuctionSwitcher } from './components/auction/auction-switcher'
import { AuctionTabs } from './components/auction/auction-tabs'
import { AuctionHeaderCard } from './components/auction/auction-header-card'
import { AuctionProgressCard } from './components/auction/auction-progress-card'
import { DepositUSDCCard } from './components/auction/deposit-usdc-card'
import { TokenInfoCard } from './components/auction/token-info-card'
import { VestingHeaderCard } from './components/vesting/vesting-header-card'
import { VestingChartCard } from './components/vesting/vesting-chart-card'
import { ClaimHeaderCard } from './components/vesting/claim-header-card'
import { ClaimTokensCard } from './components/vesting/claim-tokens-card'
import { PresaleTabContent } from './components/presale/presale-tab-content'
import { AuctionProvider } from './context'
import { DEFAULT_BASE_TOKEN_ID, getAppToken, getTokenPresaleVaultConfigs, resolveTokenIdFromParam } from '@/config'
import { useAlphaVault } from '@/hooks/use-alpha-vault'
import { useAuctionPhaseSummaries } from '@/hooks/use-auction-phase-summaries'

/** Tab belongs to the "Auction" top-level group (not claim/vesting) */
function isAuctionGroup(tab: string) {
  return tab !== 'vesting' && tab !== 'claim'
}

export default function AuctionPage() {
  const params = useParams<{ tokenId?: string; tab?: string }>()
  const navigate = useNavigate()
  const tokenId = useMemo(() => {
    return resolveTokenIdFromParam(params.tokenId) ?? DEFAULT_BASE_TOKEN_ID
  }, [params.tokenId])

  const token = useMemo(() => getAppToken(tokenId), [tokenId])
  const alphaVault = useAlphaVault(tokenId)
  const presaleVaultConfigs = useMemo(() => getTokenPresaleVaultConfigs(tokenId), [tokenId])
  const hasVestingPeriod = alphaVault.config.hasVestingPeriod

  const phaseSummaries = useAuctionPhaseSummaries(tokenId, presaleVaultConfigs, alphaVault)

  const getDefaultTab = () => {
    if (token.auctionLive) {
      return presaleVaultConfigs.length > 0 ? presaleVaultConfigs[0].id : 'auction'
    }
    return hasVestingPeriod ? 'vesting' : 'claim'
  }

  // Validate the URL tab param against known valid tabs for this token
  const validTabs = useMemo(() => {
    const ids = new Set<string>(['auction', 'vesting', 'claim'])
    for (const pc of presaleVaultConfigs) ids.add(pc.id)
    return ids
  }, [presaleVaultConfigs])

  const activeTab = params.tab && validTabs.has(params.tab) ? params.tab : getDefaultTab()

  const setActiveTab = (tab: string) => {
    navigate(`/auction/${params.tokenId}/${tab}`, { replace: true })
  }

  const showAuctionGroup = isAuctionGroup(activeTab)
  const phaseNav = { activeTab, onTabChange: setActiveTab, summaries: phaseSummaries }

  return (
    <AuctionProvider value={{ tokenId, token, alphaVault, presaleVaultConfigs }}>
      <div className="flex flex-col gap-4 lg:gap-6">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground dark:text-[#d2d2d2]">Auction</h1>

        <AuctionSwitcher activeTokenId={tokenId} />

        <AuctionTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Presale tab content — all tabs stay mounted to preserve hook/form state */}
        {presaleVaultConfigs.map((pc) => (
          <div key={pc.id} className={activeTab === pc.id ? undefined : 'hidden'}>
            <PresaleTabContent presaleConfig={pc} phaseNav={phaseNav} />
          </div>
        ))}

        {activeTab === 'auction' && (
          <div className="flex flex-col gap-6">
            <AuctionHeaderCard phaseNav={phaseNav} />

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:basis-0 md:grow md:min-w-0 order-2 md:order-1">
                <AuctionProgressCard />
              </div>
              <div className="w-full md:w-[400px] md:flex-shrink-0 order-1 md:order-2">
                <DepositUSDCCard />
              </div>
            </div>

            <TokenInfoCard />
          </div>
        )}

        {(activeTab === 'vesting' || activeTab === 'claim') && (
          <>
            {hasVestingPeriod ? (
              <div className="flex flex-col gap-4 lg:gap-6">
                <VestingHeaderCard />
                <div className="flex flex-col lg:grid lg:grid-cols-[1.75fr_1fr] gap-4 lg:gap-6">
                  <div className="order-1 lg:order-2">
                    <ClaimTokensCard />
                  </div>
                  <div className="order-2 lg:order-1">
                    <VestingChartCard />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
                <div className="w-full md:basis-0 md:grow order-2 md:order-1">
                  <ClaimHeaderCard />
                </div>
                <div className="w-full md:w-[400px] order-1 md:order-2">
                  <ClaimTokensCard />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AuctionProvider>
  )
}
