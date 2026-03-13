import type { Skill, MarketSnapshot } from '../../types'
import { psar as calcPsar } from '../../../analysis/indicators'

export const psarTrendSkill: Skill = {
  meta: {
    id: 'psar-trend',
    name: 'PSAR Trend Following',
    version: '1.0.0',
    category: 'signal',
    compatibleRoles: ['strategist', 'analyst'],
    description: 'Parabolic SAR (slow AF 0.01/0.01/0.10) 趋势跟踪',
  },
  compute(snapshot: MarketSnapshot) {
    const closes = snapshot.klines_1h.map(k => k.close)
    const highs = snapshot.klines_1h.map(k => k.high)
    const lows = snapshot.klines_1h.map(k => k.low)

    if (closes.length < 50) {
      return { skillId: 'psar-trend', data: { direction: 'unknown', bars_since_flip: 0 }, summary: '数据不足' }
    }

    const result = calcPsar(highs, lows, closes, 0.01, 0.01, 0.10)
    const dir = result.direction[result.direction.length - 1]
    
    // Count bars since last flip
    let barsSinceFlip = 0
    for (let i = result.direction.length - 2; i >= 0; i--) {
      if (result.direction[i] !== dir) break
      barsSinceFlip++
    }

    const price = closes[closes.length - 1]
    const sarValue = result.sar[result.sar.length - 1]
    const distPct = Math.abs(price - sarValue) / price * 100

    return {
      skillId: 'psar-trend',
      data: {
        direction: dir,          // 'bull' | 'bear'
        sar_value: sarValue,
        price,
        distance_pct: distPct,
        bars_since_flip: barsSinceFlip,
        signal: dir === 'bull' ? 'LONG' : 'SHORT',
        strength: barsSinceFlip > 10 ? 'strong' : barsSinceFlip > 3 ? 'moderate' : 'fresh',
      },
      summary: `PSAR ${dir === 'bull' ? '多头' : '空头'} (${barsSinceFlip}根K线) 距SAR ${distPct.toFixed(1)}%`,
    }
  },
}
