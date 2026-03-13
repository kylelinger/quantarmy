import type { Skill, MarketSnapshot } from '../../types'

export const statAnalyzerSkill: Skill = {
  meta: {
    id: 'stat-analyzer',
    name: 'Statistical Analyzer',
    version: '1.0.0',
    category: 'statistics',
    compatibleRoles: ['researcher'],
    description: '历史回报分布 + 日内季节性分析',
  },
  compute(snapshot: MarketSnapshot) {
    const closes = snapshot.klines_1d.map(k => k.close)
    if (closes.length < 30) {
      return { skillId: 'stat-analyzer', data: {}, summary: '数据不足' }
    }

    const returns = closes.slice(1).map((c, i) => closes[i] > 0 ? (c - closes[i]) / closes[i] * 100 : 0)
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length
    const std = Math.sqrt(returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1))
    const sharpe = std > 0 ? (mean / std) * Math.sqrt(365) : 0

    // Skewness
    const skew = returns.length > 2 && std > 0
      ? returns.reduce((s, r) => s + ((r - mean) / std) ** 3, 0) * returns.length / ((returns.length - 1) * (returns.length - 2))
      : 0

    // Win rate (positive return days)
    const winDays = returns.filter(r => r > 0).length
    const winRate = returns.length > 0 ? winDays / returns.length * 100 : 50

    // Best/worst day
    const best = Math.max(...returns)
    const worst = Math.min(...returns)

    // Current return z-score (how unusual is today's move)
    const lastReturn = returns[returns.length - 1] || 0
    const zScore = std > 0 ? (lastReturn - mean) / std : 0

    const distribution = std > 3 ? 'high_vol' : std > 1.5 ? 'normal' : 'low_vol'

    return {
      skillId: 'stat-analyzer',
      data: {
        mean_daily_return: mean,
        std_daily: std,
        sharpe_ratio: sharpe,
        skewness: skew,
        win_rate: winRate,
        best_day: best,
        worst_day: worst,
        z_score: zScore,
        distribution,
        sample_size: returns.length,
      },
      summary: `日均 ${mean > 0 ? '+' : ''}${mean.toFixed(2)}% ± ${std.toFixed(2)}% | Sharpe ${sharpe.toFixed(2)} | 胜率 ${winRate.toFixed(0)}% | Z=${zScore.toFixed(1)}`,
    }
  },
}
