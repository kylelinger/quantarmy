/**
 * Full Analysis Orchestrator
 * Fetches market data → runs 8 role engines → returns FullAnalysis
 */

import { fetchQuote, fetchKlines, fetchDepth, fetchRecentTrades, detectMarket, type MarketType } from '../market-adapter'
import { analyzeCollector } from './collector'
import { analyzeStrategist } from './strategist'
import { analyzeRiskOfficer } from './risk-officer'
import { analyzeAnalyst } from './analyst'
import { analyzeResearcher } from './researcher'
import { analyzeExecutor } from './executor'
import { analyzeCTO } from './cto'
import { analyzeCEO } from './ceo'
import type { FullAnalysis, AnalysisInput, RoleOutput } from './types'

export type { FullAnalysis, RoleOutput }
export type { CollectorOutput, StrategistOutput, RiskOfficerOutput, AnalystOutput, ResearcherOutput, ExecutorOutput, CTOOutput, CEOOutput } from './types'

export async function runFullAnalysis(symbol: string): Promise<FullAnalysis> {
  const market = detectMarket(symbol)
  const now = new Date().toISOString()

  // Fetch all data in parallel
  const [quote, klines1h, klines4h, klines1d, depth, recentTrades] = await Promise.all([
    fetchQuote(symbol),
    fetchKlines(symbol, '1h', 200),
    fetchKlines(symbol, '4h', 200),
    fetchKlines(symbol, '1d', 365),
    fetchDepth(symbol, 20).catch(() => null),
    fetchRecentTrades(symbol, 100).catch(() => []),
  ])

  // Fetch BTC daily klines for beta calc (if alt crypto)
  let btcKlines1d = undefined
  if (market === 'crypto' && !symbol.startsWith('BTC')) {
    try {
      btcKlines1d = await fetchKlines('BTCUSDT', '1d', 365)
    } catch { /* ignore */ }
  }

  const input: AnalysisInput = {
    symbol, market, quote,
    klines_1h: klines1h,
    klines_4h: klines4h,
    klines_1d: klines1d,
    depth,
    recentTrades,
    btc_klines_1d: btcKlines1d,
  }

  // Run all role analyses
  const collector = analyzeCollector(input)
  const strategist = analyzeStrategist(input)
  const riskOfficer = analyzeRiskOfficer(input)
  const analyst = analyzeAnalyst(input)
  const researcher = analyzeResearcher(input)
  const executor = analyzeExecutor(input)

  // CTO checks other roles' metadata
  const roleOutputs: Partial<Record<string, RoleOutput>> = {
    collector, strategist, risk_officer: riskOfficer, analyst, researcher, executor,
  }
  const cto = analyzeCTO(symbol, roleOutputs)

  // CEO aggregates all
  const ceo = analyzeCEO(symbol, {
    collector, strategist, risk_officer: riskOfficer,
    analyst, researcher, executor, cto,
  })

  return {
    symbol, market, at: now,
    collector, strategist, risk_officer: riskOfficer,
    analyst, researcher, executor, cto, ceo,
  }
}
