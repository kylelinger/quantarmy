import { NextResponse } from 'next/server'

// Performance managed client-side via paper-trading.ts
export async function GET() {
  return NextResponse.json({
    ok: true,
    data: { trades: 0, win_rate: 0, profit_factor: 0, max_drawdown: 0, sharpe_ratio: 0, total_return: 0 },
    error: null,
  })
}
