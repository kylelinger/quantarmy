import type { Skill, MarketSnapshot } from '../../types'
import { adx as calcAdx, atr as calcAtr } from '../../../analysis/indicators'

export const regimeDetectorSkill: Skill = {
  meta: {
    id: 'regime-detector',
    name: 'Regime Detector',
    version: '1.0.0',
    category: 'statistics',
    compatibleRoles: ['researcher', 'risk_officer'],
    description: '市场状态检测 (趋势/震荡/高波动)',
  },
  compute(snapshot: MarketSnapshot) {
    const closes = snapshot.klines_1d.map(k => k.close)
    const highs = snapshot.klines_1d.map(k => k.high)
    const lows = snapshot.klines_1d.map(k => k.low)

    if (closes.length < 30) {
      return { skillId: 'regime-detector', data: { regime: 'unknown' }, summary: '数据不足' }
    }

    const adxArr = calcAdx(highs, lows, closes, 14)
    const lastAdx = adxArr.filter(v => !isNaN(v)).pop() ?? 0

    const atrArr = calcAtr(highs, lows, closes, 14)
    const currentAtr = atrArr[atrArr.length - 1] || 0
    const historicalAtr = atrArr.slice(-90).filter(v => v > 0)
    const medianAtr = historicalAtr.length > 0
      ? historicalAtr.sort((a, b) => a - b)[Math.floor(historicalAtr.length / 2)]
      : currentAtr
    const atrRatio = medianAtr > 0 ? currentAtr / medianAtr : 1

    // Regime classification
    let regime: string
    let description: string
    let tradingAdvice: string

    if (lastAdx >= 30 && atrRatio < 1.5) {
      regime = 'strong_trend'
      description = '强趋势 (ADX高, 波动正常)'
      tradingAdvice = '顺势交易, 扩大仓位'
    } else if (lastAdx >= 25 && atrRatio >= 1.5) {
      regime = 'volatile_trend'
      description = '高波动趋势 (有方向但剧烈)'
      tradingAdvice = '顺势但缩小仓位, 加宽止损'
    } else if (lastAdx < 20 && atrRatio < 0.8) {
      regime = 'quiet_range'
      description = '低波动震荡 (窄幅盘整)'
      tradingAdvice = '等待突破, 减少交易'
    } else if (lastAdx < 20 && atrRatio >= 1.3) {
      regime = 'choppy'
      description = '高波动震荡 (无方向乱波动)'
      tradingAdvice = '避免交易, 极高假信号风险'
    } else {
      regime = 'transitional'
      description = '过渡状态 (方向不明)'
      tradingAdvice = '小仓位试探, 观察ADX方向'
    }

    return {
      skillId: 'regime-detector',
      data: {
        regime,
        adx: lastAdx,
        atr_ratio: atrRatio,
        description,
        trading_advice: tradingAdvice,
        allow_trend: lastAdx >= 22,
        allow_mean_reversion: lastAdx < 20 && atrRatio < 1.2,
      },
      summary: `${description} | ADX=${lastAdx.toFixed(0)} ATR比=${atrRatio.toFixed(1)} | ${tradingAdvice}`,
    }
  },
}
