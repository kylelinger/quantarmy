import { NextResponse } from 'next/server'

const BINANCE_BASE = 'https://data-api.binance.vision'

function detectSource(symbol: string): 'binance' | 'yahoo' {
  if (symbol.endsWith('USDT') || symbol.endsWith('BTC') || symbol.endsWith('BUSD')) return 'binance'
  return 'yahoo'
}

// Map our interval names to Yahoo Finance range/interval
function yahooParams(interval: string): { range: string; yahooInterval: string } {
  switch (interval) {
    case '1m':  return { range: '1d', yahooInterval: '1m' }
    case '5m':  return { range: '5d', yahooInterval: '5m' }
    case '15m': return { range: '5d', yahooInterval: '15m' }
    case '30m': return { range: '1mo', yahooInterval: '30m' }
    case '1h':  return { range: '1mo', yahooInterval: '1h' }
    case '4h':  return { range: '6mo', yahooInterval: '1h' } // Yahoo doesn't have 4h, use 1h and aggregate
    case '1d':  return { range: '1y', yahooInterval: '1d' }
    case '1w':  return { range: '5y', yahooInterval: '1wk' }
    case '1M':  return { range: '10y', yahooInterval: '1mo' }
    default:    return { range: '1mo', yahooInterval: '1h' }
  }
}

async function fetchBinanceKlines(symbol: string, interval: string, limit: number) {
  const resp = await fetch(
    `${BINANCE_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    { next: { revalidate: 30 } }
  )
  if (!resp.ok) throw new Error(`Binance ${resp.status}`)
  const data = await resp.json()
  return data.map((k: any[]) => ({
    time: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }))
}

function aggregate4h(hourlyKlines: any[]): any[] {
  const result: any[] = []
  for (let i = 0; i < hourlyKlines.length; i += 4) {
    const chunk = hourlyKlines.slice(i, i + 4)
    if (chunk.length === 0) continue
    result.push({
      time: chunk[0].time,
      open: chunk[0].open,
      high: Math.max(...chunk.map((k: any) => k.high)),
      low: Math.min(...chunk.map((k: any) => k.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((s: number, k: any) => s + k.volume, 0),
    })
  }
  return result
}

async function fetchYahooKlines(symbol: string, interval: string, limit: number) {
  const { range, yahooInterval } = yahooParams(interval)

  // Yahoo Finance v8 chart API
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${yahooInterval}&includePrePost=false`
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 60 },
  })
  if (!resp.ok) throw new Error(`Yahoo Finance ${resp.status}`)
  const json = await resp.json()

  const result = json.chart?.result?.[0]
  if (!result) throw new Error('No data from Yahoo Finance')

  const timestamps = result.timestamp || []
  const quote = result.indicators?.quote?.[0] || {}
  const opens = quote.open || []
  const highs = quote.high || []
  const lows = quote.low || []
  const closes = quote.close || []
  const volumes = quote.volume || []

  let klines = timestamps.map((t: number, i: number) => ({
    time: t * 1000,
    open: opens[i] ?? 0,
    high: highs[i] ?? 0,
    low: lows[i] ?? 0,
    close: closes[i] ?? 0,
    volume: volumes[i] ?? 0,
  })).filter((k: any) => k.close > 0) // filter out null candles

  // Aggregate to 4h if requested
  if (interval === '4h') {
    klines = aggregate4h(klines)
  }

  return klines.slice(-limit)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase() || ''
  const interval = searchParams.get('interval') || '1h'
  const limit = parseInt(searchParams.get('limit') || '200')

  if (!symbol) {
    return NextResponse.json({ ok: false, data: null, error: 'symbol required' }, { status: 400 })
  }

  try {
    const source = detectSource(symbol)
    const klines = source === 'binance'
      ? await fetchBinanceKlines(symbol, interval, limit)
      : await fetchYahooKlines(symbol, interval, limit)

    return NextResponse.json({ ok: true, data: klines, error: null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, data: null, error: e.message }, { status: 502 })
  }
}
