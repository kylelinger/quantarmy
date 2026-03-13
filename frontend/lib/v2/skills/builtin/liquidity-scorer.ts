import type { Skill, MarketSnapshot } from '../../types'

export const liquidityScorerSkill: Skill = {
  meta: {
    id: 'liquidity-scorer',
    name: 'Liquidity Scorer',
    version: '1.0.0',
    category: 'execution',
    compatibleRoles: ['executor'],
    description: '流动性评分 (深度/成交量/价差)',
  },
  compute(snapshot: MarketSnapshot) {
    const { quote, depth, recentTrades, klines_1h } = snapshot
    let score = 5 // base score

    // Volume-based scoring
    const vol24h = quote.quote_volume_24h || 0
    if (vol24h > 1e9) score += 3
    else if (vol24h > 1e8) score += 2
    else if (vol24h > 1e7) score += 1
    else if (vol24h < 1e6) score -= 2

    // Spread scoring
    let spreadBps: number | null = null
    if (depth && depth.bids.length > 0 && depth.asks.length > 0) {
      const bestBid = depth.bids[0].price
      const bestAsk = depth.asks[0].price
      spreadBps = bestBid > 0 ? (bestAsk - bestBid) / bestBid * 10000 : null
      if (spreadBps !== null) {
        if (spreadBps < 5) score += 2
        else if (spreadBps < 20) score += 1
        else if (spreadBps > 50) score -= 1
        else if (spreadBps > 100) score -= 2
      }
    }

    // Trade frequency
    const tradeFreq = recentTrades.length // recent trades count
    if (tradeFreq > 80) score += 1
    else if (tradeFreq < 10) score -= 1

    score = Math.max(1, Math.min(10, score))

    const level = score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'adequate' : 'poor'

    return {
      skillId: 'liquidity-scorer',
      data: {
        score,
        level,
        spread_bps: spreadBps,
        volume_24h_usd: vol24h,
        trade_frequency: tradeFreq,
        has_depth: !!depth,
      },
      summary: `流动性 ${score}/10 (${level}) | 24h量 $${formatNum(vol24h)}${spreadBps !== null ? ` | 价差 ${spreadBps.toFixed(1)}bps` : ''}`,
    }
  },
}

function formatNum(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(0)
}
