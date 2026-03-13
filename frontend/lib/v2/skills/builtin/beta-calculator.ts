import type { Skill, MarketSnapshot } from '../../types'

export const betaCalculatorSkill: Skill = {
  meta: {
    id: 'beta-calculator',
    name: 'Beta Calculator',
    version: '1.0.0',
    category: 'statistics',
    compatibleRoles: ['researcher'],
    description: 'BTC Beta + 相关性分析 (仅加密货币)',
  },
  compute(snapshot: MarketSnapshot) {
    if (snapshot.market !== 'crypto' || !snapshot.btc_klines_1d || snapshot.symbol.startsWith('BTC')) {
      return { skillId: 'beta-calculator', data: { applicable: false }, summary: '不适用 (BTC本身或非加密标的)' }
    }

    const altCloses = snapshot.klines_1d.map(k => k.close)
    const btcCloses = snapshot.btc_klines_1d.map(k => k.close)
    const len = Math.min(altCloses.length, btcCloses.length)

    if (len < 30) {
      return { skillId: 'beta-calculator', data: { applicable: true }, summary: '数据不足(需30日)' }
    }

    const altReturns = altCloses.slice(1, len).map((c, i) => altCloses[i] > 0 ? (c - altCloses[i]) / altCloses[i] : 0)
    const btcReturns = btcCloses.slice(1, len).map((c, i) => btcCloses[i] > 0 ? (c - btcCloses[i]) / btcCloses[i] : 0)
    const n = Math.min(altReturns.length, btcReturns.length)

    const meanAlt = altReturns.slice(0, n).reduce((s, r) => s + r, 0) / n
    const meanBtc = btcReturns.slice(0, n).reduce((s, r) => s + r, 0) / n

    let cov = 0, varBtc = 0
    for (let i = 0; i < n; i++) {
      cov += (altReturns[i] - meanAlt) * (btcReturns[i] - meanBtc)
      varBtc += (btcReturns[i] - meanBtc) ** 2
    }
    cov /= n
    varBtc /= n

    const beta = varBtc > 0 ? cov / varBtc : 1
    const correlation = varBtc > 0
      ? cov / (Math.sqrt(varBtc) * Math.sqrt(altReturns.slice(0, n).reduce((s, r) => s + (r - meanAlt) ** 2, 0) / n))
      : 0

    const betaLabel = beta > 1.5 ? 'high_beta' : beta > 1 ? 'moderate_beta' : beta > 0.5 ? 'low_beta' : 'defensive'

    return {
      skillId: 'beta-calculator',
      data: {
        applicable: true,
        beta,
        correlation,
        beta_label: betaLabel,
        sample_days: n,
      },
      summary: `BTC Beta ${beta.toFixed(2)} | 相关性 ${correlation.toFixed(2)} | ${betaLabel === 'high_beta' ? '高Beta(波动放大)' : betaLabel === 'defensive' ? '防御型' : '中等Beta'}`,
    }
  },
}
