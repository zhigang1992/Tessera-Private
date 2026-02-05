import { useState, useEffect, useCallback, useRef } from 'react'
import { useSlot } from '@/contexts/slot-context'
import type { CountdownConfig, TimeRemaining, CountdownRefreshStrategy } from '@/types/countdown'

const AVERAGE_SLOT_TIME_MS = 400 // Solana average slot time is ~400ms

/**
 * Calculate time remaining from now to target timestamp
 */
function calculateTimeRemaining(targetTimestamp: number): TimeRemaining {
  const now = Date.now()
  const totalSeconds = Math.max(0, Math.floor((targetTimestamp - now) / 1000))
  const isExpired = totalSeconds === 0

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isExpired,
  }
}

/**
 * Estimate target timestamp from slot number
 */
function estimateTimestampFromSlot(targetSlot: number, currentSlot: number, currentTime: number): number {
  const slotsRemaining = Math.max(0, targetSlot - currentSlot)
  const estimatedMs = slotsRemaining * AVERAGE_SLOT_TIME_MS
  return currentTime + estimatedMs
}

/**
 * Determine refresh strategy based on time remaining
 */
function getRefreshStrategy(totalSeconds: number): CountdownRefreshStrategy {
  // More than 3 weeks away - no need to refresh API frequently
  if (totalSeconds > 21 * 24 * 3600) {
    return {
      apiRefreshInterval: Infinity, // Don't refresh
      showSeconds: false,
      renderInterval: 60000, // Re-render every minute
    }
  }

  // More than 1 hour away - refresh API every 10 minutes
  if (totalSeconds > 3600) {
    return {
      apiRefreshInterval: 10 * 60 * 1000, // 10 minutes
      showSeconds: false,
      renderInterval: 60000, // Re-render every minute
    }
  }

  // More than 5 minutes away - refresh API every minute
  if (totalSeconds > 5 * 60) {
    return {
      apiRefreshInterval: 60 * 1000, // 1 minute
      showSeconds: false,
      renderInterval: 60000, // Re-render every minute
    }
  }

  // Within 5 minutes - refresh API every 10 seconds, show seconds
  return {
    apiRefreshInterval: 10 * 1000, // 10 seconds
    showSeconds: true,
    renderInterval: 1000, // Re-render every second
  }
}

/**
 * Smart countdown hook with adaptive refresh rates
 *
 * - For slot-based countdowns: fetches current slot and estimates timestamp
 * - For timestamp-based countdowns: uses local time calculation
 * - Automatically adjusts API refresh frequency based on proximity
 * - Adjusts component re-render frequency for smooth countdown display
 */
export function useCountdown(config: CountdownConfig) {
  const { currentSlot, currentTime, refreshSlot } = useSlot()
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isExpired: true,
  })
  const [strategy, setStrategy] = useState<CountdownRefreshStrategy>({
    apiRefreshInterval: Infinity,
    showSeconds: false,
    renderInterval: 60000,
  })

  const apiRefreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const renderTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate target timestamp based on config type
  const getTargetTimestamp = useCallback((): number | null => {
    if (config.type === 'disabled') {
      return null
    }

    if (config.type === 'timestamp') {
      return config.targetTimestamp
    }

    if (config.type === 'slot') {
      if (currentSlot === null) {
        return null
      }
      return estimateTimestampFromSlot(config.targetSlot, currentSlot, currentTime)
    }

    return null
  }, [config, currentSlot, currentTime])

  // Update time remaining
  const updateTimeRemaining = useCallback(() => {
    const targetTimestamp = getTargetTimestamp()
    if (targetTimestamp === null) {
      setTimeRemaining({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
      })
      return
    }

    const remaining = calculateTimeRemaining(targetTimestamp)
    setTimeRemaining(remaining)

    // Update strategy based on new time remaining
    const newStrategy = getRefreshStrategy(remaining.totalSeconds)
    setStrategy(newStrategy)
  }, [getTargetTimestamp])

  // Set up API refresh timer (for slot-based countdowns)
  useEffect(() => {
    // Clear existing timer
    if (apiRefreshTimerRef.current) {
      clearInterval(apiRefreshTimerRef.current)
      apiRefreshTimerRef.current = null
    }

    // Only set up API refresh for slot-based countdowns
    if (config.type !== 'slot') {
      return
    }

    // Don't set up timer if interval is Infinity
    if (strategy.apiRefreshInterval === Infinity) {
      return
    }

    // Set up new timer
    apiRefreshTimerRef.current = setInterval(() => {
      refreshSlot()
    }, strategy.apiRefreshInterval)

    return () => {
      if (apiRefreshTimerRef.current) {
        clearInterval(apiRefreshTimerRef.current)
      }
    }
  }, [config.type, strategy.apiRefreshInterval, refreshSlot])

  // Set up render timer (updates countdown display)
  useEffect(() => {
    // Clear existing timer
    if (renderTimerRef.current) {
      clearInterval(renderTimerRef.current)
      renderTimerRef.current = null
    }

    // Update immediately
    updateTimeRemaining()

    // Only set up timer if not expired and not disabled
    if (config.type === 'disabled' || timeRemaining.isExpired) {
      return
    }

    // Set up new timer
    renderTimerRef.current = setInterval(() => {
      updateTimeRemaining()
    }, strategy.renderInterval)

    return () => {
      if (renderTimerRef.current) {
        clearInterval(renderTimerRef.current)
      }
    }
  }, [config, strategy.renderInterval, updateTimeRemaining, timeRemaining.isExpired])

  // Update when slot changes (for slot-based countdowns)
  useEffect(() => {
    if (config.type === 'slot') {
      updateTimeRemaining()
    }
  }, [config.type, currentSlot, currentTime, updateTimeRemaining])

  return {
    timeRemaining,
    showSeconds: strategy.showSeconds,
    isDisabled: config.type === 'disabled',
  }
}

/**
 * Format time remaining as string
 * @param timeRemaining Time remaining object
 * @param showSeconds Whether to show seconds
 * @returns Formatted string like "2d 5h 30m" or "2d 5h 30m 15s"
 */
export function formatTimeRemaining(timeRemaining: TimeRemaining, showSeconds: boolean): string {
  const parts: string[] = []

  if (timeRemaining.days > 0) {
    parts.push(`${timeRemaining.days}d`)
  }
  if (timeRemaining.hours > 0 || timeRemaining.days > 0) {
    parts.push(`${timeRemaining.hours}h`)
  }
  if (timeRemaining.minutes > 0 || timeRemaining.hours > 0 || timeRemaining.days > 0) {
    parts.push(`${timeRemaining.minutes}m`)
  }
  if (showSeconds && (timeRemaining.seconds > 0 || parts.length === 0)) {
    parts.push(`${timeRemaining.seconds}s`)
  }

  return parts.length > 0 ? parts.join(' ') : '0m'
}
