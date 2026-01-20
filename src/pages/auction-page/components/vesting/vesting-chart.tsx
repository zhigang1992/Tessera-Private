import { useEffect, useRef, useMemo } from 'react'
import { createChart, ColorType, AreaSeries } from 'lightweight-charts'
import type { IChartApi, AreaData, Time } from 'lightweight-charts'

interface VestingChartProps {
  totalTokens: number
  totalHours: number
  currentProgressHours: number
}

export function VestingChart({ totalTokens, totalHours, currentProgressHours }: VestingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  // Generate chart data based on props
  const vestingData = useMemo(() => {
    const dataPoints = Math.max(totalHours + 1, 25)
    return {
      totalTokens,
      currentProgressHours,
      totalHours,
      data: Array.from({ length: dataPoints }, (_, i) => ({
        hour: i,
        value: totalTokens > 0 ? (totalTokens / totalHours) * i : 0,
      })),
    }
  }, [totalTokens, totalHours, currentProgressHours])

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

    // Locked area (gray horizontal at totalTokens with fill)
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

    // Unlocked area: diagonal from 0 to totalTokens over totalHours
    const unlockedData: AreaData<Time>[] = vestingData.data.map((point) => ({
      time: (startTime + point.hour * 3600) as Time,
      value: point.value,
    }))

    // Locked area: horizontal at totalTokens from hour 1 to totalHours
    const lockedData: AreaData<Time>[] = Array.from({ length: totalHours }, (_, i) => ({
      time: (startTime + (i + 1) * 3600) as Time,
      value: vestingData.totalTokens,
    }))

    // Set data
    lockedSeries.setData(lockedData)
    unlockedSeries.setData(unlockedData)

    // Calculate Y-axis max: round up totalTokens to nice number, minimum 3.5
    const yAxisMax = Math.max(3.5, Math.ceil(vestingData.totalTokens * 1.5 * 10) / 10)

    // Set Y-axis range
    lockedSeries.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 0,
          maxValue: yAxisMax,
        },
      }),
    })
    unlockedSeries.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 0,
          maxValue: yAxisMax,
        },
      }),
    })

    // Set visible time range: 1h to totalHours
    chart.timeScale().setVisibleRange({
      from: (startTime + 1 * 3600) as Time,
      to: (startTime + totalHours * 3600) as Time,
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
  }, [vestingData, totalHours])

  return <div ref={chartContainerRef} className="w-full h-full" />
}
