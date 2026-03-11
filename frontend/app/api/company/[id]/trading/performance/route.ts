import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      trades: 27,
      win_rate: 0.444,
      profit_factor: 1.07,
      max_drawdown: 0.024,
      sharpe_ratio: 0.07,
      total_return: 0.0245,
    },
    error: null,
  })
}
