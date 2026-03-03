import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
import type { IChartApi, CandlestickData, HistogramData, Time } from 'lightweight-charts'
import { getDashboardStats } from '@/services'
import { getTokenPrice } from '@/services/price'
import { fetchJupiterCandles, getRefetchInterval, type ChartInterval } from '@/services/jupiter-chart'
import { AppTokenIcon } from '@/components/app-token-icon'
import { DEFAULT_BASE_TOKEN_ID, getAppToken } from '@/config'
import { toast } from 'sonner'

const TOKEN_CONFIG = getAppToken(DEFAULT_BASE_TOKEN_ID)
const TOKEN_SYMBOL = TOKEN_CONFIG.symbol
const TOKEN_DISPLAY_NAME = TOKEN_CONFIG.displayName

export function DashboardPriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candleSeriesRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSeriesRef = useRef<any>(null)
  const [selectedInterval, setSelectedInterval] = useState<ChartInterval>('1H')

  const chartIntervals: ChartInterval[] = ['15M', '1H', '4H', '1D', '1W']

  // Fetch token price info from backend (same as trade page)
  const { data: tokenInfo } = useQuery({
    queryKey: ['tokenPrice', TOKEN_SYMBOL],
    queryFn: () => getTokenPrice(TOKEN_SYMBOL),
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  })

  // Fetch stats for top cards
  const { data: stats } = useQuery({
    queryKey: ['dashboardStats', DEFAULT_BASE_TOKEN_ID],
    queryFn: () => getDashboardStats(DEFAULT_BASE_TOKEN_ID),
  })

  // Fetch Jupiter candle data
  const { data: jupiterCandles } = useQuery({
    queryKey: ['jupiterCandles', TOKEN_CONFIG.mint, selectedInterval],
    queryFn: () => fetchJupiterCandles(TOKEN_CONFIG.mint, selectedInterval),
    refetchInterval: getRefetchInterval(selectedInterval),
    staleTime: getRefetchInterval(selectedInterval) / 2,
    gcTime: 10 * 60 * 1000,
  })

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
          color: 'rgba(0, 0, 0, 0.1)',
          style: 2,
          visible: true,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: 235,
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

  // Update chart data when Jupiter candles change
  useEffect(() => {
    if (!jupiterCandles || !candleSeriesRef.current || !volumeSeriesRef.current) return

    const candleData: CandlestickData<Time>[] = jupiterCandles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))

    const volumeData: HistogramData<Time>[] = jupiterCandles.map((c) => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(29, 143, 0, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    }))

    candleSeriesRef.current.setData(candleData)
    volumeSeriesRef.current.setData(volumeData)

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }, [jupiterCandles])

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
            <button
              onClick={() => {
                void navigator.clipboard.writeText(TOKEN_CONFIG.mint).then(() => {
                  toast.success('Address copied to clipboard!')
                })
              }}
              className="hover:opacity-70 transition-opacity"
              title="Copy contract address"
            >
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
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
          {chartIntervals.map((interval) => (
            <button
              key={interval}
              onClick={() => setSelectedInterval(interval)}
              className={`flex-1 py-0.5 rounded text-xs font-medium transition-all ${
                selectedInterval === interval
                  ? 'bg-white shadow-sm text-black'
                  : 'opacity-50 hover:opacity-100 text-black'
              }`}
            >
              {interval}
            </button>
          ))}
        </div>

        {/* Desktop - Token Info and Time Range */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <AppTokenIcon token={TOKEN_CONFIG} size={48} className="w-12 h-12" />
              <p className="text-[16px] font-extrabold text-black">{tokenInfo?.symbol ?? TOKEN_DISPLAY_NAME}</p>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(TOKEN_CONFIG.mint).then(() => {
                    toast.success('Address copied to clipboard!')
                  })
                }}
                className="hover:opacity-70 transition-opacity"
                title="Copy contract address"
              >
                <svg
                  className="w-4 h-4 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
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
            {chartIntervals.map((interval) => (
              <button
                key={interval}
                onClick={() => setSelectedInterval(interval)}
                className={`px-6 py-1 rounded text-xs font-medium transition-all ${
                  selectedInterval === interval
                    ? 'bg-white shadow-sm text-black'
                    : 'opacity-50 hover:opacity-100 text-black'
                }`}
              >
                {interval}
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
