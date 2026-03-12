import { NextResponse } from 'next/server'

const BINANCE_BASE = 'https://data-api.binance.vision'
const SINA_HQ = 'https://hq.sinajs.cn'

function detectSource(symbol: string): 'binance' | 'sina' {
  if (symbol.endsWith('USDT') || symbol.endsWith('BTC') || symbol.endsWith('BUSD')) return 'binance'
  return 'sina'
}

function detectMarket(symbol: string): string {
  if (symbol.endsWith('USDT') || symbol.endsWith('BTC') || symbol.endsWith('BUSD')) return 'crypto'
  if (symbol.endsWith('.HK')) return 'hk_stock'
  if (symbol.endsWith('.SS') || symbol.endsWith('.SZ')) return 'a_share'
  return 'unknown'
}

// Convert our symbol format to Sina format
// A-shares: 600519.SS → sh600519, 000001.SZ → sz000001
// HK: 0700.HK → hk00700
function toSinaSymbol(symbol: string): string {
  if (symbol.endsWith('.SS')) return `sh${symbol.replace('.SS', '')}`
  if (symbol.endsWith('.SZ')) return `sz${symbol.replace('.SZ', '')}`
  if (symbol.endsWith('.HK')) return `hk${symbol.replace('.HK', '').padStart(5, '0')}`
  return symbol
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

async function fetchSinaTicker(symbol: string) {
  const sinaSymbol = toSinaSymbol(symbol)
  const market = detectMarket(symbol)

  const resp = await fetch(`${SINA_HQ}/list=${sinaSymbol}`, {
    headers: {
      'Referer': 'https://finance.sina.com.cn',
      'User-Agent': 'Mozilla/5.0',
    },
    next: { revalidate: 5 },
  })

  if (!resp.ok) throw new Error(`Sina Finance ${resp.status}`)

  // Sina returns GBK-encoded text like: var hq_str_sh600519="贵州茅台,1800.00,..."
  const buffer = await resp.arrayBuffer()
  // Try decoding as GBK first, fallback to UTF-8
  let text: string
  try {
    text = new TextDecoder('gbk').decode(buffer)
  } catch {
    text = new TextDecoder('utf-8').decode(buffer)
  }

  const match = text.match(/"([^"]*)"/)
  if (!match || !match[1]) throw new Error('Sina returned empty data')

  const fields = match[1].split(',')

  if (market === 'a_share') {
    // A-share format: name,open,prevClose,price,high,low,bid,ask,volume,turnover,...
    const name = fields[0]
    const open = parseFloat(fields[1])
    const prevClose = parseFloat(fields[2])
    const price = parseFloat(fields[3])
    const high = parseFloat(fields[4])
    const low = parseFloat(fields[5])
    const volume = parseFloat(fields[8])         // shares
    const turnover = parseFloat(fields[9])        // CNY

    const change = price - prevClose
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0

    return {
      symbol, price, change_24h: change, change_pct_24h: changePct,
      high_24h: high, low_24h: low,
      volume_24h: volume, quote_volume_24h: turnover,
      market: 'a_share', source: 'sina', delayed: false,
      currency: 'CNY', name,
    }
  } else {
    // HK format: name_en,name_cn,open,prevClose,high,low,price,change,changePct,...,volume,turnover,...
    const nameEn = fields[0]
    const nameCn = fields[1]
    const open = parseFloat(fields[2])
    const prevClose = parseFloat(fields[3])
    const high = parseFloat(fields[4])
    const low = parseFloat(fields[5])
    const price = parseFloat(fields[6])
    const change = parseFloat(fields[7])
    const changePct = parseFloat(fields[8])
    const volume = parseFloat(fields[12])         // shares
    const turnover = parseFloat(fields[11])       // HKD

    return {
      symbol, price, change_24h: change, change_pct_24h: changePct,
      high_24h: high, low_24h: low,
      volume_24h: volume, quote_volume_24h: turnover,
      market: 'hk_stock', source: 'sina', delayed: false,
      currency: 'HKD', name: nameCn || nameEn,
    }
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
      : await fetchSinaTicker(symbol)

    return NextResponse.json({ ok: true, data, error: null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, data: null, error: e.message }, { status: 502 })
  }
}
