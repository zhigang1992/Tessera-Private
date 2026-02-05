import { useQuery } from '@tanstack/react-query'
import { getDashboardTokenInfo } from '@/services'
import { AppTokenId, DEFAULT_BASE_TOKEN_ID } from '@/config'
import SolanaIcon from './_/solana-icon.svg?react'

interface TokenMetadata {
  description: string
  categories: string[]
  underlyingAssetName: string
  underlyingAssetCompany: string
  sharesPerToken: string
}

const TOKEN_METADATA: Record<AppTokenId, TokenMetadata> = {
  'T-SpaceX': {
    description: 'SpaceX is a private aerospace company founded by Elon Musk that designs and manufactures rockets and spacecraft, provides commercial and government orbital launch services, and operates the Starlink global satellite internet constellation. Its business covers reusable launch systems, crewed missions, satellite broadband.',
    categories: ['Equities'],
    underlyingAssetName: 'SpaceX Equity',
    underlyingAssetCompany: 'SpaceX',
    sharesPerToken: '1:1000'
  },
  'USDC': {
    description: 'USD Coin is a fully reserved digital dollar.',
    categories: ['Stablecoin'],
    underlyingAssetName: 'US Dollar',
    underlyingAssetCompany: 'Circle',
    sharesPerToken: 'N/A'
  }
}

interface AboutPanelProps {
  tokenId?: AppTokenId
}

export function AboutPanel({ tokenId = DEFAULT_BASE_TOKEN_ID }: AboutPanelProps) {
  const { data: tokenInfo } = useQuery({
    queryKey: ['dashboardTokenInfo', tokenId],
    queryFn: getDashboardTokenInfo,
  })

  const metadata = TOKEN_METADATA[tokenId]
  const description = metadata.description

  return (
    <div className="bg-white dark:bg-[#323334] border border-black/15 dark:border-[rgba(210,210,210,0.1)] rounded-2xl p-4 lg:p-6">
      <h2 className="text-sm lg:text-base font-semibold text-black dark:text-[#d2d2d2] mb-4 lg:mb-6">About</h2>

      {/* Description */}
      <p className="text-sm text-black dark:text-[#d2d2d2] leading-5 mb-6">
        {description}
      </p>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Left Column */}
        <div className="flex flex-col">
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Supported Chains</span>
            <div className="flex items-center gap-1.5">
              <SolanaIcon className="w-6 h-6" />
              <span className="text-sm lg:text-base text-black dark:text-[#d2d2d2]">Solana</span>
            </div>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Onchain Address</span>
            <div className="flex items-center gap-1.5">
              <SolanaIcon className="w-6 h-6" />
              <span className="text-sm lg:text-base text-black dark:text-[#d2d2d2]">{tokenInfo?.onchainAddress ?? '0x...'}</span>
              <svg
                className="w-4 h-4 opacity-50 text-black dark:text-[#d2d2d2]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Category</span>
            <div className="flex items-center gap-2.5">
              {metadata.categories.map((category) => (
                <span
                  key={category}
                  className="bg-[#d2fb95] text-black text-xs font-medium px-2 py-0.5 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
        </div>

        {/* Right Column */}
        <div className="flex flex-col">
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Underlying Asset Name</span>
            <span className="text-sm lg:text-base text-black dark:text-[#d2d2d2]">{metadata.underlyingAssetName}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Underlying Asset Company</span>
            <span className="text-sm lg:text-base text-black dark:text-[#d2d2d2]">{metadata.underlyingAssetCompany}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Shares Per Token</span>
            <span className="text-sm lg:text-base text-black dark:text-[#d2d2d2]">{metadata.sharesPerToken}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
        </div>
      </div>
    </div>
  )
}
