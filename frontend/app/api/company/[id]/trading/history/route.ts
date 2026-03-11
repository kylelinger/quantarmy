import { NextResponse } from 'next/server'

const now = Date.now()
const DEMO_TRADES = [
  { id: 't1', symbol: 'BTCUSDT', side: 'buy', size: 0.015, price: 87250.00, fee: 1.31, strategy: 'PSAR Trend', signal_reason: 'PSAR bull flip | EMA 87100 | ADX 28.5', executed_at: new Date(now - 3600_000 * 4).toISOString() },
  { id: 't2', symbol: 'ETHUSDT', side: 'buy', size: 0.85, price: 2180.00, fee: 1.85, strategy: 'PSAR Trend', signal_reason: 'PSAR bull flip | EMA 2165 | ADX 24.1', executed_at: new Date(now - 3600_000 * 2).toISOString() },
  { id: 't3', symbol: 'SOLUSDT', side: 'sell', size: 8.5, price: 142.80, fee: 1.21, strategy: 'PSAR Trend', signal_reason: 'PSAR bear flip | EMA 143.5 | ADX 31.2', executed_at: new Date(now - 3600_000).toISOString() },
  { id: 't4', symbol: 'BNBUSDT', side: 'buy', size: 0.55, price: 620.40, fee: 0.34, strategy: 'PSAR Trend', signal_reason: 'PSAR bull flip | EMA 618.2 | ADX 22.7', executed_at: new Date(now - 3600_000 * 6).toISOString() },
  { id: 't5', symbol: 'BNBUSDT', side: 'sell', size: 0.55, price: 625.10, fee: 0.34, strategy: 'PSAR Trend', signal_reason: 'PSAR bear flip | take profit', executed_at: new Date(now - 3600_000 * 5).toISOString() },
]

export async function GET() {
  return NextResponse.json({ ok: true, data: DEMO_TRADES, error: null })
}
