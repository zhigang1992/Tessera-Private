import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createChart, ColorType, LineSeries } from 'lightweight-charts'
import type { IChartApi, LineData, Time } from 'lightweight-charts'
import { getPriceHistory, getTokenPrice, type TimeRange } from '@/services/price'
import TokenTessIcon from './_/token-tess.svg?react'

interface PriceChartProps {
  tokenSymbol?: string
}

type ChartTab = 'price' | 'market-depth'

export function PriceChart({ tokenSymbol = 'TESS' }: PriceChartProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>('price')
  const [timeRange, setTimeRange] = useState<TimeRange>('1D')
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null)

  // Fetch token price info from backend
  const { data: token } = useQuery({
    queryKey: ['tokenPrice', tokenSymbol],
    queryFn: () => getTokenPrice(tokenSymbol),
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    staleTime: 15 * 1000, // Consider data stale after 15 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })

  // Fetch price history from backend - updates when timeRange changes
  const { data: priceHistory } = useQuery({
    queryKey: ['priceHistory', tokenSymbol, timeRange],
    queryFn: () => getPriceHistory(tokenSymbol, timeRange),
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })

  const isPositive = (token?.priceChange24h ?? 0) >= 0

  // Initialize chart
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
          color: 'rgba(0, 0, 0, 0.2)',
          style: 2, // 2 = dashed line
          visible: true
        },
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
      color: '#1D8F00',
      lineWidth: 3,
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
    <div className="h-full rounded-2xl p-4 lg:p-6 bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)]">
      <div className="flex flex-col h-full">
        {/* Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 lg:mb-6 gap-4">
          {/* Left: Token Info and Price */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 lg:gap-2.5">
              <TokenTessIcon className="w-10 h-10 lg:w-12 lg:h-12" />
              <span className="text-sm lg:text-base font-extrabold text-black">
                {token?.symbol ?? tokenSymbol}
              </span>
            </div>
            <div>
              <div className="text-xl lg:text-[28px] font-bold text-[#111]">
                ${token?.price?.toFixed(2) ?? '0.00'}
              </div>
              <div className="flex items-center gap-1 text-[10px] lg:text-xs">
                <span className={isPositive ? 'text-[#269700]' : 'text-red-500'}>
                  {isPositive ? '▲' : '▼'} ${Math.abs(token?.priceChange24h ?? 0).toFixed(2)} (
                  {Math.abs(token?.priceChangePercent24h ?? 0).toFixed(2)}%)
                </span>
                <span className="text-[#999]">24H</span>
              </div>
            </div>
          </div>

          {/* Right: Tab Switcher */}
          <div className="bg-[rgba(0,0,0,0.1)] flex items-center p-1 rounded-lg shrink-0 self-start">
            <button
              onClick={() => setActiveTab('price')}
              className={`px-4 lg:px-6 py-1 text-xs font-medium transition-all rounded ${
                activeTab === 'price'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-black opacity-50 hover:opacity-75 hover:bg-[rgba(255,255,255,0.3)]'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setActiveTab('market-depth')}
              className={`px-4 lg:px-6 py-1 text-xs font-medium transition-all rounded whitespace-nowrap ${
                activeTab === 'market-depth'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-black opacity-50 hover:opacity-75 hover:bg-[rgba(255,255,255,0.3)]'
              }`}
            >
              Market Depth
            </button>
          </div>
        </div>

        {/* Chart Content */}
        <div className="flex-1 flex flex-col relative">
          {/* Price Chart - Always rendered but hidden when not active */}
          <div className={activeTab === 'price' ? 'flex-1 flex flex-col' : 'hidden'}>
            {/* Price Chart */}
            <div ref={chartContainerRef} className="w-full flex-1 mb-4" />

            {/* Time Range Selector */}
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
          </div>

          {/* Market Depth View */}
          {activeTab === 'market-depth' && (
            <div className="flex-1 flex flex-col">
              {/* Bar Chart */}
              <div className="flex items-end justify-center gap-[2px] px-4 mb-4 h-[261px]">
                {/* Generate bars with varying heights - simulating market depth distribution */}
                {[29, 47, 56, 25, 60, 78, 60, 89, 47, 60, 97, 202, 246, 246, 227, 227, 246, 246, 219, 261, 236, 236, 236, 97, 66, 104, 89, 47, 60, 56, 78, 47, 60, 25, 29].map((height, index) => (
                  <div
                    key={index}
                    className={`${
                      index === 17
                        ? 'bg-[#1d8f00]' // Active bin - darker green
                        : 'bg-[#9eca87]' // Regular bins - lighter green
                    } rounded-tl-[999px] rounded-tr-[999px] shrink-0 w-[8px] lg:w-[12px] transition-all hover:opacity-80`}
                    style={{ height: `${height}px` }}
                    title={`Bin ${index + 1}`}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-2 text-[10px] lg:text-xs font-semibold">
                <p className="text-black opacity-50">
                  Bin Step: 10 (0.1%)
                </p>
                <p className="text-black">
                  Total TVL: $245.2M
                </p>
                <p className="text-[#1d8f00]">
                  Active Bin: 8,300,030
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
