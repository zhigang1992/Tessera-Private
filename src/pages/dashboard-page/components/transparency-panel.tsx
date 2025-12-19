import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTransparencyData } from '@/services'

// Arrow outward icon component
function ArrowOutwardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.66667 11.3333L11.3333 4.66667M11.3333 4.66667H4.66667M11.3333 4.66667V11.3333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Check circle icon component (outline style)
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 8L7 9.5L10.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type YearFilter = 'all' | 2025 | 2024

export function TransparencyPanel() {
  const [yearFilter, setYearFilter] = useState<YearFilter>('all')

  const { data: transparencyData } = useQuery({
    queryKey: ['transparencyData'],
    queryFn: getTransparencyData,
  })

  const attestations = transparencyData?.attestations ?? []
  const proofOfReserves = transparencyData?.proofOfReserves
  const thirdPartyLinks = transparencyData?.thirdPartyLinks ?? []

  // Filter attestations by year
  const filteredAttestations =
    yearFilter === 'all' ? attestations : attestations.filter((a) => a.year === yearFilter)

  // Group attestations into pairs for grid display
  const attestationPairs: Array<(typeof attestations)[0][]> = []
  for (let i = 0; i < filteredAttestations.length; i += 2) {
    attestationPairs.push(filteredAttestations.slice(i, i + 2))
  }

  // Group third party links into pairs
  const linkPairs: Array<(typeof thirdPartyLinks)[0][]> = []
  for (let i = 0; i < thirdPartyLinks.length; i += 2) {
    linkPairs.push(thirdPartyLinks.slice(i, i + 2))
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Top Row - Two Panels Side by Side */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Custodian Attestations Panel */}
        <div className="flex-1 bg-white rounded-2xl p-4 lg:p-6">
          <div className="flex flex-col gap-4 lg:gap-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-normal text-black">Custodian Attestations</h3>
                <p className="text-xs text-zinc-500">Last Updated: {transparencyData?.lastUpdated}</p>
              </div>
              {/* Year Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-zinc-200 rounded-lg w-fit">
                {(['all', 2025, 2024] as YearFilter[]).map((year) => (
                  <button
                    key={year}
                    onClick={() => setYearFilter(year)}
                    className={`px-4 lg:px-6 py-1 text-xs font-medium rounded transition-all ${
                      yearFilter === year
                        ? 'bg-white text-black shadow-sm'
                        : 'text-black hover:bg-white/50'
                    }`}
                  >
                    {year === 'all' ? 'All' : year}
                  </button>
                ))}
              </div>
            </div>

            {/* Attestation Links Grid */}
            <div className="flex flex-col gap-2">
              {attestationPairs.map((pair, index) => (
                <div key={index} className="flex gap-2">
                  {pair.map((attestation) => (
                    <a
                      key={attestation.id}
                      href={attestation.url}
                      className="flex-1 flex items-center justify-between p-2 bg-[#f0ffda] rounded text-xs text-black hover:bg-[#e5f5cc] transition-colors"
                    >
                      <span>
                        {attestation.month} {attestation.year}
                      </span>
                      <ArrowOutwardIcon className="w-4 h-4" />
                    </a>
                  ))}
                  {pair.length === 1 && <div className="flex-1" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Proof of Reserves Panel */}
        <div className="flex-1 bg-white rounded-2xl p-4 lg:p-6">
          <div className="flex flex-col gap-4 lg:gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-normal text-black">Proof of Reserves</h3>
                <p className="text-xs text-zinc-500">Last Updated: {proofOfReserves?.lastUpdated}</p>
              </div>
              <button className="text-xs text-[#06a800] hover:underline">Learn More</button>
            </div>

            {/* Verification Table */}
            <div className="flex flex-col gap-1.5">
              {/* Date Header */}
              <div className="py-1.5">
                <span className="text-sm font-semibold text-black">{proofOfReserves?.date}</span>
              </div>
              <div className="h-px bg-black/15" />

              {/* Table Header */}
              <div className="flex items-center gap-2.5 px-2.5 py-1 text-xs text-zinc-500">
                <div className="flex-1">Auditor</div>
                <div className="flex-1">Overcollateralized</div>
                <div className="flex-1">Delta-Neutral</div>
              </div>
              <div className="px-2.5">
                <div className="h-px bg-black/15" />
              </div>

              {/* Table Rows */}
              <div className="flex flex-col gap-1">
                {proofOfReserves?.verifications.map((verification, index) => (
                  <div
                    key={verification.auditor}
                    className={`flex items-center gap-2.5 p-2.5 rounded ${
                      index % 2 === 0 ? 'bg-zinc-50' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-[#404040]">
                        {verification.auditor}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center gap-1.5">
                      <CheckCircleIcon className="w-4 h-4 text-black" />
                      <span className="text-sm text-black">
                        {verification.overcollateralized ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center gap-1.5">
                      <CheckCircleIcon className="w-4 h-4 text-black" />
                      <span className="text-sm text-black">
                        {verification.deltaNeutral ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* See All Link */}
              <div className="flex justify-center py-1.5">
                <button className="text-xs text-[#06a800] hover:underline">See All</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Party Data Links Panel */}
      <div className="bg-white rounded-2xl p-4 lg:p-6">
        <div className="flex flex-col gap-4 lg:gap-6">
          {/* Header */}
          <h3 className="text-lg font-normal text-black">Independent Third Party Data Links</h3>

          {/* Links Grid */}
          <div className="flex flex-col gap-2">
            {linkPairs.map((pair, index) => (
              <div key={index} className="flex gap-2">
                {pair.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    className="flex-1 flex items-center justify-between p-2 bg-[#f0ffda] rounded text-xs text-black hover:bg-[#e5f5cc] transition-colors"
                  >
                    <span>{link.name}</span>
                    <ArrowOutwardIcon className="w-4 h-4" />
                  </a>
                ))}
                {pair.length === 1 && <div className="flex-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
