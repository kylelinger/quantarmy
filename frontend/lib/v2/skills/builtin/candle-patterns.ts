import type { Skill, MarketSnapshot } from '../../types'

export const candlePatternsSkill: Skill = {
  meta: {
    id: 'candle-patterns',
    name: 'Candlestick Patterns',
    version: '1.0.0',
    category: 'signal',
    compatibleRoles: ['analyst'],
    description: 'K线形态识别 (锤子线/十字星/吞没等)',
  },
  compute(snapshot: MarketSnapshot) {
    const klines = snapshot.klines_4h.slice(-10)
    if (klines.length < 3) {
      return { skillId: 'candle-patterns', data: { patterns: [] }, summary: '数据不足' }
    }

    const patterns: string[] = []
    const last = klines[klines.length - 1]
    const prev = klines[klines.length - 2]
    const body = Math.abs(last.close - last.open)
    const range = last.high - last.low
    const upperWick = last.high - Math.max(last.close, last.open)
    const lowerWick = Math.min(last.close, last.open) - last.low
    const isBull = last.close > last.open
    const prevBody = Math.abs(prev.close - prev.open)

    // Doji (very small body)
    if (range > 0 && body / range < 0.1) {
      patterns.push('十字星 (犹豫不决)')
    }

    // Hammer / Hanging Man
    if (lowerWick > body * 2 && upperWick < body * 0.5 && range > 0) {
      if (prev.close < prev.open) patterns.push('锤子线 (潜在反转看多)')
      else patterns.push('上吊线 (潜在反转看空)')
    }

    // Shooting Star / Inverted Hammer
    if (upperWick > body * 2 && lowerWick < body * 0.5 && range > 0) {
      if (prev.close > prev.open) patterns.push('射击之星 (潜在反转看空)')
      else patterns.push('倒锤子 (潜在反转看多)')
    }

    // Bullish Engulfing
    if (isBull && !prevBull(prev) && body > prevBody * 1.2 && last.close > prev.open && last.open < prev.close) {
      patterns.push('看多吞没 (强势反转)')
    }

    // Bearish Engulfing
    if (!isBull && prevBull(prev) && body > prevBody * 1.2 && last.open > prev.close && last.close < prev.open) {
      patterns.push('看空吞没 (弱势反转)')
    }

    // Large body candle
    if (body / range > 0.7 && range > 0) {
      patterns.push(isBull ? '大阳线 (强势)' : '大阴线 (弱势)')
    }

    const bias = patterns.some(p => p.includes('看多') || p.includes('阳线') || p.includes('锤子'))
      ? 'bullish'
      : patterns.some(p => p.includes('看空') || p.includes('阴线') || p.includes('射击') || p.includes('上吊'))
        ? 'bearish'
        : 'neutral'

    return {
      skillId: 'candle-patterns',
      data: {
        patterns,
        pattern_count: patterns.length,
        bias,
        last_candle: isBull ? 'bullish' : 'bearish',
        body_ratio: range > 0 ? body / range : 0,
      },
      summary: patterns.length > 0 ? patterns.join(' | ') : '无显著K线形态',
    }
  },
}

function prevBull(k: { open: number; close: number }): boolean {
  return k.close > k.open
}
