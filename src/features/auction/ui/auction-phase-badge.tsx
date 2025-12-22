/**
 * Badge component displaying auction phase
 */

import { AuctionPhase } from '../types/auction'
import { getPhaseDisplay } from '../lib/utils'

interface AuctionPhaseBadgeProps {
  phase: AuctionPhase
  showDescription?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function AuctionPhaseBadge({ phase, showDescription = false, size = 'md' }: AuctionPhaseBadgeProps) {
  const { label, colorClass, description } = getPhaseDisplay(phase)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClasses[size]}`}>
        {label}
      </span>
      {showDescription && <span className="text-xs text-muted-foreground">{description}</span>}
    </div>
  )
}
