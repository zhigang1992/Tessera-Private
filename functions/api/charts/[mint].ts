import type { PagesFunction } from '@cloudflare/workers-types'

type Env = {}

const JUP_CHART_BASE = 'https://datapi.jup.ag/v2/charts'

const VALID_INTERVALS = new Set([
  '15_MINUTE',
  '1_HOUR',
  '4_HOUR',
  '1_DAY',
  '1_WEEK',
])

const CACHE_TTL_BY_INTERVAL: Record<string, number> = {
  '15_MINUTE': 60,
  '1_HOUR': 300,
  '4_HOUR': 900,
  '1_DAY': 1800,
  '1_WEEK': 3600,
}

export const onRequestGet: PagesFunction<Env, 'mint'> = async ({ params, request }) => {
  const mint = params.mint as string
  if (!mint || !/^[A-Za-z0-9]{32,44}$/.test(mint)) {
    return Response.json({ error: 'Invalid mint address' }, { status: 400 })
  }

  const url = new URL(request.url)
  const interval = url.searchParams.get('interval') ?? '1_HOUR'
  const candles = url.searchParams.get('candles') ?? '148'
  const type = url.searchParams.get('type') ?? 'price'
  const quote = url.searchParams.get('quote') ?? 'usd'

  if (!VALID_INTERVALS.has(interval)) {
    return Response.json(
      { error: `Invalid interval. Must be one of: ${[...VALID_INTERVALS].join(', ')}` },
      { status: 400 }
    )
  }

  const candleCount = Math.min(Math.max(parseInt(candles, 10) || 148, 1), 500)
  const to = url.searchParams.get('to') ?? String(Date.now())

  const jupUrl = new URL(`${JUP_CHART_BASE}/${mint}`)
  jupUrl.searchParams.set('interval', interval)
  jupUrl.searchParams.set('candles', String(candleCount))
  jupUrl.searchParams.set('type', type)
  jupUrl.searchParams.set('quote', quote)
  jupUrl.searchParams.set('to', to)

  try {
    const response = await fetch(jupUrl.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Tessera/1.0',
      },
    })

    if (!response.ok) {
      console.error(`[charts] Jupiter API error: ${response.status}`)
      return Response.json(
        { error: 'Failed to fetch chart data' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const cacheTtl = CACHE_TTL_BY_INTERVAL[interval] ?? 300

    return Response.json(data, {
      status: 200,
      headers: {
        'Cache-Control': `public, max-age=${cacheTtl}, s-maxage=${cacheTtl}`,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[charts] Proxy error:', error)
    return Response.json({ error: 'Internal proxy error' }, { status: 502 })
  }
}
