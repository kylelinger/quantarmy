import type { Skill, MarketSnapshot } from '../../types'

export const supportResistanceSkill: Skill = {
  meta: {
    id: 'support-resistance',
    name: 'Support & Resistance',
    version: '1.0.0',
    category: 'signal',
    compatibleRoles: ['analyst'],
    description: '关键支撑/阻力位识别',
  },
  compute(snapshot: MarketSnapshot) {
    const klines = snapshot.klines_4h
    if (klines.length < 30) {
      return { skillId: 'support-resistance', data: {}, summary: '数据不足' }
    }

    const price = klines[klines.length - 1].close
    const highs = klines.map(k => k.high)
    const lows = klines.map(k => k.low)

    // Find pivot points
    const pivotHighs: number[] = []
    const pivotLows: number[] = []
    for (let i = 2; i < klines.length - 2; i++) {
      if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] && highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
        pivotHighs.push(highs[i])
      }
      if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] && lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
        pivotLows.push(lows[i])
      }
    }

    // Find nearest support and resistance
    const supports = pivotLows.filter(l => l < price).sort((a, b) => b - a)
    const resistances = pivotHighs.filter(h => h > price).sort((a, b) => a - b)

    const support1 = supports[0] || 0
    const support2 = supports[1] || 0
    const resistance1 = resistances[0] || 0
    const resistance2 = resistances[1] || 0

    // Distance to nearest levels
    const distToSupport = support1 > 0 ? (price - support1) / price * 100 : 999
    const distToResistance = resistance1 > 0 ? (resistance1 - price) / price * 100 : 999

    // Proximity assessment
    const nearLevel = distToSupport < 1 ? 'near_support' : distToResistance < 1 ? 'near_resistance' : 'mid_range'

    return {
      skillId: 'support-resistance',
      data: {
        price,
        support_1: support1,
        support_2: support2,
        resistance_1: resistance1,
        resistance_2: resistance2,
        dist_to_support_pct: distToSupport,
        dist_to_resistance_pct: distToResistance,
        position: nearLevel,
        pivot_highs_count: pivotHighs.length,
        pivot_lows_count: pivotLows.length,
      },
      summary: `S1: ${support1.toFixed(0)} (${distToSupport.toFixed(1)}%) | R1: ${resistance1.toFixed(0)} (${distToResistance.toFixed(1)}%) | ${nearLevel === 'near_support' ? '接近支撑' : nearLevel === 'near_resistance' ? '接近阻力' : '区间中段'}`,
    }
  },
}
