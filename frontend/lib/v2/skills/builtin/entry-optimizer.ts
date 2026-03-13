import type { Skill, MarketSnapshot } from '../../types'
import { rsi as calcRsi } from '../../../analysis/indicators'

export const entryOptimizerSkill: Skill = {
  meta: {
    id: 'entry-optimizer',
    name: 'Entry Optimizer',
    version: '1.0.0',
    category: 'execution',
    compatibleRoles: ['executor'],
    description: '入场时机优化 + 挂单策略建议',
  },
  compute(snapshot: MarketSnapshot) {
    const closes = snapshot.klines_1h.map(k => k.close)
    const price = closes[closes.length - 1] || 0

    if (closes.length < 20) {
      return { skillId: 'entry-optimizer', data: {}, summary: '数据不足' }
    }

    const rsiArr = calcRsi(closes, 14)
    const rsi = rsiArr[rsiArr.length - 1] || 50

    // Recent price range for limit order suggestion
    const recent = closes.slice(-20)
    const low20 = Math.min(...recent)
    const high20 = Math.max(...recent)
    const midRange = (low20 + high20) / 2

    // Suggest entry type
    let orderType: string
    let suggestedEntry: number
    let reasoning: string

    if (rsi > 65) {
      orderType = 'limit_below'
      suggestedEntry = price * 0.995 // wait for 0.5% pullback
      reasoning = 'RSI偏高，建议限价单等回调入场'
    } else if (rsi < 35) {
      orderType = 'market'
      suggestedEntry = price
      reasoning = 'RSI超卖，可立即市价入场'
    } else if (price > midRange) {
      orderType = 'limit_below'
      suggestedEntry = midRange + (price - midRange) * 0.5
      reasoning = '价格偏高于20周期中位，建议等回踩'
    } else {
      orderType = 'limit_at_support'
      suggestedEntry = low20 + (price - low20) * 0.3
      reasoning = '价格接近支撑区，限价单挂在支撑位附近'
    }

    // Time urgency
    const klines4h = snapshot.klines_4h
    const recentVol = klines4h.slice(-3).reduce((s, k) => s + k.volume, 0) / 3
    const avgVol = klines4h.slice(-20, -3).reduce((s, k) => s + k.volume, 0) / Math.max(1, klines4h.slice(-20, -3).length)
    const volRatio = avgVol > 0 ? recentVol / avgVol : 1
    const urgency = volRatio > 2 ? 'high' : volRatio > 1.3 ? 'medium' : 'low'

    return {
      skillId: 'entry-optimizer',
      data: {
        order_type: orderType,
        suggested_entry: suggestedEntry,
        current_price: price,
        rsi,
        reasoning,
        urgency,
        vol_ratio: volRatio,
      },
      summary: `${orderType === 'market' ? '市价立即' : '限价等待'} @ ${suggestedEntry.toFixed(2)} | ${reasoning} | 紧迫性: ${urgency}`,
    }
  },
}
