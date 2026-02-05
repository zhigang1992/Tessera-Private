/**
 * Countdown configuration types
 * Supports both slot-based (block number) and timestamp-based countdowns
 */

export type CountdownConfig =
  | {
      type: 'slot'
      targetSlot: number
    }
  | {
      type: 'timestamp'
      targetTimestamp: number
    }
  | {
      type: 'disabled'
    }

export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  isExpired: boolean
}

export interface CountdownRefreshStrategy {
  /** How often to refresh API (in ms) based on time remaining */
  apiRefreshInterval: number
  /** Whether to show seconds in the countdown display */
  showSeconds: boolean
  /** How often to re-render the component (in ms) */
  renderInterval: number
}
