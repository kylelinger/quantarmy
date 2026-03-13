/**
 * Debate Engine — rule-based debate between agents
 * 
 * Key innovation: agents don't just analyze independently, they challenge each other.
 * The debate produces revised opinions and a richer consensus.
 */

import type {
  AgentOutput, Challenge, Rebuttal, DebateRound, DebateTranscript,
  RoleType, ChallengeType
} from '../types'
import { getMemoryContext } from '../memory/store'

// ============================================================
// Debate Pairs — who challenges whom
// ============================================================

interface DebatePair {
  challenger: RoleType
  target: RoleType
  tension: string
}

const DEBATE_PAIRS: DebatePair[] = [
  { challenger: 'risk_officer', target: 'strategist', tension: '风控 vs 进攻' },
  { challenger: 'strategist', target: 'risk_officer', tension: '信号 vs 风险' },
  { challenger: 'researcher', target: 'analyst', tension: '统计 vs 形态' },
  { challenger: 'analyst', target: 'researcher', tension: '技术 vs 统计' },
  { challenger: 'executor', target: 'strategist', tension: '执行 vs 理论' },
  { challenger: 'collector', target: 'researcher', tension: '实时数据 vs 历史' },
]

// CTO can challenge anyone (special privilege)
const CTO_TARGETS: RoleType[] = ['strategist', 'risk_officer', 'analyst', 'researcher', 'executor', 'collector']

// ============================================================
// Main Engine
// ============================================================

/**
 * Run debate between agents (2 rounds max)
 */
export function runDebate(
  agentOutputs: Record<RoleType, AgentOutput>,
  maxRounds: number = 2
): DebateTranscript {
  const now = new Date().toISOString()
  const symbol = Object.values(agentOutputs)[0]?.symbol || ''
  const rounds: DebateRound[] = []
  let totalChallenges = 0
  let totalConcessions = 0

  // Working copy of outputs (may be revised during debate)
  const working = { ...agentOutputs }

  for (let round = 1; round <= maxRounds; round++) {
    const challenges: Challenge[] = []
    const rebuttals: Rebuttal[] = []

    // Generate challenges from natural pairs
    for (const pair of DEBATE_PAIRS) {
      const challenger = working[pair.challenger]
      const target = working[pair.target]
      if (!challenger || !target) continue

      const challenge = generateChallenge(challenger, target, pair, round)
      if (challenge) {
        challenges.push(challenge)
        totalChallenges++

        // Generate rebuttal
        const rebuttal = generateRebuttal(challenge, target, challenger)
        rebuttals.push(rebuttal)
        if (rebuttal.conceded) {
          totalConcessions++
          // Apply revision to working copy
          working[target.role] = {
            ...working[target.role],
            revised: true,
            originalConfidence: working[target.role].originalConfidence || working[target.role].confidence,
            originalDirection: working[target.role].originalDirection || working[target.role].direction,
            confidence: rebuttal.revisedConfidence || working[target.role].confidence,
            direction: rebuttal.revisedDirection || working[target.role].direction,
          }
        }
      }
    }

    // CTO audit challenges (pick the most problematic agent)
    const cto = working.cto
    if (cto) {
      const ctoTarget = findCtoTarget(working)
      if (ctoTarget) {
        const ctoChallenge = generateCtoChallenge(cto, working[ctoTarget], round)
        if (ctoChallenge) {
          challenges.push(ctoChallenge)
          totalChallenges++
          const rebuttal = generateRebuttal(ctoChallenge, working[ctoTarget], cto)
          rebuttals.push(rebuttal)
          if (rebuttal.conceded) totalConcessions++
        }
      }
    }

    rounds.push({ round, challenges, rebuttals })

    // Stop early if no challenges generated
    if (challenges.length === 0) break
  }

  return {
    symbol,
    at: now,
    rounds,
    totalChallenges,
    totalConcessions,
  }
}

// ============================================================
// Challenge Generation (rule-based)
// ============================================================

let _challengeId = 0
function nextId(): string { return `ch-${++_challengeId}` }
let _rebuttalId = 0
function nextRebuttalId(): string { return `rb-${++_rebuttalId}` }

function generateChallenge(
  challenger: AgentOutput,
  target: AgentOutput,
  pair: DebatePair,
  round: number
): Challenge | null {
  // Only challenge if they disagree
  if (challenger.stance === target.stance) return null
  
  // Or if confidence seems unjustified
  const confGap = target.confidence - challenger.confidence
  const stanceConflict = challenger.stance !== target.stance && challenger.stance !== 'neutral' && target.stance !== 'neutral'

  if (!stanceConflict && confGap < 0.2) return null

  // Build challenge content based on role pair
  const { type, content, evidence } = buildChallengeContent(challenger, target, pair)

  return {
    id: nextId(),
    round,
    from: challenger.role,
    to: target.role,
    type,
    content,
    evidence,
  }
}

