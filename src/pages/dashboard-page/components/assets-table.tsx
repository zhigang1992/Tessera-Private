import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import TokenSpacexIcon from './_/token-spacex.svg?react'
import { getTokenizedAssets } from '@/services'

export function AssetsTable() {
  const [selectedAsset, setSelectedAsset] = useState<string>('spacex')

  const { data: assets, isLoading } = useQuery({
    queryKey: ['tokenizedAssets'],
    queryFn: getTokenizedAssets,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  return (
    <div className="bg-white dark:bg-[#323334] border border-black/15 dark:border-[rgba(210,210,210,0.1)] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
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
              <p className="text-xs font-normal text-[#999]">Valuation</p>
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
                selectedAsset === asset.id
                  ? 'bg-[#d2fb95] border-[#c5ed8a]'
                  : 'hover:bg-[#edffd3] dark:hover:bg-[#edffd31a] border-black/15 dark:border-[rgba(210,210,210,0.1)]'
              }`}
              onClick={() => setSelectedAsset(asset.id)}
            >
              <div className="w-[30%] min-w-[150px] flex items-center gap-3">
                <TokenSpacexIcon className="w-8 h-8" />
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      selectedAsset === asset.id ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]'
                    }`}
                  >
                    {asset.name}
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
                    selectedAsset === asset.id ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]'
                  }`}
                >
                  ${asset.price.toFixed(2)}
                </p>
              </div>
              <div className="w-[17.5%] min-w-[100px]">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-[#269700]" />
                  <p
                    className={`text-sm font-semibold ${
                      selectedAsset === asset.id ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]'
                    }`}
                  >
                    {asset.holders.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="w-[17.5%] min-w-[100px]">
                <p
                  className={`text-sm font-semibold ${
                    selectedAsset === asset.id ? 'text-black' : 'text-foreground dark:text-[#d2d2d2]'
                  }`}
                >
                  {asset.valuation}
                </p>
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
