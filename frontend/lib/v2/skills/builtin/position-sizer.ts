import type { Skill, MarketSnapshot } from '../../types'
import { atr as calcAtr } from '../../../analysis/indicators'

export const positionSizerSkill: Skill = {
  meta: {
    id: 'position-sizer',
    name: 'Position Sizer',
    version: '1.0.0',
    category: 'risk',
    compatibleRoles: ['risk_officer'],
    description: 'ATR-based 仓位计算 + SL/TP建议',
  },
  compute(snapshot: MarketSnapshot) {
    const closes = snapshot.klines_1h.map(k => k.close)
    const highs = snapshot.klines_1h.map(k => k.high)
    const lows = snapshot.klines_1h.map(k => k.low)
    const price = closes[closes.length - 1] || 0

    if (closes.length < 20 || price === 0) {
      return { skillId: 'position-sizer', data: {}, summary: '数据不足' }
    }

    const atrArr = calcAtr(highs, lows, closes, 14)
    const atr = atrArr[atrArr.length - 1] || 0
    const atrPct = atr / price * 100

    // SL = 2.5x ATR, TP = 4x ATR (from AItrading production config)
    const slDistance = atr * 2.5
    const tpDistance = atr * 4.0
    const slLong = price - slDistance
    const tpLong = price + tpDistance
    const slShort = price + slDistance
    const tpShort = price - tpDistance

    // Position size: risk 1% of portfolio per trade
    const riskPct = 1.0 // 1% risk per trade
    const positionPct = atrPct > 0 ? Math.min(30, riskPct / (atrPct * 2.5) * 100) : 10
    const rr = tpDistance / slDistance // reward:risk ratio

    return {
      skillId: 'position-sizer',
      data: {
        atr,
        atr_pct: atrPct,
        sl_long: slLong,
        tp_long: tpLong,
        sl_short: slShort,
        tp_short: tpShort,
        sl_distance_pct: (slDistance / price * 100),
        tp_distance_pct: (tpDistance / price * 100),
        position_pct: positionPct,
        reward_risk: rr,
        risk_per_trade_pct: riskPct,
      },
      summary: `仓位 ${positionPct.toFixed(1)}% | SL ${(slDistance / price * 100).toFixed(1)}% | TP ${(tpDistance / price * 100).toFixed(1)}% | RR ${rr.toFixed(1)}`,
    }
  },
}
