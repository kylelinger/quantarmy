import type { Skill, MarketSnapshot } from '../../types'
import { ema, rsi as calcRsi, adx as calcAdx } from '../../../analysis/indicators'

export const consistencyCheckerSkill: Skill = {
  meta: {
    id: 'consistency-checker',
    name: 'Consistency Checker',
    version: '1.0.0',
    category: 'audit',
    compatibleRoles: ['cto'],
    description: '跨指标一致性验证',
  },
  compute(snapshot: MarketSnapshot) {
    const closes1h = snapshot.klines_1h.map(k => k.close)
    const closes1d = snapshot.klines_1d.map(k => k.close)

    if (closes1h.length < 50 || closes1d.length < 30) {
      return { skillId: 'consistency-checker', data: {}, summary: '数据不足' }
    }

    const contradictions: string[] = []
    const confirmations: string[] = []

    // EMA trend vs ADX
    const ema20 = ema(closes1h, 20)
    const ema50 = ema(closes1h, 50)
    const price = closes1h[closes1h.length - 1]
    const emaBullish = price > ema20[ema20.length - 1] && ema20[ema20.length - 1] > ema50[ema50.length - 1]
    const emaBearish = price < ema20[ema20.length - 1] && ema20[ema20.length - 1] < ema50[ema50.length - 1]

    const highs = snapshot.klines_1h.map(k => k.high)
    const lows = snapshot.klines_1h.map(k => k.low)
    const adxArr = calcAdx(highs, lows, closes1h, 14)
    const lastAdx = adxArr.filter(v => !isNaN(v)).pop() ?? 0

    if ((emaBullish || emaBearish) && lastAdx < 15) {
      contradictions.push('EMA显示趋势但ADX<15(无趋势)')
    }
    if ((emaBullish || emaBearish) && lastAdx >= 25) {
      confirmations.push('EMA趋势 + ADX确认')
    }

    // 1h vs 1d trend consistency
    const ema20_1d = ema(closes1d, 20)
    const dailyBullish = closes1d[closes1d.length - 1] > ema20_1d[ema20_1d.length - 1]
    if (emaBullish && !dailyBullish) {
      contradictions.push('小时级看多但日线看空')
    } else if (emaBearish && dailyBullish) {
      contradictions.push('小时级看空但日线看多')
    } else if ((emaBullish && dailyBullish) || (emaBearish && !dailyBullish)) {
      confirmations.push('多时间框架方向一致')
    }

    // RSI vs trend
    const rsiArr = calcRsi(closes1h, 14)
    const lastRsi = rsiArr.filter(v => !isNaN(v)).pop() ?? 50
    if (emaBullish && lastRsi < 35) {
      contradictions.push('EMA看多但RSI超卖(可能假突破)')
    }
    if (emaBearish && lastRsi > 65) {
      contradictions.push('EMA看空但RSI偏高(可能假跌破)')
    }

    const consistencyScore = Math.max(0, Math.min(100,
      70 + confirmations.length * 15 - contradictions.length * 20
    ))

    return {
      skillId: 'consistency-checker',
      data: {
        contradictions,
        confirmations,
        contradiction_count: contradictions.length,
        confirmation_count: confirmations.length,
        consistency_score: consistencyScore,
        status: consistencyScore >= 70 ? 'consistent' : consistencyScore >= 40 ? 'mixed' : 'conflicting',
      },
      summary: `一致性 ${consistencyScore}/100 | ✅${confirmations.length} ⚠️${contradictions.length}${contradictions.length > 0 ? ` | ${contradictions[0]}` : ''}`,
    }
  },
}
