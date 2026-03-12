'use client'

import { useEffect, useRef, useId } from 'react'

const NASDAQ_STOCKS = new Set(['AAPL','MSFT','NVDA','META','AMD','AMZN','GOOGL','TSLA','NFLX','AVGO','CRM','ORCL','INTC','PLTR','COIN','MSTR','ARM','SMCI','SNOW','SHOP','BIDU','JD','PDD','BABA','NIO','LI','XPEV','SQ'])

function toTradingViewSymbol(symbol: string) {
  const upper = symbol.toUpperCase()
  // Crypto
  if (upper.endsWith('USDT') || upper.endsWith('BTC') || upper.endsWith('BUSD')) return `BINANCE:${upper}`
  // Hong Kong
  if (upper.endsWith('.HK')) return `HKEX:${upper.replace('.HK', '').replace(/^0+/, '')}`
  // A-shares Shanghai
  if (upper.endsWith('.SS')) return `SSE:${upper.replace('.SS', '')}`
  // A-shares Shenzhen
  if (upper.endsWith('.SZ')) return `SZSE:${upper.replace('.SZ', '')}`
  // US stocks
  if (NASDAQ_STOCKS.has(upper)) return `NASDAQ:${upper}`
  return `NYSE:${upper}`
}

export function TradingViewChart({ symbol, interval = '60', height = 560 }: { symbol: string; interval?: string; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useId().replace(/:/g, '')

  useEffect(() => {
    if (!containerRef.current) return

    // Clean up previous widget
    containerRef.current.innerHTML = ''

    const containerId = `tv_chart_${widgetId}`
    const div = document.createElement('div')
    div.id = containerId
    div.style.height = `${height}px`
    div.style.width = '100%'
    containerRef.current.appendChild(div)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined') {
        new (window as any).TradingView.widget({
          container_id: containerId,
          autosize: true,
          symbol: toTradingViewSymbol(symbol),
          interval,
          timezone: 'Asia/Shanghai',
          theme: 'dark',
          style: '1',
          locale: 'zh_CN',
          toolbar_bg: '#020617',
          enable_publishing: false,
          allow_symbol_change: false,
          hide_top_toolbar: false,
          hide_legend: false,
          withdateranges: true,
          save_image: false,
          studies: ['MASimple@tv-basicstudies', 'Volume@tv-basicstudies'],
          show_popup_button: false,
          popup_width: '1000',
          popup_height: '650',
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
      // Don't remove script — TradingView caches globally
    }
  }, [symbol, interval, height, widgetId])

  return <div ref={containerRef} className="w-full" style={{ height: `${height}px` }} />
}
