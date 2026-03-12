import { NextResponse } from 'next/server'

const BINANCE_BASE = 'https://data-api.binance.vision'

function isCrypto(symbol: string): boolean {
  return symbol.endsWith('USDT') || symbol.endsWith('BTC') || symbol.endsWith('BUSD')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase() || ''
  const limit = parseInt(searchParams.get('limit') || '100')

  if (!symbol) {
    return NextResponse.json({ ok: false, data: null, error: 'symbol required' }, { status: 400 })
  }

  // Recent trades only available for crypto
  if (!isCrypto(symbol)) {
    return NextResponse.json({
      ok: true,
      data: [],
      error: null,
    })
  }

  try {
    const resp = await fetch(
      `${BINANCE_BASE}/api/v3/trades?symbol=${symbol}&limit=${limit}`,
      { next: { revalidate: 5 } }
    )
    if (!resp.ok) throw new Error(`Binance ${resp.status}`)
    const trades = await resp.json()

    return NextResponse.json({
      ok: true,
      data: trades.map((t: any) => ({
        price: parseFloat(t.price),
        qty: parseFloat(t.qty),
        quoteQty: parseFloat(t.quoteQty),
        time: t.time,
        isBuyerMaker: t.isBuyerMaker,
      })),
      error: null,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, data: null, error: e.message }, { status: 502 })
  }
}
