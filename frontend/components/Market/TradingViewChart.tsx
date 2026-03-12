'use client'

import { useEffect, useRef } from 'react'

function toTradingViewSymbol(symbol: string) {
  const upper = symbol.toUpperCase()
  if (upper.endsWith('USDT')) return `BINANCE:${upper}`
  if (['AAPL', 'MSFT', 'NVDA', 'META', 'AMD', 'AMZN', 'GOOGL', 'TSLA'].includes(upper)) return `NASDAQ:${upper}`
  return upper.includes('.') ? `NYSE:${upper.replace('.', '')}` : `NASDAQ:${upper}`
}

export function TradingViewChart({ symbol, interval = '60' }: { symbol: string; interval?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: toTradingViewSymbol(symbol),
      interval,
      timezone: 'Asia/Shanghai',
      theme: 'dark',
      style: '1',
      locale: 'zh_CN',
      allow_symbol_change: false,
      support_host: 'https://www.tradingview.com',
      hide_top_toolbar: false,
      hide_legend: false,
      withdateranges: true,
      save_image: false,
      calendar: false,
      studies: ['MASimple@tv-basicstudies', 'Volume@tv-basicstudies'],
      backgroundColor: '#020617',
      gridColor: 'rgba(148, 163, 184, 0.08)',
      watchlist: [],
    })

    const wrapper = document.createElement('div')
    wrapper.className = 'tradingview-widget-container h-full w-full'

    const inner = document.createElement('div')
    inner.className = 'tradingview-widget-container__widget h-full w-full'

    wrapper.appendChild(inner)
    wrapper.appendChild(script)
    containerRef.current.appendChild(wrapper)
  }, [symbol, interval])

  return <div ref={containerRef} className="h-full min-h-[520px] w-full" />
}
