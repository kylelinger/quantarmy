import type { Skill, MarketSnapshot, SkillResult } from '../../types'

/**
 * ConsensusAggregator — CEO's primary skill
 * Note: This skill receives agent outputs via snapshot._agentOutputs (injected by orchestrator)
 * It's a special skill that operates on other agents' outputs, not just market data.
 */
export const consensusAggregatorSkill: Skill = {
  meta: {
    id: 'consensus-aggregator',
    name: 'Consensus Aggregator',
    version: '1.0.0',
    category: 'decision',
    compatibleRoles: ['ceo'],
    description: '加权共识算法 — 聚合所有角色意见',
  },
  compute(snapshot: MarketSnapshot): SkillResult {
    // Agent outputs are injected into snapshot by the orchestrator
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentOutputs = (snapshot as any)._agentOutputs as Record<string, { stance: string; confidence: number; direction: string }> | undefined

    if (!agentOutputs) {
      return { skillId: 'consensus-aggregator', data: { error: 'no_agent_outputs' }, summary: '无Agent输出数据' }
    }

    const weights: Record<string, number> = {
      strategist: 1.5,
      risk_officer: 1.3,
      analyst: 1.0,
      researcher: 0.8,
      collector: 0.7,
      executor: 0.9,
      cto: 1.2,
    }

    let bullScore = 0
    let bearScore = 0
    let totalWeight = 0
    let bullCount = 0
    let bearCount = 0
    let neutralCount = 0

    for (const [role, output] of Object.entries(agentOutputs)) {
      if (role === 'ceo') continue // skip self
      const w = weights[role] || 1.0
      totalWeight += w

      if (output.stance === 'bullish') {
        bullScore += w * output.confidence
        bullCount++
      } else if (output.stance === 'bearish') {
        bearScore += w * output.confidence
        bearCount++
      } else {
        neutralCount++
      }
    }

    // Consensus score: -1 (all bearish) to +1 (all bullish)
    const consensusScore = totalWeight > 0 ? (bullScore - bearScore) / totalWeight : 0
    const confidence = totalWeight > 0 ? Math.max(bullScore, bearScore) / totalWeight : 0

    return {
      skillId: 'consensus-aggregator',
      data: {
        consensus_score: consensusScore,
        confidence,
        bull_score: bullScore,
        bear_score: bearScore,
        total_weight: totalWeight,
        bull_count: bullCount,
        bear_count: bearCount,
        neutral_count: neutralCount,
      },
      summary: `共识 ${consensusScore > 0.3 ? '偏多' : consensusScore < -0.3 ? '偏空' : '分歧'} (${consensusScore.toFixed(2)}) | 多${bullCount}:空${bearCount}:中${neutralCount}`,
    }
  },
}
