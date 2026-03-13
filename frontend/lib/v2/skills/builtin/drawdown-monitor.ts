import type { Skill, MarketSnapshot } from '../../types'

export const drawdownMonitorSkill: Skill = {
  meta: {
    id: 'drawdown-monitor',
    name: 'Drawdown Monitor',
    version: '1.0.0',
    category: 'risk',
    compatibleRoles: ['risk_officer'],
    description: '最大回撤 + 当前回撤深度监控',
  },
  compute(snapshot: MarketSnapshot) {
    const closes = snapshot.klines_1d.map(k => k.close)
    if (closes.length < 10) {
      return { skillId: 'drawdown-monitor', data: {}, summary: '数据不足' }
    }

    // Calculate max drawdown over different periods
    const dd7 = maxDrawdown(closes.slice(-7))
    const dd30 = maxDrawdown(closes.slice(-30))
    const dd90 = maxDrawdown(closes.slice(-90))

    // Current drawdown from recent peak
    const recent30 = closes.slice(-30)
    const peak = Math.max(...recent30)
    const current = closes[closes.length - 1]
    const currentDd = peak > 0 ? (peak - current) / peak * 100 : 0

    // Recovery potential
    const recoveryNeeded = currentDd > 0 ? (peak / current - 1) * 100 : 0

    const riskLevel = currentDd > 20 ? 'critical' : currentDd > 10 ? 'high' : currentDd > 5 ? 'moderate' : 'low'

    return {
      skillId: 'drawdown-monitor',
      data: {
        current_drawdown_pct: currentDd,
        max_dd_7d: dd7,
        max_dd_30d: dd30,
        max_dd_90d: dd90,
        peak_price: peak,
        recovery_needed_pct: recoveryNeeded,
        risk_level: riskLevel,
      },
      summary: `当前回撤 ${currentDd.toFixed(1)}% | 30日最大 ${dd30.toFixed(1)}% | ${riskLevel}`,
    }
  },
}

function maxDrawdown(prices: number[]): number {
  if (prices.length < 2) return 0
  let peak = prices[0]
  let maxDd = 0
  for (const p of prices) {
    if (p > peak) peak = p
    const dd = (peak - p) / peak * 100
    if (dd > maxDd) maxDd = dd
  }
  return maxDd
}
