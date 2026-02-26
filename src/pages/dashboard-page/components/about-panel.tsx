import { AppTokenId, DEFAULT_BASE_TOKEN_ID, getAppToken, getExplorerUrl } from '@/config'
import { toast } from 'sonner'
import SolanaIcon from './_/solana-icon.svg?react'

/**
 * Format mint address for display (e.g., "TSPXcL...Pd99v")
 */
function formatMintAddress(address: string): string {
  if (address.length < 12) return address
  return `${address.slice(0, 6)}...${address.slice(-5)}`
}

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
    sharesPerToken: '1:1'
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
  const token = getAppToken(tokenId)
  const metadata = TOKEN_METADATA[tokenId]
  const description = metadata.description
  const onchainAddress = formatMintAddress(token.mint)
  const explorerUrl = getExplorerUrl(token.mint, 'address')

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
              <SolanaIcon className="w-5 h-5" />
              <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">Solana</span>
            </div>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Onchain Address</span>
            <div className="flex items-center gap-1.5">
              <SolanaIcon className="w-5 h-5" />
              <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{onchainAddress}</span>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(token.mint).then(() => {
                    toast.success('Address copied to clipboard!')
                  })
                }}
                className="hover:opacity-70 transition-opacity"
                title="Copy address"
              >
                <svg
                  className="w-4 h-4 text-black dark:text-[#d2d2d2]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity"
                title="View on explorer"
              >
                <svg
                  className="w-4 h-4 text-black dark:text-[#d2d2d2]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
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
            <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{metadata.underlyingAssetName}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Underlying Asset Company</span>
            <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{metadata.underlyingAssetCompany}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Shares Per Token</span>
            <span className="text-xs lg:text-sm text-black dark:text-[#d2d2d2]">{metadata.sharesPerToken}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
        </div>
      </div>
    </div>
  )
}
