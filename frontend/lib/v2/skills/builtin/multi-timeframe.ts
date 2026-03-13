import type { Skill, MarketSnapshot } from '../../types'
import { ema } from '../../../analysis/indicators'

export const multiTimeframeSkill: Skill = {
  meta: {
    id: 'multi-timeframe',
    name: 'Multi-Timeframe Analyzer',
    version: '1.0.0',
    category: 'signal',
    compatibleRoles: ['analyst', 'strategist'],
    description: '多时间框架趋势验证 (1h/4h/1d)',
  },
  compute(snapshot: MarketSnapshot) {
    const tf1h = analyzeTF(snapshot.klines_1h, '1h')
    const tf4h = analyzeTF(snapshot.klines_4h, '4h')
    const tf1d = analyzeTF(snapshot.klines_1d, '1d')

    const trends = [tf1h, tf4h, tf1d]
    const bullish = trends.filter(t => t.trend === 'bullish').length
    const bearish = trends.filter(t => t.trend === 'bearish').length

    let consensus: 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down'
    if (bullish === 3) consensus = 'strong_up'
    else if (bullish >= 2) consensus = 'up'
    else if (bearish === 3) consensus = 'strong_down'
    else if (bearish >= 2) consensus = 'down'
    else consensus = 'neutral'

    const alignment = bullish === 3 || bearish === 3

    return {
      skillId: 'multi-timeframe',
      data: {
        tf_1h: tf1h,
        tf_4h: tf4h,
        tf_1d: tf1d,
        consensus,
        alignment,
        bullish_count: bullish,
        bearish_count: bearish,
        signal: consensus.includes('up') ? 'LONG' : consensus.includes('down') ? 'SHORT' : 'HOLD',
      },
      summary: `${consensus === 'strong_up' ? '🟢 三TF共振看多' : consensus === 'strong_down' ? '🔴 三TF共振看空' : consensus === 'up' ? '↗ 偏多' : consensus === 'down' ? '↘ 偏空' : '↔ 分歧'} | 1h:${tf1h.trend} 4h:${tf4h.trend} 1d:${tf1d.trend}`,
    }
  },
}

function analyzeTF(klines: { close: number; open: number }[], label: string) {
  const closes = klines.map(k => k.close)
  if (closes.length < 20) return { tf: label, trend: 'neutral' as const, ema20_slope: 0 }

  const ema20 = ema(closes, 20)
  const last = ema20[ema20.length - 1]
  const prev5 = ema20[ema20.length - 6] || last
  const slope = prev5 > 0 ? (last - prev5) / prev5 * 100 : 0

  const price = closes[closes.length - 1]
  const trend: 'bullish' | 'bearish' | 'neutral' =
    price > last && slope > 0.1 ? 'bullish' :
    price < last && slope < -0.1 ? 'bearish' : 'neutral'

  return { tf: label, trend, ema20_slope: slope, price, ema20: last }
}
