/**
 * Live countdown timer for auctions
 */

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { getTimeRemaining } from '../lib/utils'

interface AuctionTimerProps {
  endTime: number
  label?: string
  showIcon?: boolean
  className?: string
}

export function AuctionTimer({ endTime, label, showIcon = true, className = '' }: AuctionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(endTime))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining(endTime))
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  const { days, hours, minutes, seconds, isExpired } = timeRemaining

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        {showIcon && <Clock className="h-4 w-4" />}
        <span>Ended</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <Clock className="h-4 w-4" />}
      <div className="flex items-baseline gap-1">
        {label && <span className="text-sm text-muted-foreground">{label}</span>}
        <div className="flex items-baseline gap-1 font-mono font-semibold">
          {days > 0 && (
            <>
              <span className="text-lg tabular-nums">{days}</span>
              <span className="text-xs text-muted-foreground">d</span>
            </>
          )}
          {(days > 0 || hours > 0) && (
            <>
              <span className="text-lg tabular-nums">{String(hours).padStart(2, '0')}</span>
              <span className="text-xs text-muted-foreground">h</span>
            </>
          )}
          <span className="text-lg tabular-nums">{String(minutes).padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground">m</span>
          <span className="text-lg tabular-nums">{String(seconds).padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground">s</span>
        </div>
      </div>
    </div>
  )
}
