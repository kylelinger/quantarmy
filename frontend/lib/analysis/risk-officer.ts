import type { AnalysisInput, RiskOfficerOutput } from './types'
import { atr as calcAtr, percentile } from './indicators'

export function analyzeRiskOfficer(input: AnalysisInput): RiskOfficerOutput {
  const { symbol, quote, klines_1h, klines_1d } = input
  const now = new Date().toISOString()

  const closes = klines_1h.map(k => k.close)
  const highs = klines_1h.map(k => k.high)
  const lows = klines_1h.map(k => k.low)
  const price = quote.price

  if (closes.length < 20) {
    return { role: 'risk_officer', symbol, at: now, risk_score: 5, atr: 0, atr_pct: 0, volatility_percentile: 50, suggested_position_pct: 5, stop_loss_price: null, take_profit_price: null, max_drawdown_recent: 0, summary: '数据不足' }
  }

  // ATR (1h)
  const atrArr = calcAtr(highs, lows, closes, 14)
  const lastAtr = atrArr.filter(v => !isNaN(v)).pop() ?? 0
  const atrPct = price > 0 ? (lastAtr / price) * 100 : 0

  // Volatility percentile (from daily klines)
  const dailyCloses = klines_1d.map(k => k.close)
  const dailyHighs = klines_1d.map(k => k.high)
  const dailyLows = klines_1d.map(k => k.low)
  const dailyAtrArr = calcAtr(dailyHighs, dailyLows, dailyCloses, 14)
  const dailyAtrValues = dailyAtrArr.filter(v => !isNaN(v))
  const currentDailyAtr = dailyAtrValues[dailyAtrValues.length - 1] ?? 0
  const volPercentile = dailyAtrValues.length > 5 ? percentile(dailyAtrValues, currentDailyAtr) : 50

  // Max drawdown in recent 30 candles (1h)
  let peak = closes[Math.max(0, closes.length - 30)]
  let maxDD = 0
  for (let i = Math.max(0, closes.length - 30); i < closes.length; i++) {
    if (closes[i] > peak) peak = closes[i]
    const dd = (peak - closes[i]) / peak * 100
    if (dd > maxDD) maxDD = dd
  }

  // Risk score (1-10, higher = more risky)
  let riskScore = 5
  if (atrPct > 3) riskScore += 2
  else if (atrPct > 2) riskScore += 1
  else if (atrPct < 1) riskScore -= 1
  if (volPercentile > 80) riskScore += 1
  if (volPercentile < 20) riskScore -= 1
  if (maxDD > 5) riskScore += 1
  riskScore = Math.max(1, Math.min(10, riskScore))

  // Suggested position size (inverse of risk)
  const suggestedPct = Math.max(2, Math.min(20, Math.round(30 / riskScore)))

  // Stop loss: 2.5 × ATR below price
  const stopLoss = price > 0 ? price - 2.5 * lastAtr : null
  const takeProfit = price > 0 ? price + 4.0 * lastAtr : null

  const parts: string[] = []
  parts.push(`风险 ${riskScore}/10`)
  parts.push(`ATR ${atrPct.toFixed(2)}%`)
  parts.push(`波动率位 ${volPercentile.toFixed(0)}%`)
  parts.push(`建议仓位 ≤${suggestedPct}%`)
  if (stopLoss) parts.push(`止损 $${stopLoss.toFixed(2)}`)

  return {
    role: 'risk_officer', symbol, at: now,
    risk_score: riskScore,
    atr: lastAtr,
    atr_pct: atrPct,
    volatility_percentile: volPercentile,
    suggested_position_pct: suggestedPct,
    stop_loss_price: stopLoss,
    take_profit_price: takeProfit,
    max_drawdown_recent: maxDD,
    summary: parts.join(' | '),
  }
}
