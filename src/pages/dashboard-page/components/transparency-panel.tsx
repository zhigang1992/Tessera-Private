import { useState } from 'react'
import { getTransparencyData } from '@/services'
import { useQuery } from '@tanstack/react-query'

// Check circle icon component (outline style matching Figma)
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 1.33333C4.32 1.33333 1.33333 4.32 1.33333 8C1.33333 11.68 4.32 14.6667 8 14.6667C11.68 14.6667 14.6667 11.68 14.6667 8C14.6667 4.32 11.68 1.33333 8 1.33333ZM8 13.3333C5.06 13.3333 2.66667 10.94 2.66667 8C2.66667 5.06 5.06 2.66667 8 2.66667C10.94 2.66667 13.3333 5.06 13.3333 8C13.3333 10.94 10.94 13.3333 8 13.3333ZM11.06 5.05333L6.66667 9.44667L4.94 7.72667L4 8.66667L6.66667 11.3333L12 6L11.06 5.05333Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function TransparencyPanel() {
  const [showAll, setShowAll] = useState(false)

  const { data: transparencyData } = useQuery({
    queryKey: ['transparencyData'],
    queryFn: getTransparencyData,
  })

  const proofOfReserves = transparencyData?.proofOfReserves
  const allVerifications = proofOfReserves?.verifications || []
  const displayedVerifications = showAll ? allVerifications : allVerifications.slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      {/* Proof of Reserves Panel - Full Width */}
      <div className="w-full bg-white dark:bg-[#1a1a1b] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] rounded-2xl">
        <div className="p-4 md:p-6">
          <div className="flex flex-col gap-4 md:gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-lg font-normal text-black dark:text-[#d2d2d2] leading-7">
                  Proof of Reserves
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col">
              <div className="flex flex-col gap-2 md:gap-2">
                {/* Table - with horizontal scroll on mobile */}
                <div className="flex flex-col gap-2.5 overflow-x-auto">
                  {/* Table Header */}
                  <div className="min-w-[400px]">
                    <div className="flex items-center gap-2.5 px-2.5 py-0">
                      <div className="flex-1">
                        <p className="text-xs font-normal text-[#71717a] leading-4 whitespace-nowrap">
                          Auditor
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-normal text-[#71717a] leading-4 whitespace-nowrap">
                          Fully Collateralized
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-normal text-[#71717a] leading-4 whitespace-nowrap">
                          Link
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="min-w-[400px]">
                    <div className="h-px w-full bg-[rgba(17,17,17,0.15)] dark:bg-[rgba(210,210,210,0.1)]" />
                  </div>

                  {/* Table Rows */}
                  <div className="flex flex-col gap-1.5 min-w-[400px]">
                    {displayedVerifications.map((verification) => (
                      <div
                        key={verification.auditor}
                        className="bg-[#EEFFD3] dark:bg-[rgba(210,251,149,0.1)]"
                      >
                        <div className="flex items-center gap-2.5 p-2.5">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-[#404040] dark:text-[#d2d2d2] leading-5 whitespace-nowrap">
                              {verification.auditor}
                            </p>
                          </div>
                          <div className="flex-1 flex items-center gap-1.5">
                            <CheckCircleIcon className="w-4 h-4 text-black dark:text-[#d2d2d2]" />
                            <p className="text-sm font-normal text-black dark:text-[#d2d2d2] leading-5 whitespace-nowrap">
                              Yes
                            </p>
                          </div>
                          <div className="flex-1 flex items-center gap-1.5">
                            <CheckCircleIcon className="w-4 h-4 text-black dark:text-[#d2d2d2]" />
                            <a
                              href="https://www.google.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-normal text-[#06a800] dark:text-[#AAD36D] leading-5 whitespace-nowrap hover:underline cursor-pointer"
                            >
                              Reports
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* See All / Show Less */}
                {allVerifications.length > 3 && (
                  <div className="flex items-center justify-center px-0 py-1.5">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="text-xs font-normal text-black dark:text-[#d2d2d2] leading-4 whitespace-nowrap hover:opacity-70 transition-opacity cursor-pointer"
                    >
                      {showAll ? 'Show less' : 'See all'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
