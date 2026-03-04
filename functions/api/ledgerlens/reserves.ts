import type { PagesFunction } from '@cloudflare/workers-types'

type Env = {
  // Add any bindings if needed
}

interface LedgerLensResponse {
  totalReserve: string
  totalToken: string
  ripcord: boolean
  ripcordDetails: unknown[]
  timestamp: string
}

interface ReserveData {
  asset: string
  reserve: string
  tokens: string
  chainlink: string
  timestamp: string
}

const LEDGERLENS_API_BASE = 'https://api.ledgerlens.io/oc/v1'

// Hardcoded API keys (as requested)
const SPACEX_API_KEY = 'api__XRKRMLqwKtqKg8aAIFIFb43iuTIyR9V'
const KALSHI_API_KEY = 'api_UDzO3__3E47tY_bKTdxzQJ7V0VPVfWh2'

const ENDPOINTS = {
  spacex: `${LEDGERLENS_API_BASE}/tessera-spacex-7pjyun`,
  kalshi: `${LEDGERLENS_API_BASE}/tessera-kalshi-igqwgj`,
}

async function fetchLedgerLensData(
  endpoint: string,
  apiKey: string
): Promise<LedgerLensResponse | null> {
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`[ledgerlens] Failed to fetch data from ${endpoint}: ${response.status}`)
      const text = await response.text()
      console.error(`[ledgerlens] Response text:`, text.substring(0, 200))
      return null
    }

    const data = await response.json<LedgerLensResponse>()
    return data
  } catch (error) {
    console.error(`[ledgerlens] Error fetching data from ${endpoint}:`, error)
    return null
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  // Fetch both SpaceX and Kalshi data in parallel
  const [spacexData, kalshiData] = await Promise.all([
    fetchLedgerLensData(ENDPOINTS.spacex, SPACEX_API_KEY),
    fetchLedgerLensData(ENDPOINTS.kalshi, KALSHI_API_KEY),
  ])

  const results: ReserveData[] = []

  if (spacexData) {
    results.push({
      asset: 'SpaceX',
      reserve: spacexData.totalReserve,
      tokens: spacexData.totalToken,
      chainlink: 'TBA',
      timestamp: spacexData.timestamp,
    })
  }

  if (kalshiData) {
    results.push({
      asset: 'Kalshi',
      reserve: kalshiData.totalReserve,
      tokens: kalshiData.totalToken,
      chainlink: 'TBA',
      timestamp: kalshiData.timestamp,
    })
  }

  // Return with cache headers
  return Response.json(
    { reserves: results },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'Content-Type': 'application/json',
      },
    }
  )
}
