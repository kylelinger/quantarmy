import type { AnalysisInput, AnalystOutput } from './types'
import { ema, sma, findSupportResistance, detectCandlePatterns } from './indicators'

export function analyzeAnalyst(input: AnalysisInput): AnalystOutput {
  const { symbol, klines_1h, klines_4h, klines_1d } = input
  const now = new Date().toISOString()

  const closes = klines_1h.map(k => k.close)
  const highs = klines_1h.map(k => k.high)
  const lows = klines_1h.map(k => k.low)
  const opens = klines_1h.map(k => k.open)
  const volumes = klines_1h.map(k => k.volume)

  if (closes.length < 30) {
    return { role: 'analyst', symbol, at: now, trend: 'neutral', ma_alignment: '数据不足', support: 0, resistance: 0, patterns: [], volume_trend: 'stable', multi_tf_consensus: '数据不足', summary: '数据不足' }
  }

  // MA alignment
  const ma20 = sma(closes, 20)
  const ma50 = sma(closes, Math.min(50, closes.length))
  const price = closes[closes.length - 1]
  const lastMa20 = ma20[ma20.length - 1]
  const lastMa50 = ma50[ma50.length - 1]

  let trend: AnalystOutput['trend'] = 'neutral'
  let maAlignment = ''

  if (price > lastMa20 && lastMa20 > lastMa50) {
    trend = 'strong_up'; maAlignment = `多头排列 MA20(${lastMa20.toFixed(0)}) > MA50(${lastMa50.toFixed(0)})`
  } else if (price > lastMa20) {
    trend = 'up'; maAlignment = `价格在MA20上方 (${lastMa20.toFixed(0)})`
  } else if (price < lastMa20 && lastMa20 < lastMa50) {
    trend = 'strong_down'; maAlignment = `空头排列 MA20(${lastMa20.toFixed(0)}) < MA50(${lastMa50.toFixed(0)})`
  } else if (price < lastMa20) {
    trend = 'down'; maAlignment = `价格在MA20下方 (${lastMa20.toFixed(0)})`
  } else {
    maAlignment = `MA交织中`
  }

  // Support / Resistance
  const sr = findSupportResistance(highs, lows, closes, 40)

  // Candlestick patterns
  const patterns = detectCandlePatterns(opens, highs, lows, closes)

  // Volume trend (compare last 5 bars avg vs prior 10 bars avg)
  let volumeTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (volumes.length >= 15) {
    const recentVol = volumes.slice(-5).reduce((s, v) => s + v, 0) / 5
    const priorVol = volumes.slice(-15, -5).reduce((s, v) => s + v, 0) / 10
    if (priorVol > 0) {
      const ratio = recentVol / priorVol
      if (ratio > 1.3) volumeTrend = 'increasing'
      else if (ratio < 0.7) volumeTrend = 'decreasing'
    }
  }

  // Multi-timeframe consensus
  function tfTrend(klines: typeof klines_1h): string {
    if (klines.length < 10) return '?'
    const c = klines.map(k => k.close)
    const m20 = sma(c, Math.min(20, c.length))
    const last = c[c.length - 1]
    const lastM = m20[m20.length - 1]
    return last > lastM ? '多' : last < lastM ? '空' : '中'
  }

  const tf1h = tfTrend(klines_1h)
  const tf4h = tfTrend(klines_4h)
  const tf1d = tfTrend(klines_1d)
  const multiTf = `1h:${tf1h} 4h:${tf4h} 日线:${tf1d}`
  const allSame = tf1h === tf4h && tf4h === tf1d
  const multiTfStr = allSame ? `${multiTf} ✅ 全周期共振` : multiTf

  const trendLabel = { strong_up: '强势上行', up: '偏多', neutral: '中性震荡', down: '偏空', strong_down: '强势下行' }[trend]
  const volLabel = { increasing: '放量', decreasing: '缩量', stable: '量能平稳' }[volumeTrend]

  return {
    role: 'analyst', symbol, at: now,
    trend, ma_alignment: maAlignment,
    support: sr.support, resistance: sr.resistance,
    patterns, volume_trend: volumeTrend,
    multi_tf_consensus: multiTfStr,
    summary: `${trendLabel} | ${maAlignment} | 支撑 ${sr.support.toFixed(2)} 阻力 ${sr.resistance.toFixed(2)} | ${volLabel} | ${multiTfStr}`,
  }
}
