import type { Skill, MarketSnapshot } from '../../types'
import { macd as calcMacd } from '../../../analysis/indicators'

export const macdDivergenceSkill: Skill = {
  meta: {
    id: 'macd-divergence',
    name: 'MACD Divergence',
    version: '1.0.0',
    category: 'signal',
    compatibleRoles: ['strategist', 'analyst'],
    description: 'MACD 柱状图 + 背离检测',
  },
  compute(snapshot: MarketSnapshot) {
    const closes = snapshot.klines_1h.map(k => k.close)
    if (closes.length < 50) {
      return { skillId: 'macd-divergence', data: { histogram: 0 }, summary: '数据不足' }
    }

    const result = calcMacd(closes)
    const hist = result.histogram
    const lastHist = hist[hist.length - 1] ?? 0
    const prevHist = hist[hist.length - 2] ?? 0
    const macdLine = result.macd[result.macd.length - 1] ?? 0
    const signalLine = result.signal[result.signal.length - 1] ?? 0

    // Momentum direction
    const momentum = lastHist > prevHist ? 'increasing' : 'decreasing'
    
    // Zero-line cross
    let zeroCross = 'none'
    if (prevHist <= 0 && lastHist > 0) zeroCross = 'bullish'
    else if (prevHist >= 0 && lastHist < 0) zeroCross = 'bearish'

    // Simple divergence detection: price making new high but MACD not
    let divergence = 'none'
    const recent = closes.slice(-20)
    const recentHist = hist.slice(-20)
    if (recent.length >= 20 && recentHist.length >= 20) {
      const priceHigh = Math.max(...recent)
      const priceHighIdx = recent.lastIndexOf(priceHigh)
      const histMax = Math.max(...recentHist.filter(v => !isNaN(v)))
      const histMaxIdx = recentHist.lastIndexOf(histMax)
      
      if (priceHighIdx > histMaxIdx + 3 && recent[recent.length - 1] > recent[recent.length - 5]) {
        divergence = 'bearish' // price new high, MACD declining
      }
      
      const priceLow = Math.min(...recent)
      const priceLowIdx = recent.lastIndexOf(priceLow)
      const histMin = Math.min(...recentHist.filter(v => !isNaN(v)))
      const histMinIdx = recentHist.lastIndexOf(histMin)
      
      if (priceLowIdx > histMinIdx + 3 && recent[recent.length - 1] < recent[recent.length - 5]) {
        divergence = 'bullish' // price new low, MACD rising
      }
    }

    const signal = lastHist > 0 ? 'LONG' : lastHist < 0 ? 'SHORT' : 'HOLD'

    return {
      skillId: 'macd-divergence',
      data: {
        histogram: lastHist,
        macd_line: macdLine,
        signal_line: signalLine,
        momentum,
        zero_cross: zeroCross,
        divergence,
        signal,
      },
      summary: `MACD柱 ${lastHist > 0 ? '+' : ''}${lastHist.toFixed(2)} ${momentum === 'increasing' ? '↑' : '↓'}${divergence !== 'none' ? ` | ${divergence === 'bullish' ? '底背离' : '顶背离'}` : ''}`,
    }
  },
}
