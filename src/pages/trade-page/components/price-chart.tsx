import { useEffect, useRef, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createChart, ColorType, LineSeries } from 'lightweight-charts'
import type { IChartApi, LineData, Time } from 'lightweight-charts'
import { getPriceHistory, getTokenPrice, type TimeRange } from '@/services/price'
import { useMarketDepth, calculateBarHeights, formatTvl, formatBinStep } from '@/hooks/useMarketDepth'
import { AppTokenIcon } from '@/components/app-token-icon'
import { AppTokenName } from '@/components/app-token-name'
import { type AppTokenId, DEFAULT_BASE_TOKEN_ID, getAppToken, getTokenBySymbol } from '@/config'
import type { BinLiquidity } from '@/services/meteora'
import { toast } from 'sonner'

interface PriceChartProps {
  baseTokenId?: AppTokenId
  tokenSymbol?: string
  disabled?: boolean
}

type ChartTab = 'price' | 'market-depth'

function formatBinTooltip(bin: BinLiquidity, baseSymbol: string, baseDecimals: number, quoteSymbol: string, quoteDecimals: number): string {
  const price = parseFloat(bin.pricePerToken).toFixed(4)
  const xAmount = parseFloat(bin.xAmount) / 10 ** baseDecimals
  const yAmount = parseFloat(bin.yAmount) / 10 ** quoteDecimals
  const formatAmount = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `Bin ${bin.binId}: $${price}\n${baseSymbol}: ${formatAmount(xAmount)}\n${quoteSymbol}: ${formatAmount(yAmount)}`
}

function toLocalTimestamp(originalTime: number): number {
  const d = new Date(originalTime * 1000)
  return Math.floor(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds()
    ) / 1000
  )
}

