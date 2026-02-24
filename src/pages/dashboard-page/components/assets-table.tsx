import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import { getTokenizedAssets } from '@/services'
import { AppTokenIcon } from '@/components/app-token-icon'
import { AppTokenName } from '@/components/app-token-name'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { AppTokenId, DEFAULT_BASE_TOKEN_ID, getAppToken, resolveTokenIdFromParam } from '@/config'

interface AssetsTableProps {
  selectedTokenId: AppTokenId
  onSelectToken: (tokenId: AppTokenId) => void
}

export function AssetsTable({ selectedTokenId, onSelectToken }: AssetsTableProps) {
  const defaultToken = getAppToken(DEFAULT_BASE_TOKEN_ID)

  const handleAssetClick = (assetId: string) => {
    const tokenId = resolveTokenIdFromParam(assetId) ?? DEFAULT_BASE_TOKEN_ID
    onSelectToken(tokenId)
  }

  const getTokenIdForAsset = (assetId: string): AppTokenId => {
    return resolveTokenIdFromParam(assetId) ?? DEFAULT_BASE_TOKEN_ID
  }

  const { data: assets, isLoading } = useQuery({
    queryKey: ['tokenizedAssets'],
    queryFn: getTokenizedAssets,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  return (
    <div className="bg-white dark:bg-[#323334] border border-black/15 dark:border-[rgba(210,210,210,0.1)] rounded-2xl overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Table Header */}
          <div className="flex items-center px-4 py-3 border-b border-black/15 dark:border-[rgba(210,210,210,0.1)]">
            <div className="w-[30%] min-w-[150px]">
              <p className="text-xs font-normal text-[#999]">Asset Name</p>
            </div>
            <div className="w-[17.5%] min-w-[100px]">
              <p className="text-xs font-normal text-[#999]">Sector</p>
            </div>
            <div className="w-[17.5%] min-w-[100px]">
              <p className="text-xs font-normal text-[#999]">Price</p>
            </div>
            <div className="w-[17.5%] min-w-[100px]">
              <p className="text-xs font-normal text-[#999]">Holders</p>
            </div>
            <div className="w-[17.5%] min-w-[100px]">
              <p className="text-xs font-normal text-[#999]">Implied Valuation</p>
            </div>
          </div>

          {/* Table Rows */}
          {isLoading ? (
            <div className="p-4 text-center">
              <span className="text-sm text-muted-foreground">Loading assets...</span>
            </div>
          ) : !assets || assets.length === 0 ? (
            <div className="p-4 text-center">
              <span className="text-sm text-muted-foreground">No assets available</span>
            </div>
          ) : (
            assets.map((asset, index) => (
            <div
              key={asset.id}
              className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                index < assets.length - 1 ? 'border-b' : ''
              } ${
                selectedTokenId === getTokenIdForAsset(asset.id)
                  ? 'bg-[#d2fb95] border-[#c5ed8a]'
                  : 'hover:bg-[#edffd3] dark:hover:bg-[#edffd31a] border-black/15 dark:border-[rgba(210,210,210,0.1)]'
              }`}
              onClick={() => handleAssetClick(asset.id)}
            >
              <div className="w-[30%] min-w-[150px] flex items-center gap-3">
                <AppTokenIcon token={defaultToken} className="w-8 h-8" size={32} />
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      selectedTokenId === getTokenIdForAsset(asset.id) ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]'
                    }`}
                  >
                    {asset.name ?? <AppTokenName token={defaultToken} />}
                  </p>
                  <p className="text-xs font-normal text-[#71717a]">{asset.code}</p>
                </div>
              </div>
              <div className="w-[17.5%] min-w-[100px]">
                <div className="bg-[#edffd3] inline-block rounded px-1.5 py-0.5 shadow-[0px_1px_0px_0px_rgba(0,0,0,0.25)]">
                  <p className="text-xs font-normal text-[#315200]">{asset.sector}</p>
                </div>
              </div>
              <div className="w-[17.5%] min-w-[100px]">
                <p
                  className={`text-sm font-semibold ${
                    selectedTokenId === getTokenIdForAsset(asset.id) ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]'
                  }`}
                >
                  {asset.price > 0 ? `$${asset.price.toFixed(2)}` : '—'}
                </p>
              </div>
              <div className="w-[17.5%] min-w-[100px]">
                <div className="flex items-center gap-1">
                  {asset.holders > 0 && <TrendingUp className="w-3 h-3 text-[#269700]" />}
                  <p
                    className={`text-sm font-semibold ${
                      selectedTokenId === getTokenIdForAsset(asset.id) ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]'
                    }`}
                  >
                    {asset.holders > 0 ? asset.holders.toLocaleString() : '—'}
                  </p>
                </div>
              </div>
              <div className="w-[17.5%] min-w-[100px]">
                <div className="flex items-center gap-1">
                  <p
                    className={`text-sm font-semibold ${
                      selectedTokenId === getTokenIdForAsset(asset.id) ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]'
                    }`}
                  >
                    {asset.valuation}
                  </p>
                  {getAppToken(getTokenIdForAsset(asset.id)).impliedValuation?.disclaimer && (
                    <InfoTooltip text={getAppToken(getTokenIdForAsset(asset.id)).impliedValuation!.disclaimer!} />
                  )}
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden p-4 space-y-4">
        {isLoading ? (
          <div className="p-4 text-center">
            <span className="text-sm text-muted-foreground">Loading assets...</span>
          </div>
        ) : !assets || assets.length === 0 ? (
          <div className="p-4 text-center">
            <span className="text-sm text-muted-foreground">No assets available</span>
          </div>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              className={`relative rounded-xl p-4 cursor-pointer transition-colors ${
                selectedTokenId === getTokenIdForAsset(asset.id)
                  ? 'bg-[#d2fb95]'
                  : 'bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
              }`}
              onClick={() => handleAssetClick(asset.id)}
            >
              {/* Top Row: Icon, Name, Sector */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AppTokenIcon token={defaultToken} className="w-12 h-12" size={48} />
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        selectedTokenId === getTokenIdForAsset(asset.id) ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]'
                      }`}
                    >
                      {asset.name ?? <AppTokenName token={defaultToken} />}
                    </p>
                    <p className="text-xs font-normal text-[#71717a]">{asset.code}</p>
                  </div>
                </div>
                <div className="bg-[#edffd3] rounded px-1.5 py-0.5 shadow-[0px_1px_0px_0px_rgba(0,0,0,0.25)]">
                  <p className="text-[10px] font-normal text-[#315200] uppercase">{asset.sector}</p>
                </div>
              </div>

              {/* Price and Valuation Row */}
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <p className="text-[10px] font-normal text-[#71717a] mb-1 uppercase">PRICE</p>
                  <p
                    className={`text-xl font-semibold ${
                      selectedTokenId === getTokenIdForAsset(asset.id) ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]'
                    }`}
                  >
                    {asset.price > 0 ? `$${asset.price.toFixed(2)}` : '—'}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-normal text-[#71717a] mb-1 uppercase">VALUATION</p>
                  <div className="flex items-center gap-1">
                    <p
                      className={`text-xl font-semibold ${
                        selectedTokenId === getTokenIdForAsset(asset.id) ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]'
                      }`}
                    >
                      {asset.valuation}
                    </p>
                    {getAppToken(getTokenIdForAsset(asset.id)).impliedValuation?.disclaimer && (
                      <InfoTooltip text={getAppToken(getTokenIdForAsset(asset.id)).impliedValuation!.disclaimer!} />
                    )}
                  </div>
                </div>
              </div>

              {/* Holders Info */}
              <div className="flex items-center gap-1">
                {asset.holders > 0 && <TrendingUp className="w-3 h-3 text-[#269700]" />}
                <p className="text-xs font-normal text-[#71717a]">
                  Currently held by{' '}
                  <span
                    className={`font-semibold ${
                      selectedTokenId === getTokenIdForAsset(asset.id) ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]'
                    }`}
                  >
                    {asset.holders > 0 ? asset.holders.toLocaleString() : '0'}
                  </span>{' '}
                  users
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
