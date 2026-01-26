import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardTokenInfo } from '@/services'
import SolanaIcon from './_/solana-icon.svg?react'

export function AboutPanel() {
  const [showMore, setShowMore] = useState(false)

  const { data: tokenInfo } = useQuery({
    queryKey: ['dashboardTokenInfo'],
    queryFn: getDashboardTokenInfo,
  })

  const description = tokenInfo?.description ?? ''
  const displayDescription = showMore ? description : description

  return (
    <div className="bg-white dark:bg-[#323334] border border-black/15 dark:border-[rgba(210,210,210,0.1)] rounded-2xl p-4 lg:p-6">
      <h2 className="text-sm lg:text-base font-semibold text-black dark:text-[#d2d2d2] mb-4 lg:mb-6">About</h2>

      {/* Description */}
      <p className="text-sm text-black dark:text-[#d2d2d2] leading-5 mb-6">
        {displayDescription}{' '}
        <button
          onClick={() => setShowMore(!showMore)}
          className="text-[#06a800] dark:text-[#d2fb95] hover:underline"
        >
          {showMore ? 'Show Less' : 'Show More'}
        </button>
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
              {tokenInfo?.categories.map((category) => (
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
            <span className="text-sm lg:text-base text-black dark:text-[#d2d2d2]">{tokenInfo?.underlyingAssetName ?? '-'}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Underlying Asset Company</span>
            <span className="text-sm lg:text-base text-black dark:text-[#d2d2d2]">{tokenInfo?.underlyingAssetCompany ?? '-'}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs lg:text-sm text-[#999]">Shares Per Token</span>
            <span className="text-sm lg:text-base text-black dark:text-[#d2d2d2]">{tokenInfo?.sharesPerToken ?? '-'}</span>
          </div>
          <div className="border-t border-black/15 dark:border-[#d2d2d2]/15" />
        </div>
      </div>
    </div>
  )
}
