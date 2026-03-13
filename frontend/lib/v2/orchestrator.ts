/**
 * V2 Orchestrator — coordinates all 5 phases of analysis
 *
 * Phase 1: Data Collection (fetch snapshot)
 * Phase 2: Independent Analysis (8 agents run in parallel)
 * Phase 3: Debate (2 rounds of challenges)
 * Phase 4: CEO Decision (consensus + action plan)
 * Phase 5: Memory Update (store records for self-improvement)
 */

import type {
  V2AnalysisResult, MarketSnapshot, AgentOutput, CEODecision,
  RoleType, Direction, AnalysisRecord
} from './types'
import { getAllAgentConfigs } from './agents/personas'
import { runAgent } from './agents/runner'
import { runDebate } from './debate/engine'
import { saveRecord } from './memory/store'
import { detectMarket as detectSource } from '../market-adapter'

// ============================================================
// Public API
// ============================================================

export type ProgressCallback = (phase: V2AnalysisResult['phase'], partial?: Partial<V2AnalysisResult>) => void

export async function runV2Analysis(
  symbol: string,
  onProgress?: ProgressCallback
): Promise<V2AnalysisResult> {
  const market = detectSource(symbol)
  const result: V2AnalysisResult = {
    symbol,
    market,
    at: new Date().toISOString(),
    phase: 'collecting',
    snapshot: null,
    agentOutputs: null,
    debate: null,
    decision: null,
    timing: {},
  }

  // ── Phase 1: Collect ──────────────────────────────────────
  onProgress?.('collecting')
  const t0 = Date.now()
  try {
    result.snapshot = await fetchSnapshot(symbol, market)
  } catch (e) {
    console.error('Snapshot fetch failed:', e)
    result.snapshot = makeFallbackSnapshot(symbol, market)
  }
  result.timing.collectMs = Date.now() - t0

  // ── Phase 2: Analyze ─────────────────────────────────────
  onProgress?.('analyzing')
  const t1 = Date.now()
  const agents = getAllAgentConfigs().filter(a => a.role !== 'ceo')
  const agentOutputs: Record<string, AgentOutput> = {}

  for (const config of agents) {
    agentOutputs[config.role] = runAgent(config, result.snapshot)
  }
  result.agentOutputs = agentOutputs as Record<RoleType, AgentOutput>
  result.timing.analyzeMs = Date.now() - t1
  onProgress?.('analyzing', { agentOutputs: result.agentOutputs })

  // ── Phase 3: Debate ───────────────────────────────────────
  onProgress?.('debating')
  const t2 = Date.now()
  result.debate = runDebate(agentOutputs as Record<RoleType, AgentOutput>, 2)
  result.timing.debateMs = Date.now() - t2
  onProgress?.('debating', { debate: result.debate })

  // ── Phase 4: CEO Decision ─────────────────────────────────
  onProgress?.('deciding')
  const t3 = Date.now()
  const ceoConfig = getAllAgentConfigs().find(a => a.role === 'ceo')!
  const snapshotWithOutputs = {
    ...result.snapshot,
    _agentOutputs: agentOutputs,
  }
  const ceoOutput = runAgent(ceoConfig, snapshotWithOutputs as MarketSnapshot)
  result.decision = buildCEODecision(symbol, ceoOutput, agentOutputs as Record<RoleType, AgentOutput>)
  result.timing.decideMs = Date.now() - t3
  result.timing.totalMs = Date.now() - t0

  // ── Phase 5: Memory Update ────────────────────────────────
  onProgress?.('storing')
  storeAnalysisRecords(symbol, result.snapshot.quote.price, agentOutputs as Record<RoleType, AgentOutput>)

  result.phase = 'complete'
  onProgress?.('complete', result)

  return result
}

// ============================================================
// Phase 1: Fetch Snapshot
// ============================================================

