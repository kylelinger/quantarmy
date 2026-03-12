import { NextResponse } from 'next/server'

const DEMO_POSITIONS = [
  {
    id: 'pos-1',
    symbol: 'BTCUSDT',
    side: 'long',
    size: 0.012,
    entry_price: 87200,
    current_price: 88450,
    unrealized_pnl: 15.0,
    pnl_pct: 0.0143,
    opened_at: new Date(Date.now() - 3600_000 * 6).toISOString(),
  },
  {
    id: 'pos-2',
    symbol: 'ETHUSDT',
    side: 'long',
    size: 0.25,
    entry_price: 3380,
    current_price: 3415,
    unrealized_pnl: 8.75,
    pnl_pct: 0.0104,
    opened_at: new Date(Date.now() - 3600_000 * 3).toISOString(),
  },
]

export async function GET() {
  return NextResponse.json({ ok: true, data: DEMO_POSITIONS, error: null })
}
