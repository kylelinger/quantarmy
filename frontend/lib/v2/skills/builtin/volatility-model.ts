import type { Skill, MarketSnapshot } from '../../types'
import { atr as calcAtr } from '../../../analysis/indicators'

export const volatilityModelSkill: Skill = {
  meta: {
    id: 'volatility-model',
    name: 'Volatility Model',
    version: '1.0.0',
    category: 'risk',
    compatibleRoles: ['risk_officer', 'researcher'],
    description: 'ATR + 波动率百分位评估',
  },
  compute(snapshot: MarketSnapshot) {
    const { klines_1h, klines_1d } = snapshot
    const closes = klines_1h.map(k => k.close)
    const highs = klines_1h.map(k => k.high)
    const lows = klines_1h.map(k => k.low)
    const price = closes[closes.length - 1] || 0

    if (closes.length < 20) {
      return { skillId: 'volatility-model', data: { atr: 0 }, summary: '数据不足' }
    }

    const atrArr = calcAtr(highs, lows, closes, 14)
    const currentAtr = atrArr[atrArr.length - 1] || 0
    const atrPct = price > 0 ? (currentAtr / price * 100) : 0

    // Daily volatility from daily klines
    const dailyReturns = klines_1d.slice(1).map((k, i) => {
      const prev = klines_1d[i].close
      return prev > 0 ? (k.close - prev) / prev : 0
    })
    const stdDev = stdDeviation(dailyReturns)
    const annualizedVol = stdDev * Math.sqrt(365) * 100

    // Percentile: compare current ATR% to historical
    const historicalAtrPct = atrArr.map((a, i) => {
      const p = closes[i + 14] || closes[closes.length - 1]
      return p > 0 ? a / p * 100 : 0
    }).filter(v => v > 0)
    const volPercentile = historicalAtrPct.length > 0
      ? historicalAtrPct.filter(v => v <= atrPct).length / historicalAtrPct.length * 100
      : 50

    const riskLevel = atrPct > 5 ? 'extreme' : atrPct > 3 ? 'high' : atrPct > 1.5 ? 'moderate' : 'low'

    return {
      skillId: 'volatility-model',
      data: {
        atr: currentAtr,
        atr_pct: atrPct,
        annualized_vol: annualizedVol,
        vol_percentile: volPercentile,
        daily_std: stdDev * 100,
        risk_level: riskLevel,
      },
      summary: `ATR ${atrPct.toFixed(2)}% (P${volPercentile.toFixed(0)}) | 年化波动 ${annualizedVol.toFixed(0)}% | ${riskLevel}`,
    }
  },
}

function stdDeviation(arr: number[]): number {
  if (arr.length < 2) return 0
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (arr.length - 1)
  return Math.sqrt(variance)
}
