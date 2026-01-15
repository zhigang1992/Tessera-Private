import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createChart, ColorType, AreaSeries } from 'lightweight-charts'
import type { IChartApi, AreaData, Time } from 'lightweight-charts'
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
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.05, bottom: 0.1 },
        autoScale: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
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

    // Locked area (full projection - gray)
    const lockedSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(17, 17, 17, 0.08)',
      bottomColor: 'rgba(17, 17, 17, 0.02)',
      lineColor: 'rgba(17, 17, 17, 0.2)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    // Unlocked area (green - up to current progress)
    const unlockedSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(170, 211, 109, 0.5)',
      bottomColor: 'rgba(170, 211, 109, 0.1)',
      lineColor: '#aad36d',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    // Convert chart data to lightweight-charts format
    // Use a fixed start time for consistent X-axis
    const startTime = new Date('2024-01-01T00:00:00').getTime() / 1000

    const fullData: AreaData<Time>[] = vestingData.data.map((point) => ({
      time: (startTime + point.hour * 3600) as Time,
      value: point.value,
    }))

    // Filter data for unlocked portion (up to current progress)
    const unlockedData = fullData.filter(
      (_, i) => i <= Math.ceil(vestingData.currentProgressHours)
    )

    // Set data - locked first (background), then unlocked (foreground)
    lockedSeries.setData(fullData)
    unlockedSeries.setData(unlockedData)

    // Set Y-axis range to match design: 0 to 1.5
    lockedSeries.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 0,
          maxValue: 1.5,
        },
      }),
    })
    unlockedSeries.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 0,
          maxValue: 1.5,
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