async function fetchSnapshot(symbol: string, _market: string): Promise<MarketSnapshot> {
  // Fetch all in parallel
  const [quote, klines1h, klines4h, klines1d, depthTrades] = await Promise.all([
    fetch(`/api/market/ticker24h?symbol=${symbol}`).then(r => r.json()),
    fetch(`/api/market/klines?symbol=${symbol}&interval=1h&limit=200`).then(r => r.json()),
    fetch(`/api/market/klines?symbol=${symbol}&interval=4h&limit=100`).then(r => r.json()),
    fetch(`/api/market/klines?symbol=${symbol}&interval=1d&limit=365`).then(r => r.json()),
    fetchDepthAndTrades(symbol),
  ])

  // Optionally fetch BTC klines for beta calculation
  let btcKlines1d = undefined
  if (!symbol.startsWith('BTC') && symbol.endsWith('USDT')) {
    try {
      const btcData = await fetch('/api/market/klines?symbol=BTCUSDT&interval=1d&limit=365').then(r => r.json())
      btcKlines1d = btcData.data || []
    } catch { /* ignore */ }
  }

  return {
    symbol,
    market: detectSource(symbol),
    fetchedAt: new Date().toISOString(),
    quote: quote.data || { symbol, price: 0, change_24h: 0, change_pct_24h: 0, high_24h: 0, low_24h: 0, volume_24h: 0, quote_volume_24h: 0, market: 'crypto', source: 'unknown', delayed: false },
    klines_1h: klines1h.data || [],
    klines_4h: klines4h.data || [],
    klines_1d: klines1d.data || [],
    depth: depthTrades.depth,
    recentTrades: depthTrades.trades,
    btc_klines_1d: btcKlines1d,
  }
}

async function fetchDepthAndTrades(symbol: string) {
  try {
    const [depth, trades] = await Promise.all([
      fetch(`/api/market/depth?symbol=${symbol}&limit=20`).then(r => r.json()),
      fetch(`/api/market/trades?symbol=${symbol}&limit=100`).then(r => r.json()),
    ])
    return {
      depth: depth.data || null,
      trades: trades.data || [],
    }
  } catch {
    return { depth: null, trades: [] }
  }
}

function makeFallbackSnapshot(symbol: string, _market: string): MarketSnapshot {
  return {
    symbol,
    market: detectSource(symbol),
    fetchedAt: new Date().toISOString(),
    quote: { symbol, price: 0, change_24h: 0, change_pct_24h: 0, high_24h: 0, low_24h: 0, volume_24h: 0, quote_volume_24h: 0, market: 'crypto', source: 'unknown', delayed: false },
    klines_1h: [],
    klines_4h: [],
    klines_1d: [],
    depth: null,
    recentTrades: [],
  }
}

// ============================================================
// Phase 4: Build CEO Decision
// ============================================================

