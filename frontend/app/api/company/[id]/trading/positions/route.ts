import { NextResponse } from 'next/server'

const DEMO_POSITIONS = [
  {
    id: 'p1', symbol: 'BTCUSDT', side: 'long', size: 0.015,
    entry_price: 87250.00, current_price: 88420.50, unrealized_pnl: 17.56,
    pnl_pct: 0.013, strategy: 'PSAR Trend', opened_at: new Date(Date.now() - 3600_000 * 4).toISOString(),
  },
  {
    id: 'p2', symbol: 'ETHUSDT', side: 'long', size: 0.85,
    entry_price: 2180.00, current_price: 2195.30, unrealized_pnl: 13.01,
    pnl_pct: 0.007, strategy: 'PSAR Trend', opened_at: new Date(Date.now() - 3600_000 * 2).toISOString(),
  },
  {
    id: 'p3', symbol: 'SOLUSDT', side: 'short', size: 8.5,
    entry_price: 142.80, current_price: 140.20, unrealized_pnl: 22.10,
    pnl_pct: 0.018, strategy: 'PSAR Trend', opened_at: new Date(Date.now() - 3600_000).toISOString(),
  },
]

export async function GET() {
  return NextResponse.json({ ok: true, data: DEMO_POSITIONS, error: null })
}
