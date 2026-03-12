import type { CEOOutput, StrategistOutput, RiskOfficerOutput, AnalystOutput, CollectorOutput, ResearcherOutput, ExecutorOutput, CTOOutput } from './types'

interface RoleOutputs {
  collector?: CollectorOutput
  strategist?: StrategistOutput
  risk_officer?: RiskOfficerOutput
  analyst?: AnalystOutput
  researcher?: ResearcherOutput
  executor?: ExecutorOutput
  cto?: CTOOutput
}

export function analyzeCEO(symbol: string, roles: RoleOutputs): CEOOutput {
  const now = new Date().toISOString()

  let bullish = 0, bearish = 0, neutral = 0
  const debates: string[] = []

  // Strategist signal
  if (roles.strategist) {
    if (roles.strategist.signal === 'LONG') bullish++
    else if (roles.strategist.signal === 'SHORT') bearish++
    else neutral++
  }

  // Analyst trend
  if (roles.analyst) {
    const t = roles.analyst.trend
    if (t === 'strong_up' || t === 'up') bullish++
    else if (t === 'strong_down' || t === 'down') bearish++
    else neutral++

    // Check volume confirmation
    if ((t === 'strong_up' || t === 'up') && roles.analyst.volume_trend === 'decreasing') {
      debates.push('分析师: 趋势偏多但量能萎缩，上涨持续性存疑')
    }
  }

  // Collector sentiment
  if (roles.collector) {
    if (roles.collector.bid_ask_ratio !== null) {
      if (roles.collector.bid_ask_ratio > 1.2) bullish++
      else if (roles.collector.bid_ask_ratio < 0.8) bearish++
      else neutral++
    }
    if (roles.collector.buy_volume_pct !== null) {
      if (roles.collector.buy_volume_pct > 55) bullish++
      else if (roles.collector.buy_volume_pct < 45) bearish++
      else neutral++
    }
  }

  // Risk check
  if (roles.risk_officer) {
    if (roles.risk_officer.risk_score >= 8) {
      debates.push(`风控官: 风险评分 ${roles.risk_officer.risk_score}/10，建议轻仓`)
    }
    if (roles.risk_officer.volatility_percentile > 80) {
      debates.push('风控官: 波动率处于历史高位，注意回撤风险')
    }
  }

  // Executor liquidity
  if (roles.executor) {
    if (roles.executor.liquidity_score < 5) {
      debates.push('执行员: 流动性不足，建议分批操作')
    }
  }

  // Strategist vs analyst disagreement
  if (roles.strategist && roles.analyst) {
    const sigBull = roles.strategist.signal === 'LONG'
    const trendBull = roles.analyst.trend === 'strong_up' || roles.analyst.trend === 'up'
    if (sigBull && !trendBull) debates.push('分歧: 策略师看多但分析师趋势中性/偏空')
    if (!sigBull && trendBull) debates.push('分歧: 分析师趋势偏多但策略师信号不是LONG')
  }

  // Consensus score (-1 to +1)
  const total = bullish + bearish + neutral
  const consensusScore = total > 0 ? (bullish - bearish) / total : 0

  // Final verdict
  let verdict: CEOOutput['verdict']
  if (consensusScore > 0.3 && (!roles.risk_officer || roles.risk_officer.risk_score <= 7)) {
    verdict = 'LONG'
  } else if (consensusScore < -0.3 && (!roles.risk_officer || roles.risk_officer.risk_score <= 7)) {
    verdict = 'SHORT'
  } else if (roles.risk_officer && roles.risk_officer.risk_score >= 8) {
    verdict = 'WAIT'
  } else {
    verdict = 'HOLD'
  }

  // Action plan
  let actionPlan = ''
  if (verdict === 'LONG') {
    const pct = roles.risk_officer?.suggested_position_pct ?? 10
    const sl = roles.risk_officer?.stop_loss_price
    actionPlan = `建议做多，仓位 ≤${pct}%${sl ? `，止损 $${sl.toFixed(2)}` : ''}`
  } else if (verdict === 'SHORT') {
    const pct = roles.risk_officer?.suggested_position_pct ?? 10
    actionPlan = `建议做空，仓位 ≤${pct}%`
  } else if (verdict === 'WAIT') {
    actionPlan = '风险过高，建议观望等待更好入场时机'
  } else {
    actionPlan = '信号不明确，维持现有仓位，不建议新开仓'
  }

  // Invalidation
  let invalidation = ''
  if (roles.analyst) {
    if (verdict === 'LONG' || verdict === 'HOLD') {
      invalidation = `跌破支撑 $${roles.analyst.support.toFixed(2)} 则判断失效`
    } else {
      invalidation = `突破阻力 $${roles.analyst.resistance.toFixed(2)} 则判断失效`
    }
  }

  const verdictLabel = { LONG: '看多', SHORT: '看空', HOLD: '观望', WAIT: '等待' }[verdict]
  const summary = `${verdictLabel} | 共识 ${bullish}多/${bearish}空/${neutral}中 | ${actionPlan}`

  return {
    role: 'ceo', symbol, at: now,
    verdict, consensus_score: consensusScore,
    bullish_count: bullish, bearish_count: bearish, neutral_count: neutral,
    key_debates: debates,
    action_plan: actionPlan,
    invalidation,
    summary,
  }
}
