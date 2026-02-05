import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'

interface SlotContextValue {
  currentSlot: number | null
  currentTime: number
  isLoading: boolean
  error: string | null
  refreshSlot: () => Promise<void>
}

const SlotContext = createContext<SlotContextValue | undefined>(undefined)

const SLOT_POLL_INTERVAL = 30000 // Poll every 30 seconds by default

export function SlotProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection()
  const [currentSlot, setCurrentSlot] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(Date.now())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const refreshSlot = useCallback(async () => {
    try {
      setError(null)
      const slot = await connection.getSlot('confirmed')
      setCurrentSlot(slot)
      setCurrentTime(Date.now())
      setIsLoading(false)
    } catch (err) {
      console.error('Failed to fetch current slot:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch slot')
      setIsLoading(false)
    }
  }, [connection])

  // Initial fetch
  useEffect(() => {
    refreshSlot()
  }, [refreshSlot])

  // Set up polling
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refreshSlot()
    }, SLOT_POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [refreshSlot])

  return (
    <SlotContext.Provider
      value={{
        currentSlot,
        currentTime,
        isLoading,
        error,
        refreshSlot,
      }}
    >
      {children}
    </SlotContext.Provider>
  )
}

export function useSlot() {
  const context = useContext(SlotContext)
  if (context === undefined) {
    throw new Error('useSlot must be used within a SlotProvider')
  }
  return context
}
