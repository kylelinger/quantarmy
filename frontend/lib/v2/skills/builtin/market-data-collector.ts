import type { Skill, MarketSnapshot } from '../../types'

export const marketDataCollectorSkill: Skill = {
  meta: {
    id: 'market-data-collector',
    name: 'Market Data Collector',
    version: '1.0.0',
    category: 'data',
    compatibleRoles: ['collector'],
    description: '多源数据聚合 + 24h行情统计',
  },
  compute(snapshot: MarketSnapshot) {
    const { quote, klines_1h, depth, recentTrades } = snapshot
    const price = quote.price
    const vol24h = quote.volume_24h || 0
    const quoteVol = quote.quote_volume_24h || 0

    // Price range from 24h klines
    const recent24h = klines_1h.slice(-24)
    const high24h = recent24h.length > 0 ? Math.max(...recent24h.map(k => k.high)) : price
    const low24h = recent24h.length > 0 ? Math.min(...recent24h.map(k => k.low)) : price
    const rangePct = low24h > 0 ? (high24h - low24h) / low24h * 100 : 0

    // Bid-ask analysis from depth
    let bidAskRatio: number | null = null
    if (depth && depth.bids.length > 0 && depth.asks.length > 0) {
      const bidTotal = depth.bids.reduce((s, d) => s + d.qty, 0)
      const askTotal = depth.asks.reduce((s, d) => s + d.qty, 0)
      bidAskRatio = askTotal > 0 ? bidTotal / askTotal : null
    }

    // Large trades
    let largeTrades = 0
    let netFlow: number | null = null
    if (recentTrades.length > 0) {
      const avgQty = recentTrades.reduce((s, t) => s + t.qty, 0) / recentTrades.length
      largeTrades = recentTrades.filter(t => t.qty > avgQty * 3).length
      const buyVol = recentTrades.filter(t => t.isBuyerMaker === false).reduce((s, t) => s + t.qty * t.price, 0)
      const sellVol = recentTrades.filter(t => t.isBuyerMaker === true).reduce((s, t) => s + t.qty * t.price, 0)
      netFlow = buyVol - sellVol
    }

    return {
      skillId: 'market-data-collector',
      data: {
        price,
        volume_24h: vol24h,
        quote_volume_24h: quoteVol,
        high_24h: high24h,
        low_24h: low24h,
        range_pct: rangePct,
        bid_ask_ratio: bidAskRatio,
        large_trades: largeTrades,
        net_flow: netFlow,
        klines_count: klines_1h.length,
        has_depth: !!depth,
        has_trades: recentTrades.length > 0,
      },
      summary: `价格 ${price} | 24h量 ${formatNum(quoteVol)} | 振幅 ${rangePct.toFixed(1)}%${bidAskRatio !== null ? ` | 买卖比 ${bidAskRatio.toFixed(2)}` : ''}`,
    }
  },
}

function formatNum(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(0)
}