function buildCEODecision(
  symbol: string,
  ceoOutput: AgentOutput,
  agentOutputs: Record<RoleType, AgentOutput>
): CEODecision {
  const now = new Date().toISOString()

  // Aggregate stances (weighted)
  const weights: Record<string, number> = {
    strategist: 1.5, risk_officer: 1.3, analyst: 1.0,
    researcher: 0.8, collector: 0.7, executor: 0.9, cto: 1.2,
  }

  let bullWeight = 0, bearWeight = 0, totalWeight = 0
  let bullishCount = 0, bearishCount = 0, neutralCount = 0
  const dissent: string[] = []

  for (const [role, output] of Object.entries(agentOutputs)) {
    if (role === 'ceo') continue
    const w = weights[role] || 1.0
    totalWeight += w
    if (output.stance === 'bullish') { bullWeight += w * output.confidence; bullishCount++ }
    else if (output.stance === 'bearish') { bearWeight += w * output.confidence; bearishCount++ }
    else neutralCount++
  }

  const consensusScore = totalWeight > 0 ? (bullWeight - bearWeight) / totalWeight : 0

  // Determine final verdict
  let verdict: Direction
  let confidence: number
  if (consensusScore > 0.35) { verdict = 'LONG'; confidence = Math.min(0.9, 0.4 + consensusScore * 0.6) }
  else if (consensusScore < -0.35) { verdict = 'SHORT'; confidence = Math.min(0.9, 0.4 + Math.abs(consensusScore) * 0.6) }
  else { verdict = 'HOLD'; confidence = 0.3 }

  // Check CTO veto
  const cto = agentOutputs.cto
  if (cto) {
    const qualityScore = cto.skillResults.find(r => r.data.score !== undefined)?.data.score as number | undefined
    if (qualityScore !== undefined && qualityScore < 50) {
      verdict = 'WAIT'
      confidence = 0.2
      dissent.push(`CTO VETO: 数据质量${qualityScore}/100，不具备分析条件`)
    }
  }

  // Collect minority dissent
  for (const [role, output] of Object.entries(agentOutputs)) {
    if (role === 'ceo') continue
    const isMinority = (verdict === 'LONG' && output.stance === 'bearish') ||
      (verdict === 'SHORT' && output.stance === 'bullish')
    if (isMinority && output.confidence > 0.5) {
      dissent.push(`${role}: 少数派看${output.stance === 'bullish' ? '多' : '空'} (${(output.confidence * 100).toFixed(0)}%)`)
    }
  }

  // Get action plan from CEO's skills
  const actionPlanResult = ceoOutput.skillResults.find(r => r.skillId === 'action-plan')
  const actionPlan = actionPlanResult?.data || {}

  // Get invalidation conditions
  const invalidationResult = ceoOutput.skillResults.find(r => r.skillId === 'invalidation-tracker')
  const invalidation = (invalidationResult?.data?.conditions as string[]) || []

  // Key debate summary
  const keyDebates = [
    bullishCount > 0 && `${bullishCount}人看多`,
    bearishCount > 0 && `${bearishCount}人看空`,
    neutralCount > 0 && `${neutralCount}人中性`,
  ].filter(Boolean) as string[]

  // Build thesis
  const dirMap: Record<Direction, string> = { LONG: '做多', SHORT: '做空', HOLD: '观望', WAIT: '等待数据' }
  const thesis = `综合${Object.keys(agentOutputs).length}个角色分析，共识为${dirMap[verdict]}。` +
    `多方${bullishCount}票，空方${bearishCount}票，中性${neutralCount}票。` +
    (dissent.length > 0 ? `注意少数派意见。` : '无明显异议。')

  return {
    symbol,
    at: now,
    verdict,
    confidence,
    consensusScore,
    bullishCount,
    bearishCount,
    neutralCount,
    thesis,
    actionPlan: {
      entry: actionPlan.entry as number | undefined,
      stopLoss: actionPlan.stop_loss as number | undefined,
      takeProfit: actionPlan.take_profit as number | undefined,
      positionPct: actionPlan.position_pct as number | undefined,
    },
    invalidation,
    keyDebates,
    dissent,
    summary: `${dirMap[verdict]} | 信心 ${(confidence * 100).toFixed(0)}% | 共识分 ${consensusScore.toFixed(2)}`,
  }
}

// ============================================================
// Phase 5: Store Records
// ============================================================

function storeAnalysisRecords(
  symbol: string,
  price: number,
  agentOutputs: Record<RoleType, AgentOutput>
): void {
  const now = new Date().toISOString()
  for (const output of Object.values(agentOutputs)) {
    const record: AnalysisRecord = {
      id: `${output.role}-${symbol}-${Date.now()}`,
      symbol,
      at: now,
      role: output.role,
      direction: output.direction,
      confidence: output.confidence,
      reasoning: output.reasoning.slice(0, 3).join('; '),
      outcome: 'pending',
      priceAtAnalysis: price,
    }
    saveRecord(record)
  }
}
