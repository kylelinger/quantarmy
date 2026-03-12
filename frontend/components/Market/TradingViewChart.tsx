'use client'

import { useMemo } from 'react'

function toTradingViewSymbol(symbol: string) {
  const upper = symbol.toUpperCase()
  if (upper.endsWith('USDT')) return `BINANCE:${upper}`
  if (['AAPL', 'MSFT', 'NVDA', 'META', 'AMD', 'AMZN', 'GOOGL', 'TSLA'].includes(upper)) return `NASDAQ:${upper}`
  return upper.includes('.') ? `NYSE:${upper.replace('.', '')}` : `NASDAQ:${upper}`
}

export function TradingViewChart({ symbol, interval = '60', height = 560 }: { symbol: string; interval?: string; height?: number }) {
  const src = useMemo(() => {
    const tvSymbol = toTradingViewSymbol(symbol)
    const params = new URLSearchParams({
      symbol: tvSymbol,
      interval,
      theme: 'dark',
      style: '1',
      locale: 'zh_CN',
      timezone: 'Asia/Shanghai',
      allow_symbol_change: 'false',
      hide_top_toolbar: 'false',
      hide_legend: 'false',
      withdateranges: 'true',
      save_image: 'false',
      calendar: 'false',
      studies: '[]',
      backgroundColor: 'rgba(2, 6, 23, 1)',
    })
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`
  }, [symbol, interval])

  return (
    <iframe
      src={src}
      style={{ width: '100%', height: `${height}px`, border: 'none' }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
      allowFullScreen
      loading="lazy"
      title={`TradingView ${symbol}`}
    />
  )
}
