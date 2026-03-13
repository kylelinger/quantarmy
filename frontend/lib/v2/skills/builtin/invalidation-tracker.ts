import type { Skill, MarketSnapshot, SkillResult } from '../../types'

export const invalidationTrackerSkill: Skill = {
  meta: {
    id: 'invalidation-tracker',
    name: 'Invalidation Tracker',
    version: '1.0.0',
    category: 'decision',
    compatibleRoles: ['ceo'],
    description: '失效条件追踪 — 什么时候应该放弃这个判断',
  },
  compute(snapshot: MarketSnapshot): SkillResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentOutputs = (snapshot as any)._agentOutputs as Record<string, any> | undefined
    const price = snapshot.quote.price

    const conditions: string[] = []

    if (agentOutputs) {
      // From risk officer: SL breach
      const riskResults = agentOutputs.risk_officer?.skillResults || []
      const positionData = riskResults.find((r: any) => r.skillId === 'position-sizer')?.data
      if (positionData?.sl_long && agentOutputs.strategist?.direction === 'LONG') {
        conditions.push(`价格跌破 ${positionData.sl_long.toFixed(2)} (止损位)`)
      }
      if (positionData?.sl_short && agentOutputs.strategist?.direction === 'SHORT') {
        conditions.push(`价格涨破 ${positionData.sl_short.toFixed(2)} (止损位)`)
      }

      // From regime detector: regime change
      const researchResults = agentOutputs.researcher?.skillResults || []
      const regime = researchResults.find((r: any) => r.skillId === 'regime-detector')?.data
      if (regime?.regime === 'strong_trend') {
        conditions.push('市场转入震荡状态 (ADX跌破20)')
      } else if (regime?.regime === 'quiet_range') {
        conditions.push('市场突然放量 (成交量>3x均值)')
      }

      // From CTO: data degradation
      const ctoResults = agentOutputs.cto?.skillResults || []
      const quality = ctoResults.find((r: any) => r.skillId === 'data-quality')?.data
      if (quality?.score < 60) {
        conditions.push('数据质量恶化 (低于60分)')
      }

      // From analyst: key level breach
      const analystResults = agentOutputs.analyst?.skillResults || []
      const sr = analystResults.find((r: any) => r.skillId === 'support-resistance')?.data
      if (sr?.support_1 && agentOutputs.strategist?.direction === 'LONG') {
        conditions.push(`关键支撑 ${sr.support_1.toFixed(2)} 被跌破`)
      }
      if (sr?.resistance_1 && agentOutputs.strategist?.direction === 'SHORT') {
        conditions.push(`关键阻力 ${sr.resistance_1.toFixed(2)} 被突破`)
      }
    }

    // Default invalidation if nothing specific
    if (conditions.length === 0) {
      conditions.push('无法确定具体失效条件 — 建议设置固定止损')
    }

    return {
      skillId: 'invalidation-tracker',
      data: {
        conditions,
        count: conditions.length,
      },
      summary: `失效条件(${conditions.length}): ${conditions.slice(0, 2).join('; ')}`,
    }
  },
}
