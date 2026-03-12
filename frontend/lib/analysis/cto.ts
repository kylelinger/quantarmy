import type { CTOOutput, RoleOutput } from './types'

export function analyzeCTO(
  symbol: string,
  roleOutputs: Partial<Record<string, RoleOutput>>,
): CTOOutput {
  const now = new Date().toISOString()
  const nowMs = Date.now()

  const allRoles = ['collector', 'strategist', 'risk_officer', 'analyst', 'researcher', 'executor']
  const freshness: Record<string, number> = {}
  let completedCount = 0
  const anomalies: string[] = []

  for (const role of allRoles) {
    const output = roleOutputs[role]
    if (output && output.at) {
      const age = (nowMs - new Date(output.at).getTime()) / 1000
      freshness[role] = age
      completedCount++
      if (age > 300) anomalies.push(`${role} 数据已过时 (${Math.round(age / 60)}min前)`)
    } else {
      freshness[role] = -1 // missing
    }
  }

  const completeness = completedCount / allRoles.length

  if (completeness < 0.5) anomalies.push('超过半数角色未返回数据')

  // Check for contradictions
  const strategist = roleOutputs.strategist as any
  const analyst = roleOutputs.analyst as any
  if (strategist && analyst) {
    const sigBull = strategist.signal === 'LONG'
    const trendBull = analyst.trend === 'strong_up' || analyst.trend === 'up'
    if (sigBull !== trendBull) {
      anomalies.push('策略师与分析师方向不一致')
    }
  }

  const parts: string[] = []
  parts.push(`完整度 ${completedCount}/${allRoles.length}`)
  if (anomalies.length === 0) parts.push('系统正常 ✅')
  else parts.push(`⚠️ ${anomalies.length} 个异常`)

  return {
    role: 'cto', symbol, at: now,
    data_freshness: freshness,
    completeness,
    anomalies,
    summary: parts.join(' | '),
  }
}
