import { NextResponse } from 'next/server'

// In-memory demo store
const DEMO_COMPANY = {
  id: 'demo-001',
  name: 'QuantArmy Demo',
  initial_capital: 100000,
  current_equity: 102450,
  market: 'crypto',
  status: 'active',
}

export async function GET() {
  return NextResponse.json({ ok: true, data: DEMO_COMPANY, error: null })
}

export async function POST(request: Request) {
  const body = await request.json()
  const company = {
    id: 'demo-' + Date.now().toString(36),
    name: body.name || 'My Quant Company',
    initial_capital: body.initial_capital || 100000,
    current_equity: body.initial_capital || 100000,
    market: body.market || 'crypto',
    status: 'active',
  }
  return NextResponse.json({ ok: true, data: company, error: null })
}
