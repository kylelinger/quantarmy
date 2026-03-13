/**
 * V2 Analysis Result Cache — localStorage-backed
 *
 * Stores a lightweight summary of V2 results so the overview page
 * can display team verdicts without re-running analysis.
 */

import type { V2AnalysisResult, Direction, RoleType, DebateStance } from './types'

const CACHE_PREFIX = 'quantarmy_v2_cache_'
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24h — stale after this

// ============================================================
// Cached summary shape (lightweight — NOT the full result)
// ============================================================

export interface V2CachedSummary {
  symbol: string
  at: string                      // ISO timestamp
  verdict: Direction
  confidence: number              // 0-1
  consensusScore: number          // -1 to +1
  bullishCount: number
  bearishCount: number
  neutralCount: number
  thesis: string
  entry?: number
  stopLoss?: number
  takeProfit?: number
  totalMs?: number
  roles: {
    role: RoleType
    direction: Direction
    stance: DebateStance
    confidence: number
    revised: boolean
  }[]
}

// ============================================================
// Write
// ============================================================

export function saveV2Result(result: V2AnalysisResult): void {
  if (typeof window === 'undefined') return
  if (!result.decision || !result.agentOutputs) return

  const d = result.decision
  const roles: V2CachedSummary['roles'] = []

  for (const [role, output] of Object.entries(result.agentOutputs)) {
    if (role === 'ceo') continue
    roles.push({
      role: role as RoleType,
      direction: output.direction,
      stance: output.stance,
      confidence: output.confidence,
      revised: output.revised,
    })
  }

  const summary: V2CachedSummary = {
    symbol: result.symbol,
    at: result.at,
    verdict: d.verdict,
    confidence: d.confidence,
    consensusScore: d.consensusScore,
    bullishCount: d.bullishCount,
    bearishCount: d.bearishCount,
    neutralCount: d.neutralCount,
    thesis: d.thesis,
    entry: d.actionPlan.entry,
    stopLoss: d.actionPlan.stopLoss,
    takeProfit: d.actionPlan.takeProfit,
    totalMs: result.timing.totalMs,
    roles,
  }

  try {
    localStorage.setItem(CACHE_PREFIX + result.symbol, JSON.stringify(summary))
  } catch {
    // localStorage full — silently fail
  }
}

// ============================================================
// Read
// ============================================================

export function getV2Result(symbol: string): V2CachedSummary | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(CACHE_PREFIX + symbol)
    if (!raw) return null
    const summary: V2CachedSummary = JSON.parse(raw)

    // Check staleness
    const age = Date.now() - new Date(summary.at).getTime()
    if (age > MAX_AGE_MS) {
      localStorage.removeItem(CACHE_PREFIX + symbol)
      return null
    }

    return summary
  } catch {
    return null
  }
}

// ============================================================
// List all cached symbols
// ============================================================

export function listCachedResults(): V2CachedSummary[] {
  if (typeof window === 'undefined') return []

  const results: V2CachedSummary[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(CACHE_PREFIX)) continue

      const raw = localStorage.getItem(key)
      if (!raw) continue

      try {
        const summary: V2CachedSummary = JSON.parse(raw)
        const age = Date.now() - new Date(summary.at).getTime()
        if (age <= MAX_AGE_MS) {
          results.push(summary)
        } else {
          localStorage.removeItem(key)
        }
      } catch {
        // corrupted entry — remove
        localStorage.removeItem(key!)
      }
    }
  } catch {
    // no localStorage access
  }

  // Sort by newest first
  return results.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

// ============================================================
// Clear
// ============================================================

export function clearV2Cache(): void {
  if (typeof window === 'undefined') return
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(CACHE_PREFIX)) keysToRemove.push(key)
  }
  keysToRemove.forEach(k => localStorage.removeItem(k))
}
