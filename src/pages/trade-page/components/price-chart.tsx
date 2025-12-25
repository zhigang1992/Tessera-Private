import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createChart, ColorType, LineSeries } from 'lightweight-charts'
import type { IChartApi, LineData, Time } from 'lightweight-charts'
import { getPriceHistory, getTokenBySymbol } from '@/services'
import TokenSpacexIcon from './_/token-spacex.svg?react'

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'

interface PriceChartProps {
  tokenSymbol?: string
}

export function PriceChart({ tokenSymbol = 'T-SpaceX' }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null)
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1D')

  const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL']

  // Fetch token info
  const { data: token } = useQuery({
    queryKey: ['token', tokenSymbol],
    queryFn: () => getTokenBySymbol(tokenSymbol),
  })

  // Fetch price history
  const { data: priceHistory } = useQuery({
    queryKey: ['priceHistory', tokenSymbol, selectedRange],
    queryFn: () => getPriceHistory(tokenSymbol, selectedRange),
  })

  const isPositive = (token?.priceChange24h ?? 0) >= 0

  // Initialize chart
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
      height: 180,
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

    chartRef.current = chart
    seriesRef.current = lineSeries

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

  // Update chart data when price history changes
  useEffect(() => {
    if (seriesRef.current && priceHistory) {
      const chartData: LineData<Time>[] = priceHistory.map((point) => ({
        time: point.time as Time,
        value: point.value,
      }))
      seriesRef.current.setData(chartData)
    }
  }, [priceHistory])

  return (
    <div className="rounded-2xl p-4 lg:p-6 bg-gradient-to-b from-white to-[#d2fb95] dark:from-[#1e1f20] dark:to-[#d2fb95]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div className="flex items-center gap-2 lg:gap-2.5">
          <TokenSpacexIcon className="w-10 h-10 lg:w-12 lg:h-12" />
          <span className="text-sm lg:text-base font-extrabold text-black dark:text-[#d2d2d2]">{token?.name ?? tokenSymbol}</span>
        </div>
        <div className="text-right">
          <div className="text-xl lg:text-[28px] font-bold text-[#111] dark:text-white">
            ${token?.price.toFixed(2) ?? '0.00'}
          </div>
          <div className="flex items-center justify-end gap-1 text-[10px] lg:text-xs">
            <span className={isPositive ? 'text-[#269700]' : 'text-red-500'}>
              {isPositive ? '▲' : '▼'} ${Math.abs(token?.priceChange24h ?? 0).toFixed(2)} (
              {Math.abs(token?.priceChangePercent24h ?? 0).toFixed(2)}%)
            </span>
            <span className="text-[#999] dark:text-[#d2d2d2]">24H</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="w-full" />

      {/* Time Range Tabs */}
      <div className="flex items-center justify-between gap-0.5 lg:gap-1 p-1 mt-4 lg:mt-6 bg-black/10 rounded-lg">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`flex-1 py-1 px-1.5 lg:px-3 text-[10px] lg:text-xs font-medium rounded transition-all ${
              selectedRange === range ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm' : 'text-black hover:bg-white/50'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  )
}
