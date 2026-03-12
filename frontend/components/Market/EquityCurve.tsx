'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, LineStyle, AreaSeries, LineSeries } from 'lightweight-charts'

interface EquityPoint {
  time: string
  value: number
}

export function EquityCurve({
  data,
  initialCapital = 100000,
  height = 300,
}: {
  data: EquityPoint[]
  initialCapital?: number
  height?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#020617' },
        textColor: '#94a3b8',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.06)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.06)' },
      },
      rightPriceScale: { borderColor: 'rgba(148, 163, 184, 0.1)' },
      timeScale: { borderColor: 'rgba(148, 163, 184, 0.1)', timeVisible: true },
      crosshair: {
        horzLine: { labelBackgroundColor: '#1e293b' },
        vertLine: { labelBackgroundColor: '#1e293b' },
      },
    })

    const equitySeries = chart.addSeries(AreaSeries, {
      lineColor: '#22c55e',
      topColor: 'rgba(34, 197, 94, 0.15)',
      bottomColor: 'rgba(34, 197, 94, 0.01)',
      lineWidth: 2,
    })
    equitySeries.setData(data as any)

    if (data.length >= 2) {
      const baselineSeries = chart.addSeries(LineSeries, {
        color: 'rgba(148, 163, 184, 0.3)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
      })
      baselineSeries.setData([
        { time: data[0].time, value: initialCapital },
        { time: data[data.length - 1].time, value: initialCapital },
      ] as any)
    }

    chart.timeScale().fitContent()

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [data, initialCapital, height])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-dark-500 text-sm" style={{ height }}>
        暂无权益数据
      </div>
    )
  }

  return <div ref={containerRef} className="w-full" />
}