function buildChallengeContent(
  challenger: AgentOutput,
  target: AgentOutput,
  pair: DebatePair
): { type: ChallengeType; content: string; evidence: string[] } {
  const evidence: string[] = []
  
  // Extract key data points from challenger's skills
  for (const sr of challenger.skillResults) {
    if (sr.summary && !sr.summary.includes('数据不足')) {
      evidence.push(sr.summary)
    }
  }

  // Role-specific challenge templates
  if (challenger.role === 'risk_officer' && target.role === 'strategist') {
    const riskLevel = challenger.skillResults.find(r => r.data.risk_level)?.data.risk_level
    const volPct = challenger.skillResults.find(r => r.data.atr_pct)?.data.atr_pct
    return {
      type: 'disagree',
      content: `你看${target.stance === 'bullish' ? '多' : '空'}信心${(target.confidence * 100).toFixed(0)}%，但当前波动率${typeof volPct === 'number' ? volPct.toFixed(1) + '%' : '偏高'}，风险等级${riskLevel || '中'}。仓位应该更保守。`,
      evidence,
    }
  }

  if (challenger.role === 'strategist' && target.role === 'risk_officer') {
    const signal = challenger.skillResults.find(r => r.data.signal)?.data.signal
    return {
      type: 'disagree',
      content: `你的风控太保守了。${signal || '技术信号'}已经确认方向，过度保守会错失行情。`,
      evidence,
    }
  }

  if (challenger.role === 'researcher' && target.role === 'analyst') {
    const winRate = challenger.skillResults.find(r => r.data.win_rate)?.data.win_rate
    return {
      type: 'question',
      content: `你的形态分析看${target.stance === 'bullish' ? '多' : '空'}，但历史统计显示胜率${typeof winRate === 'number' ? winRate.toFixed(0) + '%' : '并不乐观'}。你怎么解释这个分歧？`,
      evidence,
    }
  }

  if (challenger.role === 'executor' && target.role === 'strategist') {
    const liquidityScore = challenger.skillResults.find(r => r.data.score)?.data.score
    return {
      type: 'question',
      content: `你的信号不错，但流动性评分只有${liquidityScore || '?'}/10。在目标价位能顺利执行吗？`,
      evidence,
    }
  }

  // Generic challenge
  return {
    type: stanceToType(challenger.stance, target.stance),
    content: `作为${pair.tension}的另一面，我质疑你${(target.confidence * 100).toFixed(0)}%的信心。我的分析显示不同方向。`,
    evidence,
  }
}

function stanceToType(challengerStance: string, targetStance: string): ChallengeType {
  if (challengerStance !== targetStance) return 'disagree'
  return 'question'
}

function generateCtoChallenge(cto: AgentOutput, target: AgentOutput, round: number): Challenge | null {
  const qualityScore = cto.skillResults.find(r => r.data.score !== undefined)?.data.score as number | undefined
  const anomalies = cto.skillResults.find(r => r.data.anomalies)?.data.anomalies as string[] | undefined
  const contradictions = cto.skillResults.find(r => r.data.contradictions)?.data.contradictions as string[] | undefined

  const issues: string[] = []
  if (qualityScore !== undefined && qualityScore < 70) issues.push(`数据质量仅${qualityScore}/100`)
  if (anomalies && anomalies.length > 0) issues.push(anomalies[0])
  if (contradictions && contradictions.length > 0) issues.push(contradictions[0])

  if (issues.length === 0) return null

  return {
    id: nextId(),
    round,
    from: 'cto',
    to: target.role,
    type: 'invalidate',
    content: `⚠️ 审计发现问题: ${issues.join('; ')}。你的结论可能基于不完整或矛盾的数据。`,
    evidence: issues,
  }
}

function findCtoTarget(outputs: Record<RoleType, AgentOutput>): RoleType | null {
  // Target the agent with highest confidence (most likely to be overconfident)
  let maxConf = 0
  let target: RoleType | null = null
  for (const role of CTO_TARGETS) {
    if (outputs[role] && outputs[role].confidence > maxConf) {
      maxConf = outputs[role].confidence
      target = role
    }
  }
  return target
}

// ============================================================
// Rebuttal Generation (rule-based)
// ============================================================

function generateRebuttal(
  challenge: Challenge,
  target: AgentOutput,
  _challenger: AgentOutput
): Rebuttal {
  // Should the target concede?
  const shouldConcede = evaluateChallenge(challenge, target)

  if (shouldConcede) {
    const newConfidence = target.confidence * 0.75 // reduce confidence by 25%
    return {
      id: nextRebuttalId(),
      challengeId: challenge.id,
      from: target.role,
      content: `有道理。我调低信心从${(target.confidence * 100).toFixed(0)}%到${(newConfidence * 100).toFixed(0)}%。${challenge.type === 'invalidate' ? '数据质量问题确实需要关注。' : '但核心判断方向不变。'}`,
      conceded: true,
      revisedConfidence: newConfidence,
    }
  } else {
    return {
      id: nextRebuttalId(),
      challengeId: challenge.id,
      from: target.role,
      content: buildRebuttalContent(challenge, target),
      conceded: false,
    }
  }
}

function evaluateChallenge(challenge: Challenge, target: AgentOutput): boolean {
  // CTO invalidation challenges are harder to rebut
  if (challenge.type === 'invalidate') return challenge.evidence.length >= 2

  // High-evidence challenges more likely to succeed
  if (challenge.evidence.length >= 3 && target.confidence < 0.7) return true

  // Low confidence targets concede more easily
  if (target.confidence < 0.4) return true

  // Random element for variety (30% concession rate for close calls)
  return Math.random() < 0.3
}

function buildRebuttalContent(challenge: Challenge, target: AgentOutput): string {
  const roleNames: Record<RoleType, string> = {
    collector: '采集员', strategist: '策略师', risk_officer: '风控官',
    analyst: '分析师', researcher: '研究员', executor: '执行员',
    cto: '技术官', ceo: '决策者',
  }

  const topSkill = target.skillResults[0]
  const keyPoint = topSkill?.summary || '我的分析结果'

  return `不同意。${keyPoint}。我维持${(target.confidence * 100).toFixed(0)}%的信心。${challenge.from === 'cto' ? '数据已经经过多重验证。' : ''}`
}
