import { useEffect, useRef } from 'react'
import { createChart, ColorType, AreaSeries } from 'lightweight-charts'
import type { IChartApi, AreaData, Time } from 'lightweight-charts'

// Mock data for vesting release schedule (linear unlock over 24 hours)
const generateVestingData = (): AreaData<Time>[] => {
  const now = Math.floor(Date.now() / 1000) // Current time in seconds
  const hoursTotal = 24
  const data: AreaData<Time>[] = []
  const totalTokens = 1.22

  for (let i = 0; i <= hoursTotal; i++) {
    const time = (now + i * 3600) as Time // hours from now in seconds
    const value = (totalTokens / hoursTotal) * i // Linear release

    data.push({
      time,
      value: Math.min(value, totalTokens),
    })
  }

  return data
}

export function VestingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#666',
        fontFamily: 'Inter, sans-serif',
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(0, 0, 0, 0.06)', style: 1 },
      },
      width: chartContainerRef.current.clientWidth,
      height: 250,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: false,
      handleScale: false,
      crosshair: {
        vertLine: {
          visible: true,
          color: 'rgba(170, 211, 109, 0.3)',
          width: 1,
          style: 3,
        },
        horzLine: {
          visible: true,
          color: 'rgba(170, 211, 109, 0.3)',
          width: 1,
          style: 3,
        },
      },
    })

    // Unlocked area (up to current progress - 10%)
    const unlockedSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(170, 211, 109, 0.4)',
      bottomColor: 'rgba(170, 211, 109, 0.1)',
      lineColor: '#aad36d',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    // Locked area (full projection)
    const lockedSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(17, 17, 17, 0.1)',
      bottomColor: 'rgba(17, 17, 17, 0.05)',
      lineColor: 'rgba(17, 17, 17, 0.2)',
      lineWidth: 2,
      lineStyle: 3, // Dashed
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    // Set chart data
    const fullData = generateVestingData()
    const currentProgress = 2.4 // 10% of 24 hours
    const unlockedData = fullData.filter((_, i) => i <= currentProgress)

    unlockedSeries.setData(unlockedData)
    lockedSeries.setData(fullData)

    chartRef.current = chart

    // Handle resize
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

  return <div ref={chartContainerRef} className="w-full" />
}
