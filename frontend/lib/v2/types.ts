/**
 * V2 Core Types — Agent, Skill, Debate, Memory
 */

import type { MarketType, Kline, Quote, Depth, RecentTrade } from '../market-adapter'

// ============================================================
// Role & Direction
// ============================================================

export type RoleType = 'collector' | 'strategist' | 'risk_officer' | 'analyst' | 'researcher' | 'executor' | 'cto' | 'ceo'

export type Direction = 'LONG' | 'SHORT' | 'HOLD' | 'WAIT'

export type DebateStance = 'bullish' | 'bearish' | 'neutral'

// ============================================================
// Market Data (shared input)
// ============================================================

export interface MarketSnapshot {
  symbol: string
  market: MarketType
  fetchedAt: string
  quote: Quote
  klines_1h: Kline[]
  klines_4h: Kline[]
  klines_1d: Kline[]
  depth: Depth | null
  recentTrades: RecentTrade[]
  btc_klines_1d?: Kline[]
}

// ============================================================
// Skill System
// ============================================================

export type SkillCategory = 'signal' | 'risk' | 'data' | 'execution' | 'statistics' | 'audit' | 'decision' | 'universal'

export interface SkillMeta {
  id: string
  name: string
  version: string
  category: SkillCategory
  compatibleRoles: RoleType[]
  description: string
}

/** Skill compute result — flat key-value for agent to interpret */
export interface SkillResult {
  skillId: string
  data: Record<string, unknown>
  summary: string
}

/** A skill is a pure function: snapshot → result */
export interface Skill {
  meta: SkillMeta
  compute(snapshot: MarketSnapshot): SkillResult
}

// ============================================================
// Agent System
// ============================================================

export interface AgentPersona {
  name: string           // "趋势猎手"
  description: string    // one-line
  bias: 'bullish' | 'bearish' | 'neutral' | 'contrarian'
  aggressiveness: number // 0-1 (0=conservative, 1=aggressive)
  debateStyle: string    // how this agent argues
}

export interface AgentConfig {
  role: RoleType
  persona: AgentPersona
  skillIds: string[]     // equipped skill IDs
  weight: number         // for CEO aggregation (default 1.0)
}

/** Output from a single agent after running skills + applying persona */
export interface AgentOutput {
  role: RoleType
  symbol: string
  at: string
  stance: DebateStance
  direction: Direction
  confidence: number     // 0-1
  riskScore?: number     // 1-10 (risk_officer)
  skillResults: SkillResult[]
  reasoning: string[]    // key reasons
  summary: string
  // Fields that may be revised after debate
  revised: boolean
  originalConfidence?: number
  originalDirection?: Direction
}

// ============================================================
// Debate System
// ============================================================

export type ChallengeType = 'disagree' | 'question' | 'extend' | 'invalidate'

export interface Challenge {
  id: string
  round: number
  from: RoleType
  to: RoleType
  type: ChallengeType
  content: string
  evidence: string[]
}

export interface Rebuttal {
  id: string
  challengeId: string
  from: RoleType
  content: string
  conceded: boolean      // did they change their view?
  revisedConfidence?: number
  revisedDirection?: Direction
}

export interface DebateRound {
  round: number
  challenges: Challenge[]
  rebuttals: Rebuttal[]
}

export interface DebateTranscript {
  symbol: string
  at: string
  rounds: DebateRound[]
  totalChallenges: number
  totalConcessions: number
}

// ============================================================
// CEO Decision
// ============================================================

export interface CEODecision {
  symbol: string
  at: string
  verdict: Direction
  confidence: number
  consensusScore: number          // -1 (all short) to +1 (all long)
  bullishCount: number
  bearishCount: number
  neutralCount: number
  thesis: string
  actionPlan: {
    entry?: number
    stopLoss?: number
    takeProfit?: number
    positionPct?: number
  }
  invalidation: string[]
  keyDebates: string[]
  dissent: string[]               // minority opinions worth noting
  summary: string
}

// ============================================================
// Memory System
// ============================================================

export interface AnalysisRecord {
  id: string                      // uuid
  symbol: string
  at: string
  role: RoleType
  direction: Direction
  confidence: number
  reasoning: string
  // Outcome tracking (filled later when price data available)
  outcome?: 'correct' | 'incorrect' | 'pending'
  priceAtAnalysis?: number
  priceAfter24h?: number
}

export interface AgentMemory {
  role: RoleType
  records: AnalysisRecord[]       // ordered by time, newest first
}

export interface MetaMemoryStats {
  role: RoleType
  totalAnalyses: number
  correctCount: number
  incorrectCount: number
  pendingCount: number
  accuracy: number                // correct / (correct + incorrect)
  perSymbol: Record<string, {
    total: number
    correct: number
    accuracy: number
    lastDirection: Direction
    lastOutcome?: 'correct' | 'incorrect' | 'pending'
  }>
}

// ============================================================
// V2 Full Analysis Result
// ============================================================

export type AnalysisPhase = 'collecting' | 'analyzing' | 'debating' | 'deciding' | 'storing' | 'complete'

export interface V2AnalysisResult {
  symbol: string
  market: MarketType
  at: string
  phase: AnalysisPhase
  // Phase 1
  snapshot: MarketSnapshot | null
  // Phase 2
  agentOutputs: Record<RoleType, AgentOutput> | null
  // Phase 3
  debate: DebateTranscript | null
  // Phase 4
  decision: CEODecision | null
  // Timing
  timing: {
    collectMs?: number
    analyzeMs?: number
    debateMs?: number
    decideMs?: number
    totalMs?: number
  }
}
