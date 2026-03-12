import { NextResponse } from 'next/server'

const BINANCE_BASE = 'https://data-api.binance.vision'

function detectSource(symbol: string): 'binance' | 'yahoo' {
  if (symbol.endsWith('USDT') || symbol.endsWith('BTC') || symbol.endsWith('BUSD')) return 'binance'
  return 'yahoo'
}

function detectMarket(symbol: string): string {
  if (symbol.endsWith('USDT') || symbol.endsWith('BTC') || symbol.endsWith('BUSD')) return 'crypto'
  if (symbol.endsWith('.HK')) return 'hk_stock'
  if (symbol.endsWith('.SS') || symbol.endsWith('.SZ')) return 'a_share'
  return 'us_stock'
}

async function fetchBinanceTicker(symbol: string) {
  const resp = await fetch(`${BINANCE_BASE}/api/v3/ticker/24hr?symbol=${symbol}`, { next: { revalidate: 10 } })
  if (!resp.ok) throw new Error(`Binance ${resp.status}`)
  const d = await resp.json()
  return {
    symbol,
    price: parseFloat(d.lastPrice),
    change_24h: parseFloat(d.priceChange),
    change_pct_24h: parseFloat(d.priceChangePercent),
    high_24h: parseFloat(d.highPrice),
    low_24h: parseFloat(d.lowPrice),
    volume_24h: parseFloat(d.volume),
    quote_volume_24h: parseFloat(d.quoteVolume),
    market: 'crypto',
    source: 'binance',
    delayed: false,
  }
}

async function fetchYahooTicker(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2d&interval=1d&includePrePost=false`
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 30 },
  })
  if (!resp.ok) throw new Error(`Yahoo Finance ${resp.status}`)
  const json = await resp.json()

  const meta = json.chart?.result?.[0]?.meta
  if (!meta) throw new Error('No data from Yahoo Finance')

  const quote = json.chart?.result?.[0]?.indicators?.quote?.[0]
  const timestamps = json.chart?.result?.[0]?.timestamp || []

  const currentPrice = meta.regularMarketPrice ?? 0
  const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? currentPrice

  const change = currentPrice - previousClose
  const changePct = previousClose > 0 ? (change / previousClose) * 100 : 0

  // Get high/low from today's candle if available
  const todayIdx = timestamps.length - 1
  const high = quote?.high?.[todayIdx] ?? currentPrice
  const low = quote?.low?.[todayIdx] ?? currentPrice
  const volume = quote?.volume?.[todayIdx] ?? 0

  return {
    symbol,
    price: currentPrice,
    change_24h: change,
    change_pct_24h: changePct,
    high_24h: high,
    low_24h: low,
    volume_24h: volume,
    quote_volume_24h: volume * currentPrice,
    market: detectMarket(symbol),
    source: 'yahoo',
    delayed: true,
    currency: meta.currency || 'USD',
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase() || ''

  if (!symbol) {
    return NextResponse.json({ ok: false, data: null, error: 'symbol required' }, { status: 400 })
  }

  try {
    const source = detectSource(symbol)
    const data = source === 'binance'
      ? await fetchBinanceTicker(symbol)
      : await fetchYahooTicker(symbol)

    return NextResponse.json({ ok: true, data, error: null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, data: null, error: e.message }, { status: 502 })
  }
}
