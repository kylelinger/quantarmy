import type { Skill, MarketSnapshot } from '../../types'
import { ema } from '../../../analysis/indicators'

export const emaCrossoverSkill: Skill = {
  meta: {
    id: 'ema-crossover',
    name: 'EMA Crossover',
    version: '1.0.0',
    category: 'signal',
    compatibleRoles: ['strategist', 'analyst'],
    description: 'EMA 20/50/200 交叉信号',
  },
  compute(snapshot: MarketSnapshot) {
    const closes = snapshot.klines_1h.map(k => k.close)
    if (closes.length < 200) {
      return { skillId: 'ema-crossover', data: { trend: 'unknown' }, summary: '数据不足(需200根)' }
    }

    const ema20 = ema(closes, 20)
    const ema50 = ema(closes, 50)
    const ema200 = ema(closes, 200)
    const price = closes[closes.length - 1]
    const e20 = ema20[ema20.length - 1]
    const e50 = ema50[ema50.length - 1]
    const e200 = ema200[ema200.length - 1]

    // Previous values for crossover detection
    const prev_e20 = ema20[ema20.length - 2]
    const prev_e50 = ema50[ema50.length - 2]

    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral'
    let alignment = ''
    if (price > e20 && e20 > e50 && e50 > e200) {
      trend = 'bullish'; alignment = '多头排列 P>EMA20>50>200'
    } else if (price < e20 && e20 < e50 && e50 < e200) {
      trend = 'bearish'; alignment = '空头排列 P<EMA20<50<200'
    } else {
      alignment = '无明确排列'
    }

    // Golden/Death cross detection (EMA20 x EMA50)
    let crossover = 'none'
    if (prev_e20 <= prev_e50 && e20 > e50) crossover = 'golden'
    else if (prev_e20 >= prev_e50 && e20 < e50) crossover = 'death'

    return {
      skillId: 'ema-crossover',
      data: {
        trend,
        alignment,
        crossover,
        ema20: e20,
        ema50: e50,
        ema200: e200,
        price,
        price_vs_ema200_pct: ((price - e200) / e200 * 100),
        signal: trend === 'bullish' ? 'LONG' : trend === 'bearish' ? 'SHORT' : 'HOLD',
      },
      summary: `EMA ${alignment}${crossover !== 'none' ? ` | ${crossover === 'golden' ? '金叉' : '死叉'}` : ''}`,
    }
  },
}
