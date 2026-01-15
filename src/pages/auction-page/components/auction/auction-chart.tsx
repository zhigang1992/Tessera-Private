import { useEffect, useRef } from 'react'
import { createChart, ColorType, AreaSeries } from 'lightweight-charts'
import type { IChartApi, AreaData, Time } from 'lightweight-charts'

// Mock data for the auction progress matching the design
// Chart shows progress from 11/10 14:00 to 11/11 05:00
// Starts around $20k-40k, rises to ~$180k with target line at $58k
const generateChartData = (): AreaData<Time>[] => {
  // Use fixed dates matching the design: 11/10 14:00 to 11/11 05:00 (15 hours)
  const startDate = new Date('2024-11-10T14:00:00').getTime() / 1000
  const data: AreaData<Time>[] = []

  // Define key points to match the design curve
  // The chart shows: starts low (~$20-30k), crosses $58k target around hour 3-4,
  // then rises more gradually to ~$180k
  const keyPoints = [
    { hour: 0, value: 22000 },    // 11/10 14:00 - Start
    { hour: 1, value: 28000 },    // 11/10 15:00
    { hour: 2, value: 38000 },    // 11/10 16:00
    { hour: 3, value: 52000 },    // 11/10 17:00 - Approaching target
    { hour: 4, value: 68000 },    // 11/10 18:00 - Just passed target
    { hour: 5, value: 85000 },    // 11/10 19:00
    { hour: 6, value: 105000 },   // 11/10 20:00
    { hour: 7, value: 118000 },   // 11/10 21:00
    { hour: 8, value: 128000 },   // 11/10 22:00
    { hour: 9, value: 138000 },   // 11/10 23:00
    { hour: 10, value: 148000 },  // 11/11 00:00
    { hour: 11, value: 158000 },  // 11/11 01:00
    { hour: 12, value: 165000 },  // 11/11 02:00
    { hour: 13, value: 172000 },  // 11/11 03:00
    { hour: 14, value: 178000 },  // 11/11 04:00
    { hour: 15, value: 182000 },  // 11/11 05:00 - Current
  ]

  for (const point of keyPoints) {
    const time = (startDate + point.hour * 3600) as Time
    data.push({
      time,
      value: point.value,
    })
  }

  return data
}

export function AuctionChart() {
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
      height: 360,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.02, bottom: 0.02 },
        autoScale: false,
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

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(29, 143, 0, 0.4)',
      bottomColor: 'rgba(29, 143, 0, 0.05)',
      lineColor: '#1d8f00',
      lineWidth: 3,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
      crosshairMarkerBorderColor: '#1d8f00',
      crosshairMarkerBackgroundColor: '#fff',
    })

    // Set chart data
    const chartData = generateChartData()
    areaSeries.setData(chartData)

    // Set visible range to match design: $0k to $190k
    chart.priceScale('right').applyOptions({
      autoScale: false,
    })
    areaSeries.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 0,
          maxValue: 190000,
        },
      }),
    })

    // Add a price line for the target ($58k)
    areaSeries.createPriceLine({
      price: 58000,
      color: '#1d8f00',
      lineWidth: 2,
      lineStyle: 3, // Dashed
      axisLabelVisible: true,
      title: 'Target',
    })

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
