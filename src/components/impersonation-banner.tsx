/**
 * Development banner that shows when address impersonation is active
 * Only visible when PRODUCTION_MODE is false and ?asSolanaAddress= is in URL
 */

import { getImpersonationInfo } from '@/lib/impersonation'

export function ImpersonationBanner() {
  const info = getImpersonationInfo()

  if (!info) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black px-4 py-2 text-center text-sm font-medium shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <span className="font-bold">🎭 IMPERSONATING:</span>
        <code className="bg-black/20 px-2 py-0.5 rounded font-mono">
          {info.truncated}
        </code>
        <span className="text-xs opacity-75">({info.address})</span>
        <a
          href={window.location.pathname}
          className="ml-4 underline hover:no-underline"
        >
          Stop Impersonating
        </a>
      </div>
    </div>
  )
}
