/**
 * Agent Runner — executes an agent's skills and produces AgentOutput
 */

import type { AgentConfig, AgentOutput, MarketSnapshot, SkillResult, DebateStance, Direction, RoleType } from '../types'
import { getSkill } from '../skills/registry'
import { getMemoryContext } from '../memory/store'

/**
 * Run a single agent: execute all equipped skills, then synthesize output
 */
export function runAgent(config: AgentConfig, snapshot: MarketSnapshot): AgentOutput {
  const now = new Date().toISOString()
  const { role, persona, skillIds } = config

  // Execute all equipped skills
  const skillResults: SkillResult[] = []
  for (const skillId of skillIds) {
    const skill = getSkill(skillId)
    if (skill) {
      try {
        skillResults.push(skill.compute(snapshot))
      } catch (e) {
        skillResults.push({
          skillId,
          data: { error: String(e) },
          summary: `Skill执行失败: ${skillId}`,
        })
      }
    }
  }

  // Get memory context
  const memoryCtx = getMemoryContext(role, snapshot.symbol)

  // Synthesize agent output from skill results
  const { stance, direction, confidence, reasoning } = synthesize(role, persona, skillResults, memoryCtx)

  const summary = buildSummary(role, direction, confidence, reasoning)

  return {
    role,
    symbol: snapshot.symbol,
    at: now,
    stance,
    direction,
    confidence,
    skillResults,
    reasoning,
    summary,
    revised: false,
  }
}

/**
 * Synthesize direction + confidence from skill results
 * This is where the agent's "personality" comes in
 */
function synthesize(
  role: RoleType,
  persona: AgentConfig['persona'],
  results: SkillResult[],
  _memoryCtx: string
): { stance: DebateStance; direction: Direction; confidence: number; reasoning: string[] } {
  const reasoning: string[] = []

  // Collect signal votes from skill results
  let bullPoints = 0
  let bearPoints = 0
  let totalPoints = 0

  for (const r of results) {
    const signal = r.data.signal as string | undefined
    const direction = r.data.direction as string | undefined
    const bias = r.data.bias as string | undefined
    const flowDir = r.data.flow_direction as string | undefined

    if (signal === 'LONG' || direction === 'bull' || bias === 'bullish' || flowDir === 'buy_pressure') {
      bullPoints += 2
      reasoning.push(`${r.skillId}: 看多`)
    } else if (signal === 'SHORT' || direction === 'bear' || bias === 'bearish' || flowDir === 'sell_pressure') {
      bearPoints += 2
      reasoning.push(`${r.skillId}: 看空`)
    } else if (signal === 'HOLD') {
      reasoning.push(`${r.skillId}: 中性`)
    }
    totalPoints += 2

    // Add summary as reasoning
    if (r.summary && !r.summary.includes('数据不足')) {
      reasoning.push(r.summary)
    }
  }

  // Apply persona bias
  if (persona.bias === 'bullish') bullPoints += 1
  else if (persona.bias === 'bearish') bearPoints += 1
  else if (persona.bias === 'contrarian') {
    // Contrarian flips weak signals
    if (bullPoints > bearPoints && bullPoints - bearPoints < 3) {
      bearPoints += 2
      reasoning.push('(逆向思维加权)')
    } else if (bearPoints > bullPoints && bearPoints - bullPoints < 3) {
      bullPoints += 2
      reasoning.push('(逆向思维加权)')
    }
  }

  // Apply aggressiveness to confidence
  const rawScore = totalPoints > 0 ? (bullPoints - bearPoints) / totalPoints : 0
  let confidence = Math.min(0.95, 0.3 + Math.abs(rawScore) * 0.6)
  confidence = confidence * (0.7 + persona.aggressiveness * 0.3) // aggressive → higher confidence

  // Determine stance and direction
  let stance: DebateStance
  let direction: Direction

  if (rawScore > 0.2) {
    stance = 'bullish'
    direction = confidence > 0.5 ? 'LONG' : 'HOLD'
  } else if (rawScore < -0.2) {
    stance = 'bearish'
    direction = confidence > 0.5 ? 'SHORT' : 'HOLD'
  } else {
    stance = 'neutral'
    direction = 'HOLD'
    confidence = Math.min(confidence, 0.4)
  }

  // Special role overrides
  if (role === 'risk_officer') {
    // Risk officer outputs risk score instead of direction signal
    const riskScore = results.find(r => r.data.risk_level)?.data.risk_level
    if (riskScore === 'extreme' || riskScore === 'high') {
      confidence *= 0.7
      reasoning.push('风险偏高，降低信心')
    }
  }

  if (role === 'cto') {
    // CTO doesn't give direction, gives quality assessment
    const qualityScore = results.find(r => r.data.score !== undefined)?.data.score as number | undefined
    if (qualityScore !== undefined && qualityScore < 60) {
      stance = 'neutral'
      direction = 'WAIT'
      reasoning.push(`数据质量不足(${qualityScore}/100)，建议等待`)
    }
  }

  return { stance, direction, confidence, reasoning }
}

function buildSummary(role: RoleType, direction: Direction, confidence: number, reasoning: string[]): string {
  const roleNames: Record<RoleType, string> = {
    collector: '采集员', strategist: '策略师', risk_officer: '风控官',
    analyst: '分析师', researcher: '研究员', executor: '执行员',
    cto: '技术官', ceo: '决策者',
  }
  const dirMap: Record<Direction, string> = { LONG: '看多', SHORT: '看空', HOLD: '中性', WAIT: '等待' }
  return `${roleNames[role]}: ${dirMap[direction]} (${(confidence * 100).toFixed(0)}%) — ${reasoning.slice(0, 2).join(', ')}`
}
