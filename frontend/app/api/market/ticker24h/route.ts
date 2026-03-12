import { NextResponse } from 'next/server'

const BINANCE_BASE = 'https://data-api.binance.vision'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase()

  if (!symbol) {
    return NextResponse.json({ ok: false, data: null, error: 'symbol required' }, { status: 400 })
  }

  try {
    const resp = await fetch(`${BINANCE_BASE}/api/v3/ticker/24hr?symbol=${symbol}`, { next: { revalidate: 10 } })
    if (!resp.ok) throw new Error(`Binance ${resp.status}`)
    const d = await resp.json()

    return NextResponse.json({
      ok: true,
      data: {
        symbol,
        price: parseFloat(d.lastPrice),
        change_24h: parseFloat(d.priceChange),
        change_pct_24h: parseFloat(d.priceChangePercent),
        high_24h: parseFloat(d.highPrice),
        low_24h: parseFloat(d.lowPrice),
        volume_24h: parseFloat(d.volume),
        quote_volume_24h: parseFloat(d.quoteVolume),
        source: 'binance',
      },
      error: null,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, data: null, error: e.message }, { status: 502 })
  }
}
