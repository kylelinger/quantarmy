/**
 * Agent Memory Store — localStorage persistence
 * 
 * Each agent remembers its past analyses per symbol.
 * Memory enables self-awareness: "I was right on BTC 68% of the time"
 */

import type { AnalysisRecord, AgentMemory, MetaMemoryStats, RoleType, Direction } from '../types'

const STORAGE_KEY = 'quantarmy_agent_memory'
const MAX_RECORDS_PER_AGENT = 200

// ============================================================
// Core Store
// ============================================================

function loadAll(): Record<RoleType, AnalysisRecord[]> {
  if (typeof window === 'undefined') {
    return {} as Record<RoleType, AnalysisRecord[]>
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {} as Record<RoleType, AnalysisRecord[]>
  } catch {
    return {} as Record<RoleType, AnalysisRecord[]>
  }
}

function saveAll(data: Record<string, AnalysisRecord[]>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage full — prune oldest
    pruneAll(data)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch { /* give up */ }
  }
}

function pruneAll(data: Record<string, AnalysisRecord[]>): void {
  for (const role of Object.keys(data)) {
    if (data[role].length > MAX_RECORDS_PER_AGENT) {
      data[role] = data[role].slice(0, MAX_RECORDS_PER_AGENT)
    }
  }
}

// ============================================================
// Public API
// ============================================================

/** Save an analysis record for a specific agent */
export function saveRecord(record: AnalysisRecord): void {
  const all = loadAll()
  if (!all[record.role]) {
    all[record.role] = []
  }
  // Prepend (newest first)
  all[record.role].unshift(record)
  // Prune
  if (all[record.role].length > MAX_RECORDS_PER_AGENT) {
    all[record.role] = all[record.role].slice(0, MAX_RECORDS_PER_AGENT)
  }
  saveAll(all)
}

/** Save multiple records at once (batch after full analysis) */
export function saveRecords(records: AnalysisRecord[]): void {
  const all = loadAll()
  for (const record of records) {
    if (!all[record.role]) {
      all[record.role] = []
    }
    all[record.role].unshift(record)
    if (all[record.role].length > MAX_RECORDS_PER_AGENT) {
      all[record.role] = all[record.role].slice(0, MAX_RECORDS_PER_AGENT)
    }
  }
  saveAll(all)
}

/** Get all records for a specific agent */
export function getAgentMemory(role: RoleType): AgentMemory {
  const all = loadAll()
  return {
    role,
    records: all[role] || [],
  }
}

/** Get records for a specific agent + symbol */
export function getSymbolMemory(role: RoleType, symbol: string): AnalysisRecord[] {
  const all = loadAll()
  return (all[role] || []).filter(r => r.symbol === symbol)
}

/** Get the most recent analysis for an agent + symbol */
export function getLastAnalysis(role: RoleType, symbol: string): AnalysisRecord | null {
  const records = getSymbolMemory(role, symbol)
  return records.length > 0 ? records[0] : null
}

/** Update outcome of a past analysis (called when we know if prediction was right) */
export function updateOutcome(
  recordId: string,
  outcome: 'correct' | 'incorrect',
  priceAfter24h: number
): void {
  const all = loadAll()
  for (const role of Object.keys(all) as RoleType[]) {
    const idx = all[role].findIndex(r => r.id === recordId)
    if (idx !== -1) {
      all[role][idx].outcome = outcome
      all[role][idx].priceAfter24h = priceAfter24h
      saveAll(all)
      return
    }
  }
}

// ============================================================
// Meta-Memory (computed from records)
// ============================================================

/** Compute self-awareness stats for an agent */
export function getMetaMemory(role: RoleType): MetaMemoryStats {
  const records = (loadAll()[role] || [])
  
  let correctCount = 0
  let incorrectCount = 0
  let pendingCount = 0
  const perSymbol: MetaMemoryStats['perSymbol'] = {}

  for (const r of records) {
    if (r.outcome === 'correct') correctCount++
    else if (r.outcome === 'incorrect') incorrectCount++
    else pendingCount++

    if (!perSymbol[r.symbol]) {
      perSymbol[r.symbol] = { total: 0, correct: 0, accuracy: 0, lastDirection: r.direction }
    }
    perSymbol[r.symbol].total++
    if (r.outcome === 'correct') perSymbol[r.symbol].correct++
  }

  // Compute per-symbol accuracy
  for (const sym of Object.keys(perSymbol)) {
    const s = perSymbol[sym]
    const decided = s.total - (records.filter(r => r.symbol === sym && !r.outcome).length)
    s.accuracy = decided > 0 ? s.correct / decided : 0
    // Last outcome
    const last = records.find(r => r.symbol === sym)
    if (last) {
      s.lastDirection = last.direction
      s.lastOutcome = last.outcome
    }
  }

  const decided = correctCount + incorrectCount
  return {
    role,
    totalAnalyses: records.length,
    correctCount,
    incorrectCount,
    pendingCount,
    accuracy: decided > 0 ? correctCount / decided : 0,
    perSymbol,
  }
}

/** Format memory context for an agent to "think about" during analysis */
export function getMemoryContext(role: RoleType, symbol: string): string {
  const meta = getMetaMemory(role)
  const symbolRecords = getSymbolMemory(role, symbol).slice(0, 5)

  const lines: string[] = []
  
  if (meta.totalAnalyses > 0) {
    lines.push(`历史分析 ${meta.totalAnalyses} 次, 准确率 ${(meta.accuracy * 100).toFixed(0)}%`)
  }

  const symStats = meta.perSymbol[symbol]
  if (symStats) {
    lines.push(`${symbol}: 分析 ${symStats.total} 次, 准确率 ${(symStats.accuracy * 100).toFixed(0)}%`)
    if (symStats.lastOutcome) {
      lines.push(`上次判断: ${symStats.lastDirection} → ${symStats.lastOutcome === 'correct' ? '✅正确' : '❌错误'}`)
    }
  }

  // Recent records
  for (const r of symbolRecords.slice(0, 3)) {
    const outcomeStr = r.outcome === 'correct' ? '✅' : r.outcome === 'incorrect' ? '❌' : '⏳'
    lines.push(`${r.at.slice(0,10)} ${r.direction} conf=${r.confidence.toFixed(2)} ${outcomeStr}`)
  }

  return lines.join('\n')
}

/** Clear all memory (for reset) */
export function clearAllMemory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}
