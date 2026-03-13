import type { Skill, MarketSnapshot } from '../../types'

export const slippageEstimatorSkill: Skill = {
  meta: {
    id: 'slippage-estimator',
    name: 'Slippage Estimator',
    version: '1.0.0',
    category: 'execution',
    compatibleRoles: ['executor'],
    description: '滑点估算 ($1K/$10K/$50K)',
  },
  compute(snapshot: MarketSnapshot) {
    const { depth, quote } = snapshot
    const price = quote.price

    if (!depth || depth.asks.length === 0) {
      return {
        skillId: 'slippage-estimator',
        data: { available: false },
        summary: '无深度数据，无法估算滑点',
      }
    }

    // Simulate market order slippage at different sizes
    const slippage1k = estimateSlippage(depth.asks.map(d => [d.price, d.qty] as [number, number]), 1000, price)
    const slippage10k = estimateSlippage(depth.asks.map(d => [d.price, d.qty] as [number, number]), 10000, price)
    const slippage50k = estimateSlippage(depth.asks.map(d => [d.price, d.qty] as [number, number]), 50000, price)

    const worstCase = slippage50k
    const executionRisk = worstCase > 100 ? 'high' : worstCase > 30 ? 'moderate' : 'low'

    return {
      skillId: 'slippage-estimator',
      data: {
        available: true,
        slippage_1k_bps: slippage1k,
        slippage_10k_bps: slippage10k,
        slippage_50k_bps: slippage50k,
        execution_risk: executionRisk,
        depth_levels: depth.asks.length,
      },
      summary: `滑点: $1K=${slippage1k.toFixed(1)}bps $10K=${slippage10k.toFixed(1)}bps $50K=${slippage50k.toFixed(1)}bps | ${executionRisk}`,
    }
  },
}

function estimateSlippage(asks: [number, number][], notionalUsd: number, midPrice: number): number {
  let remaining = notionalUsd
  let totalCost = 0
  for (const [askPrice, qty] of asks) {
    const levelValue = askPrice * qty
    const fill = Math.min(remaining, levelValue)
    totalCost += fill * (askPrice / midPrice)
    remaining -= fill
    if (remaining <= 0) break
  }
  if (remaining > 0) totalCost += remaining * 1.01 // assume 1% slippage for unfilled
  const avgPrice = notionalUsd > 0 ? totalCost / notionalUsd * midPrice : midPrice
  return (avgPrice - midPrice) / midPrice * 10000
}
