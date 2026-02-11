import { useCountdown, formatTimeRemaining } from '@/hooks/use-countdown'
import type { CountdownConfig } from '@/types/countdown'
import type { ReactNode } from 'react'

interface CountdownNotificationProps {
  config: CountdownConfig
  /** The content to display before the countdown. This should be the full message. */
  title: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Reusable countdown notification component
 * Displays a semi-transparent notification box with countdown timer
 * Matches the design from Tessera_makeversion
 */
export function CountdownNotification({ config, title, className = '' }: CountdownNotificationProps) {
  const { timeRemaining, showSeconds, isDisabled } = useCountdown(config)

  // Don't render if disabled or already started
  if (isDisabled || timeRemaining.isExpired) {
    return null
  }

  const formattedTime = formatTimeRemaining(timeRemaining, showSeconds)

  return (
    <div className={`bg-[rgba(255,255,255,0.5)] rounded-lg px-6 py-4 w-full ${className}`}>
      <div className="flex items-center justify-center w-full">
        <p className="font-normal text-xs leading-4 text-center text-black">
          {title} <span className="font-semibold">{formattedTime}</span>
        </p>
      </div>
    </div>
  )
}
