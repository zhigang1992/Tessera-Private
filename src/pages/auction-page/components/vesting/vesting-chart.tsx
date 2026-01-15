import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createChart, ColorType, LineSeries, AreaSeries } from 'lightweight-charts'
import type { IChartApi, LineData, AreaData, Time } from 'lightweight-charts'
import { getVestingChartData } from '@/services'

export function VestingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  const { data: vestingData } = useQuery({
    queryKey: ['vestingChartData'],
    queryFn: getVestingChartData,
  })

  useEffect(() => {
    if (!chartContainerRef.current || !vestingData) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#666',
        fontFamily: 'Inter, sans-serif',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(0, 0, 0, 0.06)', style: 2 },
        horzLines: { color: 'rgba(0, 0, 0, 0.06)', style: 1 },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 250,
      leftPriceScale: {
        visible: true,
        borderVisible: false,
        scaleMargins: { top: 0.02, bottom: 0.02 },
        autoScale: false,
      },
      rightPriceScale: {
        visible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        ticksVisible: true,
        minBarSpacing: 0.5,
        tickMarkFormatter: (time: number) => {
          // Time is in seconds, convert to hours from start
          const startTime = new Date('2024-01-01T00:00:00').getTime() / 1000
          const hours = Math.round((time - startTime) / 3600)
          return `${hours}h`
        },
      },
      localization: {
        timeFormatter: (time: number) => {
          const startTime = new Date('2024-01-01T00:00:00').getTime() / 1000
          const hours = Math.round((time - startTime) / 3600)
          return `${hours}h`
        },
        priceFormatter: (price: number) => {
          return price.toFixed(1)
        },
      },
      handleScroll: false,
      handleScale: false,
      crosshair: {
        vertLine: {
          visible: true,
          color: 'rgba(29, 143, 0, 0.3)',
          width: 1,
          style: 3,
        },
        horzLine: {
          visible: true,
          color: 'rgba(29, 143, 0, 0.3)',
          width: 1,
          style: 3,
        },
      },
    })

    // Locked area (gray horizontal at 1.22 with fill)
    const lockedSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(170, 170, 170, 0.3)',
      bottomColor: 'rgba(170, 170, 170, 0.05)',
      lineColor: '#aaa',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: 'left',
    })

    // Unlocked area (green with fill)
    const unlockedSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(29, 143, 0, 0.3)',
      bottomColor: 'rgba(29, 143, 0, 0.05)',
      lineColor: '#1d8f00',
      lineWidth: 3,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: 'left',
    })

    // Convert chart data to lightweight-charts format
    // Use a fixed start time for consistent X-axis
    const startTime = new Date('2024-01-01T00:00:00').getTime() / 1000

    // Unlocked area: diagonal from 0 to 1.22 over 24 hours
    const unlockedData: AreaData<Time>[] = vestingData.data.map((point) => ({
      time: (startTime + point.hour * 3600) as Time,
      value: point.value,
    }))

    // Locked area: horizontal at 1.22 from hour 1 to hour 24
    const lockedData: AreaData<Time>[] = Array.from({ length: 24 }, (_, i) => ({
      time: (startTime + (i + 1) * 3600) as Time,
      value: vestingData.totalTokens, // 1.22
    }))

    // Set data
    lockedSeries.setData(lockedData)
    unlockedSeries.setData(unlockedData)

    // Set Y-axis range to match design: 0 to 3.5
    lockedSeries.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 0,
          maxValue: 3.5,
        },
      }),
    })
    unlockedSeries.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 0,
          maxValue: 3.5,
        },
      }),
    })

    // Set visible time range: 1h to 24h
    chart.timeScale().setVisibleRange({
      from: (startTime + 1 * 3600) as Time,
      to: (startTime + 24 * 3600) as Time,
    })

    chartRef.current = chart

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [vestingData])

  return <div ref={chartContainerRef} className="w-full h-full" />
}
