import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface ReferralImagePreviewProps {
  imageUrl: string
  codeSlug: string
}

export function ReferralImagePreview({ imageUrl, codeSlug }: ReferralImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E4E4E7] bg-[#F4F4F5] dark:border-[#27272A] dark:bg-[#111111]">
      {/* Aspect ratio container - always visible to maintain layout */}
      <div className="relative w-full" style={{ aspectRatio: '800/450' }}>
        {/* Loading state */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F4F4F5] dark:bg-[#111111]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-black/20 dark:text-white/20" />
              <p className="text-sm text-black/50 dark:text-white/50">Generating image...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F4F4F5] dark:bg-[#111111]">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-sm text-black/50 dark:text-white/50">Failed to load image</p>
            </div>
          </div>
        )}

        {/* The actual image */}
        <img
          src={imageUrl}
          alt={`Referral share card for ${codeSlug}`}
          className="h-full w-full object-cover"
          style={{ display: isLoading || hasError ? 'none' : 'block' }}
          onLoadStart={() => {
            setIsLoading(true)
            setHasError(false)
          }}
          onLoad={() => {
            setIsLoading(false)
            setHasError(false)
          }}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
        />
      </div>
    </div>
  )
}
