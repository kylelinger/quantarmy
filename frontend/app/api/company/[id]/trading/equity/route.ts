import { NextResponse } from 'next/server'

function generateDemoEquity() {
  const points = []
  let equity = 100000
  const now = Date.now()
  const dayMs = 86400_000

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now - i * dayMs)
    const dateStr = date.toISOString().slice(0, 10)

    // Simulate realistic equity curve with some variance
    const dailyReturn = (Math.random() - 0.47) * 0.012  // slight upward bias
    equity = equity * (1 + dailyReturn)
    equity = Math.max(equity * 0.95, equity)  // floor at 5% single day

    points.push({ time: dateStr, value: Math.round(equity * 100) / 100 })
  }

  return points
}

export async function GET() {
  return NextResponse.json({ ok: true, data: generateDemoEquity(), error: null })
}
