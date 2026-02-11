import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createChart, ColorType, LineStyle, AreaSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts'
import { getDashboardStats } from '@/services'
import { getTokenPrice, getPriceHistory, type TimeRange } from '@/services/price'
import { AppTokenIcon } from '@/components/app-token-icon'
import { DEFAULT_BASE_TOKEN_ID, getAppToken } from '@/config'

const TOKEN_CONFIG = getAppToken(DEFAULT_BASE_TOKEN_ID)
const TOKEN_SYMBOL = TOKEN_CONFIG.symbol
const TOKEN_DISPLAY_NAME = TOKEN_CONFIG.displayName

export function DashboardPriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1D')

  const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL']

  // Fetch token price info from backend (same as trade page)
  const { data: tokenInfo } = useQuery({
    queryKey: ['tokenPrice', TOKEN_SYMBOL],
    queryFn: () => getTokenPrice(TOKEN_SYMBOL),
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  })

  // Fetch stats for top cards
  const { data: stats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  })

  // Fetch price history from backend (using T-SpaceX symbol)
  const { data: priceHistory } = useQuery({
    queryKey: ['priceHistory', TOKEN_SYMBOL, selectedRange],
    queryFn: () => getPriceHistory(TOKEN_SYMBOL, selectedRange),
    staleTime: 30 * 1000,
  })

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#000',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: {
          color: 'rgba(0, 0, 0, 0.2)',
          style: LineStyle.Dashed,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: 235,
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

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#1D8F00',
      lineWidth: 3,
      topColor: 'rgba(29, 143, 0, 0.3)',
      bottomColor: 'rgba(29, 143, 0, 0)',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    chartRef.current = chart
    seriesRef.current = areaSeries

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

  const isPositive = (tokenInfo?.priceChange24h ?? 0) >= 0

  return (
    <div>
      <h2 className="font-semibold text-sm text-foreground dark:text-[#d2d2d2] mb-4">{TOKEN_DISPLAY_NAME}</h2>

      <div className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] border border-[rgba(17,17,17,0.15)] rounded-2xl p-4 lg:p-6">
        {/* Top Stats - Desktop Only */}
        <div className="hidden lg:grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[rgba(0,0,0,0.1)] rounded-lg px-4 py-3">
            <p className="text-xs font-normal text-black mb-1">Protocol Backing Ratio</p>
            <p className="font-['Martian_Mono',monospace] font-medium text-[20px] text-black">
              {stats?.protocolBackingRatio ? `${stats.protocolBackingRatio}%` : '—'}
            </p>
          </div>
          <div className="bg-[rgba(0,0,0,0.1)] rounded-lg px-4 py-3">
            <p className="text-xs font-normal text-black mb-1">{TOKEN_DISPLAY_NAME} Supply</p>
            <p className="font-['Martian_Mono',monospace] font-medium text-[20px] text-black">
              {stats?.tokenSupply ?? '—'}
            </p>
          </div>
          <div className="bg-[rgba(0,0,0,0.1)] rounded-lg px-4 py-3">
            <p className="text-xs font-normal text-black mb-1">{TOKEN_DISPLAY_NAME} Price</p>
            <p className="font-['Martian_Mono',monospace] font-medium text-[20px] text-black">
              {stats?.tokenPrice ? `$${stats.tokenPrice.toFixed(1)}` : '—'}
            </p>
          </div>
        </div>

        {/* Mobile - Token Info and Price */}
        <div className="flex items-center justify-between mb-2.5 lg:hidden">
          <div className="flex items-center gap-2.5">
            <AppTokenIcon token={TOKEN_CONFIG} size={48} className="w-12 h-12" />
            <p className="text-[16px] font-extrabold text-black">{tokenInfo?.symbol ?? TOKEN_DISPLAY_NAME}</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="font-['Martian_Mono',monospace] font-medium text-[20px] text-[#111]">
              {tokenInfo?.price ? `$${tokenInfo.price.toFixed(2)}` : '—'}
            </p>
            {tokenInfo?.price ? (
              <div className="flex items-center gap-1.5">
                <span className={`text-xs ${isPositive ? 'text-[#269700]' : 'text-red-500'}`}>
                  {isPositive ? '▲' : '▼'}
                </span>
                <p className="text-[10px] font-medium text-black">
                  ${Math.abs(tokenInfo.priceChange24h ?? 0).toFixed(2)} (
                  {Math.abs(tokenInfo.priceChangePercent24h ?? 0).toFixed(2)}%) 24H
                </p>
              </div>
            ) : (
              <p className="text-[10px] font-medium text-black">—</p>
            )}
          </div>
        </div>

        {/* Mobile - Time Range */}
        <div className="bg-[rgba(0,0,0,0.1)] flex items-center p-1 rounded-lg mb-6 lg:hidden">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`flex-1 py-0.5 rounded text-xs font-medium transition-all ${
                selectedRange === range
                  ? 'bg-white shadow-sm text-black'
                  : 'opacity-50 hover:opacity-100 text-black'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Desktop - Token Info and Time Range */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <AppTokenIcon token={TOKEN_CONFIG} size={48} className="w-12 h-12" />
              <p className="text-[16px] font-extrabold text-black">{tokenInfo?.symbol ?? TOKEN_DISPLAY_NAME}</p>
            </div>
            <div className="bg-[rgba(0,0,0,0.5)] h-10 w-px" />
            <div className="flex flex-col justify-center">
              <p className="font-['Martian_Mono',monospace] font-medium text-[24px] text-[#111]">
                {tokenInfo?.price ? `$${tokenInfo.price.toFixed(2)}` : '—'}
              </p>
              {tokenInfo?.price ? (
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs ${isPositive ? 'text-[#269700]' : 'text-red-500'}`}>
                    {isPositive ? '▲' : '▼'}
                  </span>
                  <p className="text-xs font-medium text-black">
                    ${Math.abs(tokenInfo.priceChange24h ?? 0).toFixed(2)} (
                    {Math.abs(tokenInfo.priceChangePercent24h ?? 0).toFixed(2)}%) 24H
                  </p>
                </div>
              ) : (
                <p className="text-xs font-medium text-black">—</p>
              )}
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="bg-[rgba(0,0,0,0.1)] flex items-center p-1 rounded-lg">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-6 py-1 rounded text-xs font-medium transition-all ${
                  selectedRange === range
                    ? 'bg-white shadow-sm text-black'
                    : 'opacity-50 hover:opacity-100 text-black'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div ref={chartContainerRef} className="w-full" />
      </div>
    </div>
  )
}
