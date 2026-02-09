import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { AuctionTabs } from './components/auction/auction-tabs'
import { AuctionHeaderCard } from './components/auction/auction-header-card'
import { AuctionProgressCard } from './components/auction/auction-progress-card'
import { DepositUSDCCard } from './components/auction/deposit-usdc-card'
import { TokenInfoCard } from './components/auction/token-info-card'
import { VestingHeaderCard } from './components/vesting/vesting-header-card'
import { VestingChartCard } from './components/vesting/vesting-chart-card'
import { ClaimHeaderCard } from './components/vesting/claim-header-card'
import { ClaimTokensCard } from './components/vesting/claim-tokens-card'
import { AuctionProvider } from './context'
import { DEFAULT_BASE_TOKEN_ID, getAppToken, resolveTokenIdFromParam } from '@/config'
import { useAlphaVault } from '@/hooks/use-alpha-vault'
import { Button } from '@/components/ui/button'

export default function AuctionPage() {
  const params = useParams<{ tokenId?: string }>()
  const navigate = useNavigate()
  const tokenId = useMemo(() => {
    return resolveTokenIdFromParam(params.tokenId) ?? DEFAULT_BASE_TOKEN_ID
  }, [params.tokenId])

  const token = useMemo(() => getAppToken(tokenId), [tokenId])
  const alphaVault = useAlphaVault(tokenId)
  const [activeTab, setActiveTab] = useState('auction')
  const hasVestingPeriod = alphaVault.config.hasVestingPeriod

  const handleCheckWhitelist = () => {
    navigate(`/auction/${params.tokenId}/whitelist`)
  }

  return (
    <AuctionProvider value={{ tokenId, token, alphaVault }}>
      <div className="flex flex-col gap-4 lg:gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl lg:text-2xl font-bold text-foreground dark:text-[#d2d2d2]">Auction</h1>
          <Button
            onClick={handleCheckWhitelist}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Check Whitelist
          </Button>
        </div>

        <AuctionTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'auction' && (
          <div className="flex flex-col gap-4 lg:gap-6">
            <AuctionHeaderCard />

            <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
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

        {activeTab === 'vesting' && (
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
