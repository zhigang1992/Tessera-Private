import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, LineSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts'
import TokenSpacexIcon from './_/token-spacex.svg?react'

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'

interface PriceChartProps {
  tokenName?: string
  tokenPrice?: number
  priceChange?: number
  priceChangePercent?: number
}

// Generate mock data for the chart
function generateMockData(range: TimeRange): LineData<Time>[] {
  const data: LineData<Time>[] = []
  const now = new Date()
  let points = 100
  let intervalMs = 3 * 60 * 60 * 1000 // 3 hours

  switch (range) {
    case '1D':
      points = 24
      intervalMs = 60 * 60 * 1000 // 1 hour
      break
    case '1W':
      points = 7 * 24
      intervalMs = 60 * 60 * 1000 // 1 hour
      break
    case '1M':
      points = 30
      intervalMs = 24 * 60 * 60 * 1000 // 1 day
      break
    case '3M':
      points = 90
      intervalMs = 24 * 60 * 60 * 1000 // 1 day
      break
    case '1Y':
      points = 365
      intervalMs = 24 * 60 * 60 * 1000 // 1 day
      break
    case 'ALL':
      points = 500
      intervalMs = 24 * 60 * 60 * 1000 // 1 day
      break
  }

  let price = 440
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalMs)
    price = price + (Math.random() - 0.48) * 3
    price = Math.max(435, Math.min(455, price))
    data.push({
      time: (time.getTime() / 1000) as Time,
      value: price,
    })
  }

  return data
}

export function PriceChart({
  tokenName = 'T-SpaceX',
  tokenPrice = 449.94,
  priceChange = 2.74,
  priceChangePercent = 0.6203,
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<ISeriesApi<'Line'> | any>(null)
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1D')

  const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL']
  const isPositive = priceChange >= 0

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#111',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(0, 0, 0, 0.05)', style: 1 },
      },
      width: chartContainerRef.current.clientWidth,
      height: 220,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: false,
      handleScale: false,
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
    })

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#111',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    lineSeries.setData(generateMockData(selectedRange))

    chartRef.current = chart
    seriesRef.current = lineSeries

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(generateMockData(selectedRange))
    }
  }, [selectedRange])

  return (
    <div className="rounded-2xl p-6 bg-gradient-to-b from-white to-[#d2fb95]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <TokenSpacexIcon className="w-12 h-12" />
          <span className="text-base font-extrabold text-black">{tokenName}</span>
        </div>
        <div className="text-right">
          <div className="text-[28px] font-bold text-[#111]">${tokenPrice.toFixed(2)}</div>
          <div className="flex items-center justify-end gap-1 text-xs">
            <span className={isPositive ? 'text-[#269700]' : 'text-red-500'}>
              {isPositive ? '▲' : '▼'} ${Math.abs(priceChange).toFixed(2)} ({priceChangePercent.toFixed(4)}%)
            </span>
            <span className="text-[#999]">24H</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="w-full" />

      {/* Time Range Tabs */}
      <div className="flex items-center justify-between gap-1 p-1 mt-6 bg-black/10 rounded-lg">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`flex-1 py-1 px-3 text-xs font-medium rounded transition-all ${
              selectedRange === range
                ? 'bg-white text-black shadow-sm'
                : 'text-black hover:bg-white/50'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  )
}
