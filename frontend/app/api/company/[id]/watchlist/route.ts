import { NextResponse } from 'next/server'
import { demoWatchlist } from '@/lib/demo-store'

export async function GET() {
  return NextResponse.json({ ok: true, data: demoWatchlist, error: null })
}

export async function POST(request: Request) {
  const body = await request.json()

  // Batch add
  if (body.symbols) {
    const existing = new Set(demoWatchlist.map(w => w.symbol))
    const added: string[] = []
    const skipped: string[] = []
    for (const s of body.symbols) {
      const sym = s.symbol.toUpperCase()
      if (existing.has(sym)) { skipped.push(sym); continue }
      demoWatchlist.push({
        id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
        symbol: sym,
        display_name: s.display_name || sym,
        market: s.market || 'crypto',
        notes: s.notes || '',
        tags: s.tags || [],
        priority: s.priority || 0,
        added_at: new Date().toISOString(),
        last_analysis: {},
      })
      existing.add(sym)
      added.push(sym)
    }
    return NextResponse.json({ ok: true, data: { added, skipped, total: added.length }, error: null })
  }

  // Single add
  const sym = body.symbol.toUpperCase()
  if (demoWatchlist.find(w => w.symbol === sym)) {
    return NextResponse.json({ ok: false, data: null, error: `${sym} already in watchlist` }, { status: 409 })
  }

  const newItem = {
    id: 'w' + Date.now().toString(36),
    symbol: sym,
    display_name: body.display_name || sym,
    market: body.market || 'crypto',
    notes: body.notes || '',
    tags: body.tags || [],
    priority: body.priority || 0,
    added_at: new Date().toISOString(),
    last_analysis: {},
  }
  demoWatchlist.push(newItem)
  return NextResponse.json({ ok: true, data: newItem, error: null })
}
