import { NextResponse } from 'next/server'

const BINANCE_BASE = 'https://data-api.binance.vision'
const SINA_KLINE = 'https://quotes.sina.cn/cn/api/jsonp_v2.php/data/CN_MarketDataService.getKLineData'
const SINA_HK_KLINE = 'https://finance.sina.com.cn/stock/hkstock'

function detectSource(symbol: string): 'binance' | 'sina' {
  if (symbol.endsWith('USDT') || symbol.endsWith('BTC') || symbol.endsWith('BUSD')) return 'binance'
  return 'sina'
}

function detectMarket(symbol: string): 'a_share' | 'hk_stock' | 'crypto' {
  if (symbol.endsWith('.SS') || symbol.endsWith('.SZ')) return 'a_share'
  if (symbol.endsWith('.HK')) return 'hk_stock'
  return 'crypto'
}

// Binance interval mapping
const BINANCE_INTERVALS: Record<string, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
  '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w',
}

// Sina interval mapping for A-shares
const SINA_INTERVALS: Record<string, string> = {
  '5m': '5', '15m': '15', '30m': '30', '1h': '60',
  '1d': '1440', '1w': '10080',
}

async function fetchBinanceKlines(symbol: string, interval: string, limit: number) {
  const binanceInterval = BINANCE_INTERVALS[interval] || '1h'
  const resp = await fetch(
    `${BINANCE_BASE}/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`,
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

async function fetchSinaAShareKlines(symbol: string, interval: string, limit: number) {
  // Convert symbol: 600519.SS → sh600519
  const sinaSymbol = symbol.endsWith('.SS')
    ? `sh${symbol.replace('.SS', '')}`
    : `sz${symbol.replace('.SZ', '')}`

  const scale = SINA_INTERVALS[interval] || '60'
  const datalen = Math.min(limit, 1023) // Sina max

  const url = `https://quotes.sina.cn/cn/api/jsonp_v2.php/data/CN_MarketDataService.getKLineData?symbol=${sinaSymbol}&scale=${scale}&datalen=${datalen}`

  const resp = await fetch(url, {
    headers: { 'Referer': 'https://finance.sina.com.cn', 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 30 },
  })
  if (!resp.ok) throw new Error(`Sina klines ${resp.status}`)

  const text = await resp.text()
  // Response: data([{day:"2026-03-12 15:00:00",open:"1800.00",high:...},...])
  const jsonMatch = text.match(/\((\[.*\])\)/)
  if (!jsonMatch) throw new Error('Sina klines parse error')

  const arr = JSON.parse(jsonMatch[1])
  return arr.map((k: any) => ({
    time: new Date(k.day).getTime(),
    open: parseFloat(k.open),
    high: parseFloat(k.high),
    low: parseFloat(k.low),
    close: parseFloat(k.close),
    volume: parseFloat(k.volume),
  }))
}

async function fetchSinaHKKlines(symbol: string, interval: string, limit: number) {
  // For HK stocks, use Yahoo Finance as fallback for klines (Sina HK kline API is less reliable)
  // Yahoo klines are fine for historical data — the "delay" issue is only for live quotes
  const code = symbol.replace('.HK', '')
  const yahooSymbol = `${code.padStart(4, '0')}.HK`

  const periodMap: Record<string, { yahooInterval: string; range: string }> = {
    '5m': { yahooInterval: '5m', range: '5d' },
    '15m': { yahooInterval: '15m', range: '10d' },
    '30m': { yahooInterval: '30m', range: '30d' },
    '1h': { yahooInterval: '60m', range: '30d' },
    '4h': { yahooInterval: '60m', range: '60d' },  // fetch 1h, aggregate later
    '1d': { yahooInterval: '1d', range: '2y' },
    '1w': { yahooInterval: '1wk', range: '5y' },
  }

  const config = periodMap[interval] || periodMap['1h']
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${config.range}&interval=${config.yahooInterval}&includePrePost=false`

  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 60 },
  })
  if (!resp.ok) throw new Error(`Yahoo HK klines ${resp.status}`)
  const json = await resp.json()

  const result = json.chart?.result?.[0]
  if (!result) throw new Error('No kline data from Yahoo')

  const timestamps = result.timestamp || []
  const q = result.indicators?.quote?.[0] || {}

  let klines = timestamps.map((t: number, i: number) => ({
    time: t * 1000,
    open: q.open?.[i] ?? 0,
    high: q.high?.[i] ?? 0,
    low: q.low?.[i] ?? 0,
    close: q.close?.[i] ?? 0,
    volume: q.volume?.[i] ?? 0,
  })).filter((k: any) => k.open > 0 && k.close > 0)

  // Aggregate 4h from 1h if needed
  if (interval === '4h') klines = aggregate4h(klines)

  return klines.slice(-limit)
}

function aggregate4h(hourlyKlines: any[]) {
  const result: any[] = []
  for (let i = 0; i < hourlyKlines.length; i += 4) {
    const chunk = hourlyKlines.slice(i, i + 4)
    if (chunk.length === 0) continue
    result.push({
      time: chunk[0].time,
      open: chunk[0].open,
      high: Math.max(...chunk.map((c: any) => c.high)),
      low: Math.min(...chunk.map((c: any) => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((s: number, c: any) => s + c.volume, 0),
    })
  }
  return result
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
    let data

    if (source === 'binance') {
      data = await fetchBinanceKlines(symbol, interval, limit)
    } else {
      const market = detectMarket(symbol)
      if (market === 'a_share') {
        data = await fetchSinaAShareKlines(symbol, interval, limit)
      } else {
        data = await fetchSinaHKKlines(symbol, interval, limit)
      }
    }

    return NextResponse.json({ ok: true, data, error: null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, data: null, error: e.message }, { status: 502 })
  }
}
