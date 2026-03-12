import { NextResponse } from 'next/server'

const BINANCE_BASE = 'https://data-api.binance.vision'

function isCrypto(symbol: string): boolean {
  return symbol.endsWith('USDT') || symbol.endsWith('BTC') || symbol.endsWith('BUSD')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase() || ''
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!symbol) {
    return NextResponse.json({ ok: false, data: null, error: 'symbol required' }, { status: 400 })
  }

  // Depth only available for crypto (Binance)
  if (!isCrypto(symbol)) {
    return NextResponse.json({
      ok: true,
      data: { bids: [], asks: [], source: 'unavailable', note: 'Orderbook depth not available for stocks' },
      error: null,
    })
  }

  try {
    const resp = await fetch(
      `${BINANCE_BASE}/api/v3/depth?symbol=${symbol}&limit=${limit}`,
      { next: { revalidate: 5 } }
    )
    if (!resp.ok) throw new Error(`Binance ${resp.status}`)
    const d = await resp.json()

    return NextResponse.json({
      ok: true,
      data: {
        bids: (d.bids || []).map((b: string[]) => ({ price: parseFloat(b[0]), qty: parseFloat(b[1]) })),
        asks: (d.asks || []).map((a: string[]) => ({ price: parseFloat(a[0]), qty: parseFloat(a[1]) })),
        source: 'binance',
      },
      error: null,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, data: null, error: e.message }, { status: 502 })
  }
}
