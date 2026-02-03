import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createChart, ColorType, LineSeries } from 'lightweight-charts'
import type { IChartApi, LineData, Time } from 'lightweight-charts'
import { getAuctionChartData } from '@/services'

export function AuctionChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  const { data: chartData } = useQuery({
    queryKey: ['auctionChartData'],
    queryFn: getAuctionChartData,
  })

  useEffect(() => {
    if (!chartContainerRef.current || !chartData || chartData.length === 0) return

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
      height: chartContainerRef.current.clientHeight || 360,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.05, bottom: 0.1 },
        autoScale: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000)
          const month = date.getMonth() + 1
          const day = date.getDate()
          const hours = date.getHours().toString().padStart(2, '0')
          return `${month}/${day} ${hours}:00`
        },
      },
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000)
          const month = date.getMonth() + 1
          const day = date.getDate()
          const hours = date.getHours().toString().padStart(2, '0')
          return `${month}/${day} ${hours}:00`
        },
        priceFormatter: (price: number) => {
          return `$${Math.round(price / 1000)}k`
        },
      },
      handleScroll: false,
      handleScale: false,
      crosshair: {
        vertLine: {
          visible: true,
          color: 'rgba(6, 168, 0, 0.3)',
          width: 1,
          style: 3,
        },
        horzLine: {
          visible: true,
          color: 'rgba(6, 168, 0, 0.3)',
          width: 1,
          style: 3,
        },
      },
    })

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#1d8f00',
      lineWidth: 3,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
      crosshairMarkerBorderColor: '#1d8f00',
      crosshairMarkerBackgroundColor: '#fff',
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => `$${Math.round(price / 1000)}k`,
      },
    })

    // Convert chart data to the format required by lightweight-charts
    // Start: 11/10 14:00, End: 11/11 05:00 (15 hours total)
    const startDate = new Date('2024-11-10T14:00:00').getTime() / 1000
    const formattedData: LineData<Time>[] = chartData.map((point) => ({
      time: (startDate + point.hour * 3600) as Time,
      value: point.value,
    }))
    lineSeries.setData(formattedData)

    // Set visible time range to show all 6 time labels from design
    chart.timeScale().setVisibleRange({
      from: startDate as Time,
      to: (startDate + 15 * 3600) as Time,
    })

    // Set visible range to match design: $0k to $200k
    chart.priceScale('right').applyOptions({
      autoScale: false,
    })
    lineSeries.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 0,
          maxValue: 200000,
        },
      }),
    })

    // Add a price line for the target ($80k) - blue dashed line as in design
    lineSeries.createPriceLine({
      price: 80000,
      color: '#5865f2',
      lineWidth: 2,
      lineStyle: 2, // Dashed
      axisLabelVisible: false,
      title: '',
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
  }, [chartData])

  // Show message when no data is available
  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#666]">
        Data not available yet
      </div>
    )
  }

  return <div ref={chartContainerRef} className="w-full h-full" />
}
