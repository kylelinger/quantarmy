import type { AnalysisInput, StrategistOutput } from './types'
import { ema, rsi as calcRsi, macd as calcMacd, adx as calcAdx, psar as calcPsar } from './indicators'

export function analyzeStrategist(input: AnalysisInput): StrategistOutput {
  const { symbol, klines_1h } = input
  const now = new Date().toISOString()

  const closes = klines_1h.map(k => k.close)
  const highs = klines_1h.map(k => k.high)
  const lows = klines_1h.map(k => k.low)

  if (closes.length < 50) {
    return { role: 'strategist', symbol, at: now, signal: 'HOLD', confidence: 0, psar_direction: 'bull', ema_trend: 'neutral', adx: 0, rsi: 50, macd_histogram: 0, reasons: ['数据不足'], summary: '数据不足，无法生成信号' }
  }

  // PSAR (slow AF 0.01/0.01/0.10)
  const psarResult = calcPsar(highs, lows, closes, 0.01, 0.01, 0.10)
  const psarDir = psarResult.direction[psarResult.direction.length - 1]

  // EMA 20/50/200
  const ema20 = ema(closes, 20)
  const ema50 = ema(closes, 50)
  const lastEma20 = ema20[ema20.length - 1]
  const lastEma50 = ema50[ema50.length - 1]
  const price = closes[closes.length - 1]

  let emaTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral'
  if (price > lastEma20 && lastEma20 > lastEma50) emaTrend = 'bullish'
  else if (price < lastEma20 && lastEma20 < lastEma50) emaTrend = 'bearish'

  // ADX
  const adxArr = calcAdx(highs, lows, closes, 14)
  const lastAdx = adxArr.filter(v => !isNaN(v)).pop() ?? 0

  // RSI
  const rsiArr = calcRsi(closes, 14)
  const lastRsi = rsiArr.filter(v => !isNaN(v)).pop() ?? 50

  // MACD
  const macdResult = calcMacd(closes)
  const lastHist = macdResult.histogram[macdResult.histogram.length - 1] ?? 0

  // Scoring
  let score = 0
  const reasons: string[] = []

  // PSAR direction (weight: 2)
  if (psarDir === 'bull') { score += 2; reasons.push('PSAR 多头翻转') }
  else { score -= 2; reasons.push('PSAR 空头翻转') }

  // EMA alignment (weight: 2)
  if (emaTrend === 'bullish') { score += 2; reasons.push(`EMA多头排列 (${lastEma20.toFixed(0)}>${lastEma50.toFixed(0)})`) }
  else if (emaTrend === 'bearish') { score -= 2; reasons.push(`EMA空头排列 (${lastEma20.toFixed(0)}<${lastEma50.toFixed(0)})`) }
  else { reasons.push('EMA中性') }

  // ADX trend strength (weight: 1)
  if (lastAdx >= 25) { reasons.push(`ADX ${lastAdx.toFixed(1)} 趋势强`) }
  else if (lastAdx >= 20) { reasons.push(`ADX ${lastAdx.toFixed(1)} 趋势中等`) }
  else { score *= 0.5; reasons.push(`ADX ${lastAdx.toFixed(1)} 无明确趋势`) }

  // RSI extremes (weight: 1)
  if (lastRsi > 70) { score -= 1; reasons.push(`RSI ${lastRsi.toFixed(0)} 超买`) }
  else if (lastRsi < 30) { score += 1; reasons.push(`RSI ${lastRsi.toFixed(0)} 超卖`) }
  else { reasons.push(`RSI ${lastRsi.toFixed(0)} 中性`) }

  // MACD histogram (weight: 1)
  if (lastHist > 0) { score += 1; reasons.push('MACD柱 > 0 多头动能') }
  else { score -= 1; reasons.push('MACD柱 < 0 空头动能') }

  // Determine signal
  let signal: 'LONG' | 'SHORT' | 'HOLD'
  let confidence: number
  if (score >= 3) { signal = 'LONG'; confidence = Math.min(0.9, 0.5 + score * 0.08) }
  else if (score <= -3) { signal = 'SHORT'; confidence = Math.min(0.9, 0.5 + Math.abs(score) * 0.08) }
  else { signal = 'HOLD'; confidence = 0.3 + Math.abs(score) * 0.05 }

  const summary = `${signal} · 置信 ${(confidence * 100).toFixed(0)}% | ${reasons.slice(0, 3).join(', ')}`

  return {
    role: 'strategist', symbol, at: now,
    signal, confidence,
    psar_direction: psarDir,
    ema_trend: emaTrend,
    adx: lastAdx,
    rsi: lastRsi,
    macd_histogram: lastHist,
    reasons,
    summary,
  }
}
