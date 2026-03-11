import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      id: 'demo-001',
      name: 'QuantArmy Demo',
      initial_capital: 100000,
      current_equity: 102450,
      market: 'crypto',
      status: 'active',
    },
    error: null,
  })
}
