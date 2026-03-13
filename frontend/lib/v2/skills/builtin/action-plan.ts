import type { Skill, MarketSnapshot, SkillResult } from '../../types'

export const actionPlanSkill: Skill = {
  meta: {
    id: 'action-plan',
    name: 'Action Plan Generator',
    version: '1.0.0',
    category: 'decision',
    compatibleRoles: ['ceo'],
    description: '行动方案生成 (入场价/止损/止盈/仓位)',
  },
  compute(snapshot: MarketSnapshot): SkillResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentOutputs = (snapshot as any)._agentOutputs as Record<string, any> | undefined
    const price = snapshot.quote.price

    if (!agentOutputs) {
      return { skillId: 'action-plan', data: {}, summary: '无Agent输出' }
    }

    // Get risk officer's SL/TP suggestions
    const riskResults = agentOutputs.risk_officer?.skillResults || []
    const positionSizer = riskResults.find((r: any) => r.skillId === 'position-sizer')
    const slLong = positionSizer?.data?.sl_long || price * 0.97
    const tpLong = positionSizer?.data?.tp_long || price * 1.06
    const slShort = positionSizer?.data?.sl_short || price * 1.03
    const tpShort = positionSizer?.data?.tp_short || price * 0.94
    const positionPct = positionSizer?.data?.position_pct || 10

    // Get executor's entry suggestion
    const executorResults = agentOutputs.executor?.skillResults || []
    const entryOpt = executorResults.find((r: any) => r.skillId === 'entry-optimizer')
    const suggestedEntry = entryOpt?.data?.suggested_entry || price
    const orderType = entryOpt?.data?.order_type || 'market'

    // Determine direction from consensus
    const strategist = agentOutputs.strategist
    const direction = strategist?.direction || 'WAIT'

    const plan = direction === 'LONG' ? {
      direction: 'LONG',
      entry: suggestedEntry,
      stop_loss: slLong,
      take_profit: tpLong,
      position_pct: positionPct,
      order_type: orderType,
      risk_reward: tpLong > slLong ? (tpLong - suggestedEntry) / (suggestedEntry - slLong) : 0,
    } : direction === 'SHORT' ? {
      direction: 'SHORT',
      entry: suggestedEntry,
      stop_loss: slShort,
      take_profit: tpShort,
      position_pct: positionPct,
      order_type: orderType,
      risk_reward: slShort > tpShort ? (suggestedEntry - tpShort) / (slShort - suggestedEntry) : 0,
    } : {
      direction: 'WAIT',
      entry: null,
      stop_loss: null,
      take_profit: null,
      position_pct: 0,
      order_type: 'none',
      risk_reward: 0,
    }

    return {
      skillId: 'action-plan',
      data: plan,
      summary: plan.direction === 'WAIT'
        ? '观望，不建议入场'
        : `${plan.direction} @ ${plan.entry?.toFixed(2)} | SL ${plan.stop_loss?.toFixed(2)} TP ${plan.take_profit?.toFixed(2)} | 仓位 ${plan.position_pct?.toFixed(1)}% | RR ${plan.risk_reward?.toFixed(1)}`,
    }
  },
}
