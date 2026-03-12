import type { AnalysisInput, ResearcherOutput } from './types'
import { atr as calcAtr, percentile, dailyReturns, correlation } from './indicators'

export function analyzeResearcher(input: AnalysisInput): ResearcherOutput {
  const { symbol, market, klines_1d, btc_klines_1d } = input
  const now = new Date().toISOString()

  const closes = klines_1d.map(k => k.close)

  if (closes.length < 10) {
    return { role: 'researcher', symbol, at: now, volatility_percentile: 50, avg_daily_return: 0, return_std: 0, beta_to_btc: null, best_day_of_week: null, similar_pattern_outcome: null, summary: '数据不足' }
  }

  // Daily returns
  const returns = dailyReturns(closes)
  const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length
  const variance = returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / returns.length
  const returnStd = Math.sqrt(variance)

  // Volatility percentile
  const highs = klines_1d.map(k => k.high)
  const lows = klines_1d.map(k => k.low)
  const atrArr = calcAtr(highs, lows, closes, 14)
  const validAtr = atrArr.filter(v => !isNaN(v))
  const lastAtr = validAtr[validAtr.length - 1] ?? 0
  const volPct = validAtr.length > 5 ? percentile(validAtr, lastAtr) : 50

  // Beta to BTC (for non-BTC crypto)
  let betaToBtc: number | null = null
  if (market === 'crypto' && btc_klines_1d && btc_klines_1d.length > 10 && !symbol.startsWith('BTC')) {
    const btcCloses = btc_klines_1d.map(k => k.close)
    const btcReturns = dailyReturns(btcCloses)
    const minLen = Math.min(returns.length, btcReturns.length)
    if (minLen > 5) {
      const corr = correlation(returns.slice(-minLen), btcReturns.slice(-minLen))
      const btcStd = Math.sqrt(btcReturns.slice(-minLen).reduce((s, r) => s + r * r, 0) / minLen)
      betaToBtc = btcStd > 0 ? corr * (returnStd / btcStd) : null
    }
  }

  // Day-of-week analysis
  let bestDay: string | null = null
  if (klines_1d.length >= 14) {
    const dayReturns: Record<number, number[]> = {}
    for (let i = 1; i < klines_1d.length; i++) {
      const day = new Date(klines_1d[i].time).getDay()
      const ret = (klines_1d[i].close - klines_1d[i - 1].close) / klines_1d[i - 1].close
      if (!dayReturns[day]) dayReturns[day] = []
      dayReturns[day].push(ret)
    }
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    let bestAvg = -Infinity
    for (const [day, rets] of Object.entries(dayReturns)) {
      const avg = rets.reduce((s, r) => s + r, 0) / rets.length
      if (avg > bestAvg) { bestAvg = avg; bestDay = `${dayNames[parseInt(day)]} (均+${(bestAvg * 100).toFixed(2)}%)` }
    }
  }

  // Recent pattern similarity (simple: compare last 5 bars pattern with historical)
  let patternOutcome: string | null = null
  if (closes.length >= 20) {
    const recent5 = returns.slice(-5)
    const recentDir = recent5.map(r => r > 0 ? 1 : -1)
    let matches = 0, matchOutcomes = 0

    for (let i = 5; i < returns.length - 6; i++) {
      const window = returns.slice(i, i + 5).map(r => r > 0 ? 1 : -1)
      if (window.join('') === recentDir.join('')) {
        matches++
        matchOutcomes += returns[i + 5] > 0 ? 1 : 0
      }
    }
    if (matches >= 2) {
      const upPct = (matchOutcomes / matches * 100).toFixed(0)
      patternOutcome = `相似形态 ${matches} 次，${upPct}% 后续上涨`
    }
  }

  const parts: string[] = []
  parts.push(`波动率位 ${volPct.toFixed(0)}%`)
  parts.push(`日均收益 ${(avgReturn * 100).toFixed(3)}%`)
  parts.push(`日波动 ${(returnStd * 100).toFixed(2)}%`)
  if (betaToBtc !== null) parts.push(`BTC β=${betaToBtc.toFixed(2)}`)
  if (bestDay) parts.push(`最佳 ${bestDay}`)
  if (patternOutcome) parts.push(patternOutcome)

  return {
    role: 'researcher', symbol, at: now,
    volatility_percentile: volPct,
    avg_daily_return: avgReturn,
    return_std: returnStd,
    beta_to_btc: betaToBtc,
    best_day_of_week: bestDay,
    similar_pattern_outcome: patternOutcome,
    summary: parts.join(' | '),
  }
}
