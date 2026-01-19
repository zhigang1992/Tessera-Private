/**
 * Alpha Vault Helper Functions
 *
 * Utility functions for working with the Alpha Vault SDK
 */

/**
 * Estimate a date/time from a target slot
 * Uses average slot time of 400ms
 */
export function estimateSlotDate(currentSlot: number, targetSlot: number): Date | null {
  if (targetSlot <= 0) return null

  const slotDiff = targetSlot - currentSlot
  const msDiff = slotDiff * 400 // ~400ms per slot

  return new Date(Date.now() + msDiff)
}

/**
 * Format a duration from milliseconds to human readable
 */
export function formatDuration(ms: number): string {
  if (ms < 0) return '0s'

  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((ms % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

/**
 * Calculate time remaining from now to a target date
 */
export function getTimeRemaining(targetDate: Date | null): {
  hours: number
  minutes: number
  seconds: number
  total: number
} | null {
  if (!targetDate) return null

  const now = Date.now()
  const target = targetDate.getTime()
  const diff = target - now

  if (diff <= 0) return null

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { hours, minutes, seconds, total: diff }
}

/**
 * Format date for display
 */
export function formatDate(date: Date | null): string {
  if (!date) return '-'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
