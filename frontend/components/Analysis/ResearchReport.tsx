'use client'

import { cn } from '@/lib/utils'
import type { V2AnalysisResult, CEODecision, AgentOutput, RoleType } from '@/lib/v2/types'

interface ResearchReportProps {
  result: V2AnalysisResult
}

const ROLE_NAMES: Record<RoleType, string> = {
  collector: '数据采集员',
  strategist: '趋势策略师',
  risk_officer: '风险控制官',
  analyst: '技术分析师',
  researcher: '市场研究员',
  executor: '执行交易员',
  cto: '技术总监',
  ceo: 'CEO',
}

export function ResearchReport({ result }: ResearchReportProps) {
  const { decision, agentOutputs, debate } = result

  if (!decision || !agentOutputs) {
    return (
      <div className="text-center py-8 text-dark-500">
        数据不完整，无法生成研报
      </div>
    )
  }

  const riskReward = calculateRiskReward(decision)
  const agents = Object.values(agentOutputs).filter(a => a.role !== 'ceo')

  return (
    <div className="space-y-6">
      {/* 报告头部 */}
      <div className="bg-gradient-to-br from-dark-900 to-dark-850 rounded-xl border border-dark-800 p-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-dark-100 mb-2">
              {result.symbol}
            </h2>
            <p className="text-dark-500 text-sm">
              分析时间: {new Date(result.at).toLocaleString('zh-CN')}
            </p>
          </div>
          <div className="text-right">
            <div className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-2xl',
              decision.verdict === 'LONG' && 'bg-army-900/50 text-army-400 border-2 border-army-600',
              decision.verdict === 'SHORT' && 'bg-red-900/50 text-red-400 border-2 border-red-600',
              decision.verdict === 'WAIT' && 'bg-yellow-900/50 text-yellow-400 border-2 border-yellow-600',
              decision.verdict === 'HOLD' && 'bg-blue-900/50 text-blue-400 border-2 border-blue-600'
            )}>
              {getVerdictEmoji(decision.verdict)}
              <span>{decision.verdict}</span>
            </div>
          </div>
        </div>

        {/* 信心条 */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-dark-400 text-sm">决策信心</span>
            <span className="text-dark-200 font-bold">{(decision.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                decision.confidence > 0.7 ? 'bg-army-500' :
                decision.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${decision.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 综合评分 */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>综合评分</span>
        </h3>
        <div className="grid grid-cols-2 gap-6">
          {/* Consensus Score Gauge */}
          <div>
            <p className="text-dark-400 text-sm mb-3">团队共识度</p>
            <div className="relative w-40 h-40 mx-auto">
              <svg className="transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-dark-800"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className={cn(
                    decision.consensusScore > 0.5 ? 'text-army-500' :
                    decision.consensusScore < -0.5 ? 'text-red-500' : 'text-yellow-500'
                  )}
                  strokeDasharray={`${Math.abs(decision.consensusScore) * 314} 314`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-dark-100">
                  {decision.consensusScore.toFixed(2)}
                </span>
                <span className="text-xs text-dark-500">共识分</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatBox label="看多" value={decision.bullishCount} color="text-army-400" />
            <StatBox label="看空" value={decision.bearishCount} color="text-red-400" />
            <StatBox label="中性" value={decision.neutralCount} color="text-yellow-400" />
            <StatBox label="辩论" value={debate?.totalChallenges || 0} color="text-blue-400" />
          </div>
        </div>
      </div>

      {/* 多空分布 */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <span>📈</span>
          <span>多空分布</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-8 bg-dark-800 rounded-lg overflow-hidden flex">
              <div
                className="bg-army-500 flex items-center justify-center text-white text-sm font-medium"
                style={{ width: `${(decision.bullishCount / 7) * 100}%` }}
              >
                {decision.bullishCount > 0 && `${decision.bullishCount}`}
              </div>
              <div
                className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
                style={{ width: `${(decision.bearishCount / 7) * 100}%` }}
              >
                {decision.bearishCount > 0 && `${decision.bearishCount}`}
              </div>
              <div
                className="bg-yellow-500 flex items-center justify-center text-white text-sm font-medium"
                style={{ width: `${(decision.neutralCount / 7) * 100}%` }}
              >
                {decision.neutralCount > 0 && `${decision.neutralCount}`}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-dark-400">
            <span>🟢 看多 {decision.bullishCount}人 ({((decision.bullishCount/7)*100).toFixed(0)}%)</span>
            <span>🔴 看空 {decision.bearishCount}人 ({((decision.bearishCount/7)*100).toFixed(0)}%)</span>
            <span>🟡 中性 {decision.neutralCount}人 ({((decision.neutralCount/7)*100).toFixed(0)}%)</span>
          </div>
        </div>
      </div>

      {/* 操作建议 */}
      {decision.actionPlan.entry && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
          <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <span>💡</span>
            <span>操作建议</span>
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-dark-850 rounded-lg p-4 border border-dark-800">
              <p className="text-dark-500 text-xs mb-1">建议入场</p>
              <p className="text-dark-100 text-xl font-bold">
                ${decision.actionPlan.entry.toFixed(2)}
              </p>
            </div>
            {decision.actionPlan.stopLoss && (
              <div className="bg-dark-850 rounded-lg p-4 border border-red-900/30">
                <p className="text-dark-500 text-xs mb-1">止损价位</p>
                <p className="text-red-400 text-xl font-bold">
                  ${decision.actionPlan.stopLoss.toFixed(2)}
                </p>
              </div>
            )}
            {decision.actionPlan.takeProfit && (
              <div className="bg-dark-850 rounded-lg p-4 border border-army-900/30">
                <p className="text-dark-500 text-xs mb-1">止盈目标</p>
                <p className="text-army-400 text-xl font-bold">
                  ${decision.actionPlan.takeProfit.toFixed(2)}
                </p>
              </div>
            )}
          </div>
          {riskReward && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span className="text-dark-400">风险收益比:</span>
              <span className={cn(
                'font-medium',
                riskReward > 2 ? 'text-army-400' :
                riskReward > 1 ? 'text-yellow-400' : 'text-red-400'
              )}>
                1 : {riskReward.toFixed(2)}
              </span>
              {decision.actionPlan.positionPct && (
                <>
                  <span className="text-dark-600">|</span>
                  <span className="text-dark-400">建议仓位:</span>
                  <span className="text-dark-200 font-medium">
                    {(decision.actionPlan.positionPct * 100).toFixed(0)}%
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 关键辩论 */}
      {(decision.keyDebates.length > 0 || decision.dissent.length > 0) && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
          <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <span>⚔️</span>
            <span>关键辩论</span>
          </h3>
          <div className="space-y-3">
            {decision.keyDebates.map((debate, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-blue-400 flex-shrink-0">▸</span>
                <p className="text-dark-300">{debate}</p>
              </div>
            ))}
            {decision.dissent.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dark-800">
                <p className="text-yellow-400 text-xs font-medium mb-2">⚠️ 少数派异议</p>
                {decision.dissent.map((d, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-yellow-400/70 flex-shrink-0">!</span>
                    <p className="text-yellow-400/90">{d}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 风险提示 */}
      {decision.invalidation.length > 0 && (
        <div className="bg-red-900/10 rounded-xl border border-red-900/30 p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <span>⚠️</span>
            <span>风险提示</span>
          </h3>
          <div className="space-y-2">
            {decision.invalidation.map((cond, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-red-400 flex-shrink-0">❌</span>
                <p className="text-red-300">{cond}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 各角色摘要 */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <span>👥</span>
          <span>各角色观点</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-800">
                <th className="text-left py-3 px-2 text-dark-400 font-medium">角色</th>
                <th className="text-left py-3 px-2 text-dark-400 font-medium">观点</th>
                <th className="text-left py-3 px-2 text-dark-400 font-medium">方向</th>
                <th className="text-left py-3 px-2 text-dark-400 font-medium">信心</th>
                <th className="text-left py-3 px-2 text-dark-400 font-medium">修正</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => (
                <tr key={agent.role} className="border-b border-dark-800/50">
                  <td className="py-3 px-2 text-dark-200 font-medium">
                    {ROLE_NAMES[agent.role]}
                  </td>
                  <td className="py-3 px-2 text-dark-300 max-w-xs truncate">
                    {agent.summary}
                  </td>
                  <td className="py-3 px-2">
                    <span className={cn(
                      'font-medium',
                      agent.direction === 'LONG' && 'text-army-400',
                      agent.direction === 'SHORT' && 'text-red-400',
                      agent.direction === 'WAIT' && 'text-yellow-400',
                      agent.direction === 'HOLD' && 'text-blue-400'
                    )}>
                      {agent.direction}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-dark-300">
                    {(agent.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-2">
                    {agent.revised ? (
                      <span className="text-yellow-400 text-xs">✓ 已修正</span>
                    ) : (
                      <span className="text-dark-600 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 报告尾部 */}
      <div className="text-center text-dark-600 text-xs pt-4 border-t border-dark-800">
        <p>本报告由 QuantArmy V2 团队分析引擎生成</p>
        <p className="mt-1">分析耗时 {result.timing?.totalMs || 0}ms · 更新于 {new Date(result.at).toLocaleString('zh-CN')}</p>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-dark-850 rounded-lg p-3 border border-dark-800">
      <p className="text-dark-500 text-xs mb-1">{label}</p>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
    </div>
  )
}

function getVerdictEmoji(verdict: string) {
  const map: Record<string, string> = {
    LONG: '🟢',
    SHORT: '🔴',
    WAIT: '🟡',
    HOLD: '🔵',
  }
  return map[verdict] || '⚪'
}

function calculateRiskReward(decision: CEODecision): number | null {
  const { entry, stopLoss, takeProfit } = decision.actionPlan
  if (!entry || !stopLoss || !takeProfit) return null
  
  const risk = Math.abs(entry - stopLoss)
  const reward = Math.abs(takeProfit - entry)
  
  return risk > 0 ? reward / risk : null
}
