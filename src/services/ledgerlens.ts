// ============ Types ============

export interface ReserveData {
  asset: string
  reserve: string
  tokens: string
  chainlink: string
  timestamp: string
}

interface ReservesResponse {
  reserves: ReserveData[]
}

// ============ API Functions ============

/**
 * Get all reserve data for the Transparency page
 * Fetches from Cloudflare Worker endpoint which handles caching
 * Returns an array of reserve data for SpaceX and Kalshi
 */
export async function getAllReserveData(): Promise<ReserveData[]> {
  try {
    const response = await fetch('/api/ledgerlens/reserves', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`[ledgerlens] Failed to fetch reserve data: ${response.status}`)
      return []
    }

    const data: ReservesResponse = await response.json()
    return data.reserves
  } catch (error) {
    console.error('[ledgerlens] Error fetching reserve data:', error)
    return []
  }
}
