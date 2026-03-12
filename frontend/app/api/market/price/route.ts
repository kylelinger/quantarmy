import { NextResponse } from 'next/server'

const BINANCE_BASE = 'https://data-api.binance.vision'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbols = searchParams.get('symbols')

  if (!symbols) {
    return NextResponse.json({ ok: true, data: [], error: null })
  }

  try {
    const resp = await fetch(`${BINANCE_BASE}/api/v3/ticker/price`, { next: { revalidate: 5 } })
    if (!resp.ok) throw new Error(`Binance ${resp.status}`)
    const allPrices: { symbol: string; price: string }[] = await resp.json()
    const priceMap = Object.fromEntries(allPrices.map((t) => [t.symbol, parseFloat(t.price)]))

    const syms = symbols.split(',').map((s) => s.trim().toUpperCase())
    const result = syms.map((s) => ({ symbol: s, price: priceMap[s] ?? 0, source: 'binance' }))

    return NextResponse.json({ ok: true, data: result, error: null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, data: null, error: e.message }, { status: 502 })
  }
}
