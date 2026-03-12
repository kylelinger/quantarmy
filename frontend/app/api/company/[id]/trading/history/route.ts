import { NextResponse } from 'next/server'

const DEMO_TRADES = [
  { id: 't1', symbol: 'BTCUSDT', side: 'buy', size: 0.012, price: 87200, fee: 1.05, strategy: 'PSAR Trend', signal_reason: 'PSAR bull flip + ADX 28.5', executed_at: new Date(Date.now() - 3600_000 * 6).toISOString() },
  { id: 't2', symbol: 'ETHUSDT', side: 'buy', size: 0.25, price: 3380, fee: 0.85, strategy: 'PSAR Trend', signal_reason: 'PSAR bull flip + EMA confirm', executed_at: new Date(Date.now() - 3600_000 * 3).toISOString() },
  { id: 't3', symbol: 'SOLUSDT', side: 'buy', size: 2.5, price: 142.5, fee: 0.36, strategy: 'Breakout Momentum', signal_reason: 'Range breakout + volume spike', executed_at: new Date(Date.now() - 3600_000 * 12).toISOString() },
  { id: 't4', symbol: 'SOLUSDT', side: 'sell', size: 2.5, price: 138.2, fee: 0.35, strategy: 'Breakout Momentum', signal_reason: 'Stop loss hit', executed_at: new Date(Date.now() - 3600_000 * 8).toISOString() },
  { id: 't5', symbol: 'BNBUSDT', side: 'buy', size: 0.8, price: 612, fee: 0.49, strategy: 'RSI Mean Reversion', signal_reason: 'RSI oversold 26.8', executed_at: new Date(Date.now() - 86400_000).toISOString() },
  { id: 't6', symbol: 'BNBUSDT', side: 'sell', size: 0.8, price: 625, fee: 0.50, strategy: 'RSI Mean Reversion', signal_reason: 'Take profit hit', executed_at: new Date(Date.now() - 3600_000 * 18).toISOString() },
]

export async function GET() {
  return NextResponse.json({ ok: true, data: DEMO_TRADES, error: null })
}
