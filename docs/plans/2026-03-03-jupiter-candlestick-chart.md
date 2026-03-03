# Jupiter Candlestick Chart Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current line chart with a full OHLCV candlestick chart powered by Jupiter's datapi API, proxied through a Cloudflare Pages Function with dynamic caching.

**Architecture:** A new Pages Function at `/api/charts/[mint]` proxies requests to `datapi.jup.ag/v2/charts/`, applying interval-based cache TTLs via `Cache-Control` headers. The frontend switches from `LineSeries` to `CandlestickSeries` + `HistogramSeries` (volume), fetching candle data from the proxy. The time range selector changes from date ranges (1D/1W/1M) to interval labels (15M/1H/4H/1D/1W).

**Tech Stack:** Cloudflare Pages Functions, lightweight-charts v5 (CandlestickSeries, HistogramSeries), React Query, TypeScript

---

### Task 1: Create Jupiter chart proxy Pages Function

**Files:**
- Create: `functions/api/charts/[mint].ts`

**Step 1: Create the proxy function**

```typescript
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

  const jupUrl = new URL(`${JUP_CHART_BASE}/${mint}`)
  jupUrl.searchParams.set('interval', interval)
  jupUrl.searchParams.set('candles', String(candleCount))
  jupUrl.searchParams.set('type', type)
  jupUrl.searchParams.set('quote', quote)

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
```

**Step 2: Verify the function compiles**

Run: `npx tsc --noEmit functions/api/charts/\\[mint\\].ts 2>&1 || echo "check manually"`
If TypeScript errors, fix them. The function follows the same pattern as `functions/api/ledgerlens/reserves.ts`.

**Step 3: Commit**

```bash
git add functions/api/charts/\[mint\].ts
git commit -m "feat: add Jupiter chart proxy endpoint with dynamic caching"
```

---

### Task 2: Create frontend chart service for Jupiter candles

**Files:**
- Create: `src/services/jupiter-chart.ts`

**Step 1: Create the service module**

```typescript
export type ChartInterval = '15M' | '1H' | '4H' | '1D' | '1W'

export interface JupiterCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface JupiterChartResponse {
  candles: JupiterCandle[]
}

const INTERVAL_MAP: Record<ChartInterval, string> = {
  '15M': '15_MINUTE',
  '1H': '1_HOUR',
  '4H': '4_HOUR',
  '1D': '1_DAY',
  '1W': '1_WEEK',
}

const CANDLE_COUNTS: Record<ChartInterval, number> = {
  '15M': 96,
  '1H': 168,
  '4H': 180,
  '1D': 365,
  '1W': 200,
}

const REFETCH_INTERVALS: Record<ChartInterval, number> = {
  '15M': 60_000,
  '1H': 5 * 60_000,
  '4H': 15 * 60_000,
  '1D': 30 * 60_000,
  '1W': 60 * 60_000,
}

export function getRefetchInterval(interval: ChartInterval): number {
  return REFETCH_INTERVALS[interval]
}

export async function fetchJupiterCandles(
  mint: string,
  interval: ChartInterval
): Promise<JupiterCandle[]> {
  const jupInterval = INTERVAL_MAP[interval]
  const candles = CANDLE_COUNTS[interval]

  const url = `/api/charts/${mint}?interval=${jupInterval}&candles=${candles}&type=price&quote=usd`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Chart API error: ${response.status}`)
  }

  const data: JupiterChartResponse = await response.json()
  return data.candles ?? []
}
```

**Step 2: Commit**

```bash
git add src/services/jupiter-chart.ts
git commit -m "feat: add Jupiter chart service with interval config"
```

---

### Task 3: Update PriceChart to use candlestick chart with volume

**Files:**
- Modify: `src/pages/trade-page/components/price-chart.tsx`

This is the main change. Replace the entire chart section to use `CandlestickSeries` and `HistogramSeries` from lightweight-charts, fetching from the new Jupiter proxy.

**Step 1: Update imports and types**

Replace these imports at the top of `price-chart.tsx`:

Old:
```typescript
import { createChart, ColorType, LineSeries } from 'lightweight-charts'
import type { IChartApi, LineData, Time } from 'lightweight-charts'
```

New:
```typescript
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
import type { IChartApi, CandlestickData, HistogramData, Time } from 'lightweight-charts'
```

Replace the import of `getPriceHistory` and `TimeRange`:

Old:
```typescript
import { getPriceHistory, getTokenPrice, type TimeRange } from '@/services/price'
```

New:
```typescript
import { getTokenPrice } from '@/services/price'
import { fetchJupiterCandles, getRefetchInterval, type ChartInterval } from '@/services/jupiter-chart'
```

**Step 2: Update state and data fetching**

Replace `timeRange` state:

Old:
```typescript
const [timeRange, setTimeRange] = useState<TimeRange>('1D')
```

New:
```typescript
const [chartInterval, setChartInterval] = useState<ChartInterval>('1H')
```

Add a second series ref for volume:

Old:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const seriesRef = useRef<any>(null)
```

New:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const candleSeriesRef = useRef<any>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const volumeSeriesRef = useRef<any>(null)
```

Replace `priceHistory` query:

Old:
```typescript
const { data: priceHistory } = useQuery({
  queryKey: ['priceHistory', effectiveTokenSymbol, timeRange],
  queryFn: () => getPriceHistory(effectiveTokenSymbol, timeRange),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  enabled: !disabled,
})
```

New:
```typescript
const { data: jupiterCandles } = useQuery({
  queryKey: ['jupiterCandles', tokenConfig.mint, chartInterval],
  queryFn: () => fetchJupiterCandles(tokenConfig.mint, chartInterval),
  refetchInterval: getRefetchInterval(chartInterval),
  staleTime: getRefetchInterval(chartInterval) / 2,
  gcTime: 10 * 60 * 1000,
  enabled: !disabled,
})
```

**Step 3: Update chart initialization**

Replace the chart creation `useEffect`. Change height from 180 to 300, enable scroll/scale, and use `CandlestickSeries` + `HistogramSeries`:

Old chart init (lines ~127-200):
```typescript
useEffect(() => {
  if (!chartContainerRef.current) return
  const chart = createChart(chartContainerRef.current, {
    ...
    height: 180,
    handleScroll: false,
    handleScale: false,
    ...
  })
  const lineSeries = chart.addSeries(LineSeries, { ... })
  chartRef.current = chart
  seriesRef.current = lineSeries
  ...
}, [])
```

New:
```typescript
useEffect(() => {
  if (!chartContainerRef.current) return

  const chart = createChart(chartContainerRef.current, {
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: '#000',
      fontFamily: 'Inter, sans-serif',
      attributionLogo: false,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: {
        color: 'rgba(0, 0, 0, 0.1)',
        style: 2,
        visible: true,
      },
    },
    width: chartContainerRef.current.clientWidth,
    height: 300,
    rightPriceScale: {
      borderVisible: false,
      scaleMargins: { top: 0.1, bottom: 0.25 },
    },
    timeScale: {
      borderVisible: false,
      timeVisible: true,
      secondsVisible: false,
    },
    handleScroll: true,
    handleScale: true,
    crosshair: {
      mode: 1,
      vertLine: {
        visible: true,
        color: 'rgba(0, 0, 0, 0.35)',
        width: 1,
        style: 2,
        labelVisible: true,
      },
      horzLine: {
        visible: true,
        color: 'rgba(0, 0, 0, 0.35)',
        width: 1,
        style: 2,
        labelVisible: true,
      },
    },
  })

  const candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#1D8F00',
    downColor: '#ef4444',
    borderDownColor: '#ef4444',
    borderUpColor: '#1D8F00',
    wickDownColor: '#ef4444',
    wickUpColor: '#1D8F00',
    priceLineVisible: false,
    lastValueVisible: false,
  })

  const volumeSeries = chart.addSeries(HistogramSeries, {
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume',
    lastValueVisible: false,
    priceLineVisible: false,
  })

  chart.priceScale('volume').applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 },
    drawTicks: false,
    borderVisible: false,
    visible: false,
  })

  chartRef.current = chart
  candleSeriesRef.current = candleSeries
  volumeSeriesRef.current = volumeSeries

  const handleResize = () => {
    if (chartContainerRef.current && chartRef.current) {
      chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
    }
  }

  window.addEventListener('resize', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)
    chart.remove()
  }
}, [])
```

**Step 4: Update data binding effect**

Old:
```typescript
useEffect(() => {
  if (seriesRef.current && priceHistory) {
    const chartData: LineData<Time>[] = priceHistory.map((point) => ({
      time: toLocalTimestamp(point.time) as Time,
      value: point.value,
    }))
    seriesRef.current.setData(chartData)
  }
}, [priceHistory])
```

New:
```typescript
useEffect(() => {
  if (!jupiterCandles || !candleSeriesRef.current || !volumeSeriesRef.current) return

  const candleData: CandlestickData<Time>[] = jupiterCandles.map((c) => ({
    time: toLocalTimestamp(c.time) as Time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }))

  const volumeData: HistogramData<Time>[] = jupiterCandles.map((c) => ({
    time: toLocalTimestamp(c.time) as Time,
    value: c.volume,
    color: c.close >= c.open ? 'rgba(29, 143, 0, 0.3)' : 'rgba(239, 68, 68, 0.3)',
  }))

  candleSeriesRef.current.setData(candleData)
  volumeSeriesRef.current.setData(volumeData)

  if (chartRef.current) {
    chartRef.current.timeScale().fitContent()
  }
}, [jupiterCandles])
```

**Step 5: Update time range selector in JSX**

Old (lines ~295-309):
```tsx
<div className="flex items-center p-1 rounded-lg bg-[rgba(0,0,0,0.1)]">
  {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
    <button
      key={range}
      onClick={() => setTimeRange(range)}
      className={`basis-0 grow flex items-center justify-center h-6 rounded text-xs font-medium transition-all ${
        timeRange === range
          ? 'bg-white text-black shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]'
          : 'text-black opacity-50 hover:bg-[rgba(255,255,255,0.3)]'
      }`}
    >
      {range}
    </button>
  ))}
