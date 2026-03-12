import { NextResponse } from 'next/server'

const DEMO_PERFORMANCE = {
  trades: 34,
  win_rate: 0.441,
  profit_factor: 1.12,
  max_drawdown: 0.028,
  sharpe_ratio: 0.15,
  total_return: 0.0245,
}

export async function GET() {
  return NextResponse.json({ ok: true, data: DEMO_PERFORMANCE, error: null })
}
