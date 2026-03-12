import { NextResponse } from 'next/server'

// In-memory demo watchlist (resets on cold start, fine for demo)
let demoWatchlist = [
  {
    id: 'w1', symbol: 'BTCUSDT', display_name: 'Bitcoin', market: 'crypto',
    notes: '', tags: ['Layer 1', '核心资产'], priority: 2,
    added_at: new Date(Date.now() - 86400_000 * 3).toISOString(),
    last_analysis: {
      strategist: { signal: 'LONG', confidence: 0.72, reason: 'PSAR bull flip | EMA 88100 trending up | ADX 28.5 strong trend', at: new Date(Date.now() - 3600_000).toISOString() },
      risk_officer: { risk_score: 4, notes: '波动率适中，建议仓位不超过15%', at: new Date(Date.now() - 3600_000).toISOString() },
      collector: { sentiment: 0.62, headlines: ['BTC ETF流入创新高', 'SEC批准新的加密货币交易产品', '机构持仓量持续增长'], at: new Date(Date.now() - 7200_000).toISOString() },
      analyst: { trend: '强势上行趋势，MA20/50/200多头排列', support: 85000, resistance: 92000, at: new Date(Date.now() - 3600_000).toISOString() },
    },
  },
  {
    id: 'w2', symbol: 'ETHUSDT', display_name: 'Ethereum', market: 'crypto',
    notes: 'Pectra升级关注', tags: ['Layer 1', 'DeFi'], priority: 1,
    added_at: new Date(Date.now() - 86400_000 * 2).toISOString(),
    last_analysis: {
      strategist: { signal: 'LONG', confidence: 0.58, reason: 'PSAR bull flip | EMA支撑但动能偏弱 | ADX 22.1', at: new Date(Date.now() - 7200_000).toISOString() },
      risk_officer: { risk_score: 5, notes: 'ETH/BTC比值低位，注意回调风险', at: new Date(Date.now() - 7200_000).toISOString() },
      collector: { sentiment: 0.45, headlines: ['ETH质押率突破30%', 'Pectra升级时间线确认', 'L2生态TVL持续增长'], at: new Date(Date.now() - 10800_000).toISOString() },
    },
  },
  {
    id: 'w3', symbol: 'SOLUSDT', display_name: 'Solana', market: 'crypto',
    notes: '', tags: ['Layer 1', '高Beta'], priority: 1,
    added_at: new Date(Date.now() - 86400_000).toISOString(),
    last_analysis: {
      strategist: { signal: 'HOLD', confidence: 0.45, reason: 'PSAR中性 | ADX 18.2 低波动震荡', at: new Date(Date.now() - 3600_000 * 4).toISOString() },
      risk_officer: { risk_score: 6, notes: '近期波动较大，建议小仓位', at: new Date(Date.now() - 3600_000 * 4).toISOString() },
    },
  },
  {
    id: 'w4', symbol: 'XRPUSDT', display_name: 'XRP', market: 'crypto',
    notes: '', tags: [], priority: 0,
    added_at: new Date(Date.now() - 3600_000 * 12).toISOString(),
    last_analysis: {},
  },
]

export async function GET() {
  return NextResponse.json({ ok: true, data: demoWatchlist, error: null })
}

export async function POST(request: Request) {
  const body = await request.json()

  // Batch add
  if (body.symbols) {
    const existing = new Set(demoWatchlist.map(w => w.symbol))
    const added: string[] = []
    const skipped: string[] = []
    for (const s of body.symbols) {
      const sym = s.symbol.toUpperCase()
      if (existing.has(sym)) { skipped.push(sym); continue }
      demoWatchlist.push({
        id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
        symbol: sym,
        display_name: s.display_name || sym,
        market: s.market || 'crypto',
        notes: s.notes || '',
        tags: s.tags || [],
        priority: s.priority || 0,
        added_at: new Date().toISOString(),
        last_analysis: {},
      })
      existing.add(sym)
      added.push(sym)
    }
    return NextResponse.json({ ok: true, data: { added, skipped, total: added.length }, error: null })
  }

  // Single add
  const sym = body.symbol.toUpperCase()
  if (demoWatchlist.find(w => w.symbol === sym)) {
    return NextResponse.json({ ok: false, data: null, error: `${sym} already in watchlist` }, { status: 409 })
  }

  const newItem = {
    id: 'w' + Date.now().toString(36),
    symbol: sym,
    display_name: body.display_name || sym,
    market: body.market || 'crypto',
    notes: body.notes || '',
    tags: body.tags || [],
    priority: body.priority || 0,
    added_at: new Date().toISOString(),
    last_analysis: {},
  }
  demoWatchlist.push(newItem)
  return NextResponse.json({ ok: true, data: newItem, error: null })
}