</div>
```

New:
```tsx
<div className="flex items-center p-1 rounded-lg bg-[rgba(0,0,0,0.1)]">
  {(['15M', '1H', '4H', '1D', '1W'] as ChartInterval[]).map((interval) => (
    <button
      key={interval}
      onClick={() => setChartInterval(interval)}
      className={`basis-0 grow flex items-center justify-center h-6 rounded text-xs font-medium transition-all ${
        chartInterval === interval
          ? 'bg-white text-black shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]'
          : 'text-black opacity-50 hover:bg-[rgba(255,255,255,0.3)]'
      }`}
    >
      {interval}
    </button>
  ))}
</div>
```

**Step 6: Verify the app compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 7: Commit**

```bash
git add src/pages/trade-page/components/price-chart.tsx
git commit -m "feat: upgrade chart to candlestick with volume from Jupiter API"
```

---

### Task 4: Clean up unused price service code

**Files:**
- Modify: `src/services/price.ts`

**Step 1: Remove unused exports**

The following are no longer used by the chart (but `getTokenPrice` is still used for the price header):
- `PriceDataPoint` type
- `PriceCandlePoint` type
- `TimeRange` type
- `getPriceCandles` function
- `getPriceHistory` function
- `getDaysForRange` helper
- `getUsesHourlyData` helper

Check for other usages first:

Run: `grep -r "getPriceHistory\|getPriceCandles\|TimeRange\|PriceDataPoint\|PriceCandlePoint" src/ --include='*.ts' --include='*.tsx' -l`

If only `price.ts` and `price-chart.tsx` reference them, remove them from `price.ts`.

**Step 2: Commit**

```bash
git add src/services/price.ts
git commit -m "refactor: remove unused price history exports"
```

---

### Task 5: Verify end-to-end

**Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 2: Run lint**

Run: `npx eslint src/pages/trade-page/components/price-chart.tsx src/services/jupiter-chart.ts`
Expected: No errors (or only pre-existing warnings).

**Step 3: Run dev server and test manually**

Run: `npm run dev`
Verify:
- Chart loads with candlesticks (green up, red down)
- Volume bars appear at the bottom (translucent)
- Interval selector shows: 15M | 1H | 4H | 1D | 1W
- Switching intervals updates the chart
- Scroll and zoom work on the chart
- Market depth tab still works
- Token price header still shows current price and 24h change

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address review feedback from integration testing"
```