export function PriceChart({
  baseTokenId,
  tokenSymbol,
  disabled = false
}: PriceChartProps) {
  // If baseTokenId is provided, use it. Otherwise fall back to tokenSymbol or default
  const tokenConfig = useMemo(() => {
    if (baseTokenId) {
      return getAppToken(baseTokenId)
    }
    if (tokenSymbol) {
      return getTokenBySymbol(tokenSymbol) ?? getAppToken(DEFAULT_BASE_TOKEN_ID)
    }
    return getAppToken(DEFAULT_BASE_TOKEN_ID)
  }, [baseTokenId, tokenSymbol])

  const quoteTokenConfig = useMemo(() => {
    const quoteId = tokenConfig.dlmmPool?.quoteToken
    return quoteId ? getAppToken(quoteId) : null
  }, [tokenConfig])

  const effectiveTokenSymbol = tokenConfig.symbol
  const [activeTab, setActiveTab] = useState<ChartTab>('price')
  const [timeRange, setTimeRange] = useState<TimeRange>('1D')
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null)

  // Fetch token price info from backend (skip if disabled)
  const { data: token } = useQuery({
    queryKey: ['tokenPrice', effectiveTokenSymbol],
    queryFn: () => getTokenPrice(effectiveTokenSymbol),
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    staleTime: 15 * 1000, // Consider data stale after 15 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    enabled: !disabled,
  })

  // Fetch price history from backend - updates when timeRange changes (skip if disabled)
  const { data: priceHistory } = useQuery({
    queryKey: ['priceHistory', effectiveTokenSymbol, timeRange],
    queryFn: () => getPriceHistory(effectiveTokenSymbol, timeRange),
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    enabled: !disabled,
  })

  // Fetch market depth data - only when tab is active and not disabled
  const { data: marketDepth, isLoading: isMarketDepthLoading } = useMarketDepth({
    enabled: !disabled && activeTab === 'market-depth',
  })

  const isPositive = (token?.priceChange24h ?? 0) >= 0

  // Limit bins for display to prevent overflow (max 40 bins on each side of active bin)
  const displayBins = useMemo(() => {
    if (!marketDepth) return []

    const MAX_BINS_PER_SIDE = 17
    const activeBinIndex = marketDepth.bins.findIndex((bin) => bin.binId === marketDepth.activeBinId)

    if (activeBinIndex === -1) return marketDepth.bins

    // Calculate how many bins to show on each side
    const leftBins = activeBinIndex
    const rightBins = marketDepth.bins.length - activeBinIndex - 1

    const binsToShowLeft = Math.min(leftBins, MAX_BINS_PER_SIDE)
    const binsToShowRight = Math.min(rightBins, MAX_BINS_PER_SIDE)

    const startIndex = activeBinIndex - binsToShowLeft
    const endIndex = activeBinIndex + binsToShowRight + 1

    return marketDepth.bins.slice(startIndex, endIndex)
  }, [marketDepth])

  // Calculate bar heights from display bins
  const barHeights = displayBins.length > 0 ? calculateBarHeights(displayBins) : []
  const activeBinIndex = displayBins.findIndex((bin) => bin.binId === marketDepth?.activeBinId)

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
        mode: 1, // Normal crosshair mode
        vertLine: {
          visible: true,
          color: 'rgba(0, 0, 0, 0.35)',
          width: 1,
          style: 2, // dashed
          labelVisible: true,
        },
        horzLine: {
          visible: true,
          color: 'rgba(0, 0, 0, 0.35)',
          width: 1,
          style: 2, // dashed
          labelVisible: true,
        },
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
        time: toLocalTimestamp(point.time) as Time,
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
              <AppTokenIcon token={tokenConfig} className="w-10 h-10 lg:w-12 lg:h-12" size={48} />
              <span className="text-sm lg:text-base font-extrabold text-black">
                {token?.symbol ?? <AppTokenName token={tokenConfig} variant="symbol" />}
              </span>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(tokenConfig.mint).then(() => {
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
            <div>
              <div className="text-xl lg:text-[28px] font-bold text-[#111]">
                {token?.price ? `$${token.price.toFixed(2)}` : '-'}
              </div>
              <div className="flex items-center gap-1 text-[10px] lg:text-xs">
                <span className={isPositive ? 'text-[#269700]' : 'text-red-500'}>
                  {token?.priceChange24h !== undefined ? (
                    <>{isPositive ? '▲' : '▼'} ${Math.abs(token.priceChange24h).toFixed(2)} ({Math.abs(token.priceChangePercent24h ?? 0).toFixed(2)}%)</>
                  ) : (
                    '-'
                  )}
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
                {isMarketDepthLoading ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="animate-pulse text-black opacity-50">Loading market depth...</div>
                  </div>
                ) : barHeights.length > 0 ? (
                  barHeights.map((height, index) => (
                    <div
                      key={displayBins[index]?.binId ?? index}
                      className={`${
                        index === activeBinIndex
                          ? 'bg-[#1d8f00]' // Active bin - darker green
                          : 'bg-[#9eca87]' // Regular bins - lighter green
                      } rounded-tl-[999px] rounded-tr-[999px] shrink-0 w-[8px] lg:w-[12px] transition-all hover:opacity-80`}
                      style={{ height: `${Math.max(height, 2)}px` }}
                      title={displayBins[index] && quoteTokenConfig ? formatBinTooltip(displayBins[index], tokenConfig.symbol, tokenConfig.decimals, quoteTokenConfig.symbol, quoteTokenConfig.decimals) : `Bin ${index + 1}`}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="text-black opacity-50">No liquidity data available</div>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-2 text-[10px] lg:text-xs font-semibold">
                <p className="text-black opacity-50">
                  Bin Step: {marketDepth ? formatBinStep(marketDepth.binStep) : '--'}
                </p>
                <p className="text-black">
                  Total TVL: {marketDepth ? formatTvl(marketDepth) : '--'}
                </p>
                <p className="text-[#1d8f00]">
                  Active Bin: {marketDepth ? marketDepth.activeBinId.toLocaleString() : '--'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
