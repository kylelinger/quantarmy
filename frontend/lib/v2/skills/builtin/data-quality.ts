import type { Skill, MarketSnapshot } from '../../types'

export const dataQualitySkill: Skill = {
  meta: {
    id: 'data-quality',
    name: 'Data Quality Audit',
    version: '1.0.0',
    category: 'audit',
    compatibleRoles: ['cto'],
    description: '数据完整性 + 新鲜度审计',
  },
  compute(snapshot: MarketSnapshot) {
    const issues: string[] = []
    let score = 100

    // Check kline counts
    if (snapshot.klines_1h.length < 100) { issues.push(`1h K线仅${snapshot.klines_1h.length}根(需100+)`); score -= 15 }
    if (snapshot.klines_4h.length < 50) { issues.push(`4h K线仅${snapshot.klines_4h.length}根(需50+)`); score -= 10 }
    if (snapshot.klines_1d.length < 30) { issues.push(`日线仅${snapshot.klines_1d.length}根(需30+)`); score -= 10 }

    // Check data freshness
    const now = Date.now()
    const fetchedAt = new Date(snapshot.fetchedAt).getTime()
    const ageSeconds = (now - fetchedAt) / 1000
    if (ageSeconds > 300) { issues.push(`数据已过时 ${Math.floor(ageSeconds / 60)}分钟`); score -= 20 }

    // Check for depth data (crypto should have it)
    if (snapshot.market === 'crypto' && !snapshot.depth) {
      issues.push('缺少深度数据'); score -= 10
    }

    // Check for NaN/zero in recent klines
    const last10 = snapshot.klines_1h.slice(-10)
    const badKlines = last10.filter(k => k.close <= 0 || isNaN(k.close)).length
    if (badKlines > 0) { issues.push(`${badKlines}根K线数据异常(0/NaN)`); score -= 20 }

    // Check price sanity
    if (snapshot.quote.price <= 0) { issues.push('报价为0或负值'); score -= 30 }

    // Check trade data
    if (snapshot.market === 'crypto' && snapshot.recentTrades.length === 0) {
      issues.push('无最近成交数据'); score -= 5
    }

    score = Math.max(0, score)
    const status = score >= 80 ? 'good' : score >= 50 ? 'degraded' : 'poor'

    return {
      skillId: 'data-quality',
      data: {
        score,
        status,
        issues,
        klines_1h_count: snapshot.klines_1h.length,
        klines_4h_count: snapshot.klines_4h.length,
        klines_1d_count: snapshot.klines_1d.length,
        has_depth: !!snapshot.depth,
        has_trades: snapshot.recentTrades.length > 0,
        data_age_seconds: ageSeconds,
      },
      summary: `数据质量 ${score}/100 (${status})${issues.length > 0 ? ` | ⚠️ ${issues.join('; ')}` : ' | ✅ 完好'}`,
    }
  },
}
