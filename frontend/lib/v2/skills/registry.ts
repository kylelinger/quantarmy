/**
 * Skill Registry — all 24 built-in skills
 */

import type { Skill } from '../types'

// Strategy skills
import { psarTrendSkill } from './builtin/psar-trend'
import { emaCrossoverSkill } from './builtin/ema-crossover'
import { macdDivergenceSkill } from './builtin/macd-divergence'

// Risk skills
import { volatilityModelSkill } from './builtin/volatility-model'
import { positionSizerSkill } from './builtin/position-sizer'
import { drawdownMonitorSkill } from './builtin/drawdown-monitor'

// Data skills
import { marketDataCollectorSkill } from './builtin/market-data-collector'
import { newsAnalyzerSkill } from './builtin/news-analyzer'
import { orderFlowSkill } from './builtin/order-flow'

// Signal/Analysis skills
import { multiTimeframeSkill } from './builtin/multi-timeframe'
import { supportResistanceSkill } from './builtin/support-resistance'
import { candlePatternsSkill } from './builtin/candle-patterns'

// Statistics skills
import { statAnalyzerSkill } from './builtin/stat-analyzer'
import { betaCalculatorSkill } from './builtin/beta-calculator'
import { regimeDetectorSkill } from './builtin/regime-detector'

// Execution skills
import { liquidityScorerSkill } from './builtin/liquidity-scorer'
import { slippageEstimatorSkill } from './builtin/slippage-estimator'
import { entryOptimizerSkill } from './builtin/entry-optimizer'

// Audit skills
import { dataQualitySkill } from './builtin/data-quality'
import { anomalyDetectorSkill } from './builtin/anomaly-detector'
import { consistencyCheckerSkill } from './builtin/consistency-checker'

// Decision skills (CEO)
import { consensusAggregatorSkill } from './builtin/consensus-aggregator'
import { actionPlanSkill } from './builtin/action-plan'
import { invalidationTrackerSkill } from './builtin/invalidation-tracker'

// ============================================================
// Registry
// ============================================================

const ALL_SKILLS: Skill[] = [
  // Strategy (Strategist)
  psarTrendSkill,
  emaCrossoverSkill,
  macdDivergenceSkill,
  // Risk (Risk Officer)
  volatilityModelSkill,
  positionSizerSkill,
  drawdownMonitorSkill,
  // Data (Collector)
  marketDataCollectorSkill,
  newsAnalyzerSkill,
  orderFlowSkill,
  // Analysis (Analyst)
  multiTimeframeSkill,
  supportResistanceSkill,
  candlePatternsSkill,
  // Statistics (Researcher)
  statAnalyzerSkill,
  betaCalculatorSkill,
  regimeDetectorSkill,
  // Execution (Executor)
  liquidityScorerSkill,
  slippageEstimatorSkill,
  entryOptimizerSkill,
  // Audit (CTO)
  dataQualitySkill,
  anomalyDetectorSkill,
  consistencyCheckerSkill,
  // Decision (CEO)
  consensusAggregatorSkill,
  actionPlanSkill,
  invalidationTrackerSkill,
]

const REGISTRY = new Map<string, Skill>(ALL_SKILLS.map(s => [s.meta.id, s]))

export function getSkill(id: string): Skill | undefined {
  return REGISTRY.get(id)
}

export function getAllSkills(): Skill[] {
  return ALL_SKILLS
}

export function getSkillsByRole(role: string): Skill[] {
  return ALL_SKILLS.filter(s => s.meta.compatibleRoles.includes(role as never))
}

export function getSkillsByCategory(category: string): Skill[] {
  return ALL_SKILLS.filter(s => s.meta.category === category)
}

export { ALL_SKILLS }
