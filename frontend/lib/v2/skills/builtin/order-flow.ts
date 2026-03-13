import type { Skill, MarketSnapshot } from '../../types'

export const orderFlowSkill: Skill = {
  meta: {
    id: 'order-flow',
    name: 'Order Flow Analyzer',
    version: '1.0.0',
    category: 'data',
    compatibleRoles: ['collector', 'executor'],
    description: '资金流向 + 大单分析',
  },
  compute(snapshot: MarketSnapshot) {
    const { depth, recentTrades } = snapshot

    if (!depth && recentTrades.length === 0) {
      return { skillId: 'order-flow', data: { available: false }, summary: '无深度/成交数据 (非加密标的)' }
    }

    // Depth analysis
    let bidWall: number | null = null
    let askWall: number | null = null
    let depthImbalance: number | null = null
    if (depth && depth.bids.length > 0 && depth.asks.length > 0) {
      const bidVols = depth.bids.map(d => d.qty)
      const askVols = depth.asks.map(d => d.qty)
      bidWall = Math.max(...bidVols)
      askWall = Math.max(...askVols)
      const bidTotal = bidVols.reduce((s, v) => s + v, 0)
      const askTotal = askVols.reduce((s, v) => s + v, 0)
      depthImbalance = (bidTotal + askTotal) > 0 ? (bidTotal - askTotal) / (bidTotal + askTotal) : 0
    }

    // Trade flow analysis
    let buyPct: number | null = null
    let avgTradeSize: number | null = null
    let largeTradeCount = 0
    if (recentTrades.length > 0) {
      const buyCount = recentTrades.filter(t => !t.isBuyerMaker).length
      buyPct = buyCount / recentTrades.length * 100
      avgTradeSize = recentTrades.reduce((s, t) => s + t.qty * t.price, 0) / recentTrades.length
      const threshold = avgTradeSize * 5
      largeTradeCount = recentTrades.filter(t => t.qty * t.price > threshold).length
    }

    const flowDirection = depthImbalance !== null
      ? (depthImbalance > 0.2 ? 'buy_pressure' : depthImbalance < -0.2 ? 'sell_pressure' : 'balanced')
      : buyPct !== null
        ? (buyPct > 60 ? 'buy_pressure' : buyPct < 40 ? 'sell_pressure' : 'balanced')
        : 'unknown'

    return {
      skillId: 'order-flow',
      data: {
        available: true,
        bid_wall: bidWall,
        ask_wall: askWall,
        depth_imbalance: depthImbalance,
        buy_pct: buyPct,
        avg_trade_size: avgTradeSize,
        large_trades: largeTradeCount,
        flow_direction: flowDirection,
      },
      summary: `资金流向: ${flowDirection === 'buy_pressure' ? '买盘压力' : flowDirection === 'sell_pressure' ? '卖盘压力' : '均衡'}${buyPct !== null ? ` | 主买 ${buyPct.toFixed(0)}%` : ''}`,
    }
  },
}
