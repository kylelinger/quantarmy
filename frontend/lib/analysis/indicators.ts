/**
 * Technical Indicators Library — pure functions, no dependencies.
 * All operate on number arrays (typically close prices).
 */

// --- Simple Moving Average ---
export function sma(data: number[], period: number): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(NaN); continue }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += data[j]
    result.push(sum / period)
  }
  return result
}

// --- Exponential Moving Average ---
export function ema(data: number[], period: number): number[] {
  const result: number[] = []
  const k = 2 / (period + 1)
  for (let i = 0; i < data.length; i++) {
    if (i === 0) { result.push(data[0]); continue }
    if (i < period - 1) {
      // Use SMA seed
      let sum = 0
      for (let j = 0; j <= i; j++) sum += data[j]
      result.push(sum / (i + 1))
      continue
    }
    if (i === period - 1) {
      let sum = 0
      for (let j = 0; j < period; j++) sum += data[j]
      result.push(sum / period)
      continue
    }
    result.push(data[i] * k + result[i - 1] * (1 - k))
  }
  return result
}

// --- RSI ---
export function rsi(closes: number[], period: number = 14): number[] {
  const result: number[] = new Array(closes.length).fill(NaN)
  if (closes.length < period + 1) return result

  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const delta = closes[i] - closes[i - 1]
    if (delta > 0) avgGain += delta; else avgLoss += Math.abs(delta)
  }
  avgGain /= period
  avgLoss /= period

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  for (let i = period + 1; i < closes.length; i++) {
    const delta = closes[i] - closes[i - 1]
    const gain = delta > 0 ? delta : 0
    const loss = delta < 0 ? Math.abs(delta) : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return result
}

// --- MACD ---
export function macd(closes: number[], fast = 12, slow = 26, signal = 9): {
  macd: number[]; signal: number[]; histogram: number[]
} {
  const emaFast = ema(closes, fast)
  const emaSlow = ema(closes, slow)
  const macdLine = emaFast.map((f, i) => f - emaSlow[i])
  const signalLine = ema(macdLine.map(v => isNaN(v) ? 0 : v), signal)
  const histogram = macdLine.map((m, i) => m - signalLine[i])
  return { macd: macdLine, signal: signalLine, histogram }
}

// --- ATR (Average True Range) ---
export function atr(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
  const result: number[] = new Array(closes.length).fill(NaN)
  const tr: number[] = []

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) { tr.push(highs[0] - lows[0]); continue }
    tr.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ))
  }

  // First ATR = SMA of TR
  if (tr.length >= period) {
    let sum = 0
    for (let i = 0; i < period; i++) sum += tr[i]
    result[period - 1] = sum / period
    for (let i = period; i < tr.length; i++) {
      result[i] = (result[i - 1] * (period - 1) + tr[i]) / period
    }
  }
  return result
}

// --- ADX ---
export function adx(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
  const len = closes.length
  const result: number[] = new Array(len).fill(NaN)
  if (len < period * 2) return result

  const tr: number[] = [highs[0] - lows[0]]
  const plusDM: number[] = [0]
  const minusDM: number[] = [0]

  for (let i = 1; i < len; i++) {
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1])))
    const up = highs[i] - highs[i-1]
    const down = lows[i-1] - lows[i]
    plusDM.push(up > down && up > 0 ? up : 0)
    minusDM.push(down > up && down > 0 ? down : 0)
  }

  // Smoothed with Wilder's method
  let atr14 = 0, plusDI14 = 0, minusDI14 = 0
  for (let i = 0; i < period; i++) { atr14 += tr[i]; plusDI14 += plusDM[i]; minusDI14 += minusDM[i] }

  const dx: number[] = []
  for (let i = period; i < len; i++) {
    if (i === period) {
      // first smoothed value
    } else {
      atr14 = atr14 - atr14 / period + tr[i]
      plusDI14 = plusDI14 - plusDI14 / period + plusDM[i]
      minusDI14 = minusDI14 - minusDI14 / period + minusDM[i]
    }
    const pdi = atr14 > 0 ? (plusDI14 / atr14) * 100 : 0
    const mdi = atr14 > 0 ? (minusDI14 / atr14) * 100 : 0
    const sum = pdi + mdi
    dx.push(sum > 0 ? Math.abs(pdi - mdi) / sum * 100 : 0)
  }

  // ADX = EMA of DX
  if (dx.length >= period) {
    let adxVal = 0
    for (let i = 0; i < period; i++) adxVal += dx[i]
    adxVal /= period
    result[period * 2 - 1] = adxVal
    for (let i = period; i < dx.length; i++) {
      adxVal = (adxVal * (period - 1) + dx[i]) / period
      result[period + i] = adxVal
    }
  }
  return result
}

// --- Parabolic SAR ---
export function psar(
  highs: number[], lows: number[], closes: number[],
  afStart = 0.01, afStep = 0.01, afMax = 0.10
): { sar: number[]; direction: ('bull' | 'bear')[] } {
  const len = highs.length
  const sar: number[] = new Array(len).fill(0)
  const dir: ('bull' | 'bear')[] = new Array(len).fill('bull')

  if (len < 2) return { sar, direction: dir }

  let isLong = closes[1] > closes[0]
  let af = afStart
  let ep = isLong ? highs[0] : lows[0]
  sar[0] = isLong ? lows[0] : highs[0]

  for (let i = 1; i < len; i++) {
    let prevSar = sar[i - 1]
    let newSar = prevSar + af * (ep - prevSar)

    if (isLong) {
      newSar = Math.min(newSar, lows[i - 1], i >= 2 ? lows[i - 2] : lows[i - 1])
      if (lows[i] < newSar) {
        // Flip to bear
        isLong = false
        newSar = ep
        ep = lows[i]
        af = afStart
      } else {
        if (highs[i] > ep) { ep = highs[i]; af = Math.min(af + afStep, afMax) }
      }
    } else {
      newSar = Math.max(newSar, highs[i - 1], i >= 2 ? highs[i - 2] : highs[i - 1])
      if (highs[i] > newSar) {
        // Flip to bull
        isLong = true
        newSar = ep
        ep = highs[i]
        af = afStart
      } else {
        if (lows[i] < ep) { ep = lows[i]; af = Math.min(af + afStep, afMax) }
      }
    }

    sar[i] = newSar
    dir[i] = isLong ? 'bull' : 'bear'
  }

  return { sar, direction: dir }
}

// --- Bollinger Bands ---
export function bollingerBands(closes: number[], period = 20, mult = 2): {
  upper: number[]; middle: number[]; lower: number[]
} {
  const middle = sma(closes, period)
  const upper: number[] = []
  const lower: number[] = []

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { upper.push(NaN); lower.push(NaN); continue }
    let sumSq = 0
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += (closes[j] - middle[i]) ** 2
    }
    const std = Math.sqrt(sumSq / period)
    upper.push(middle[i] + mult * std)
    lower.push(middle[i] - mult * std)
  }
  return { upper, middle, lower }
}

// --- Support / Resistance (pivot-based) ---
export function findSupportResistance(highs: number[], lows: number[], closes: number[], lookback = 20): {
  support: number; resistance: number
} {
  const recentHighs = highs.slice(-lookback)
  const recentLows = lows.slice(-lookback)
  const currentPrice = closes[closes.length - 1]

  // Find local swing highs and lows
  const swingHighs: number[] = []
  const swingLows: number[] = []

  for (let i = 2; i < recentHighs.length - 2; i++) {
    if (recentHighs[i] > recentHighs[i-1] && recentHighs[i] > recentHighs[i-2] &&
        recentHighs[i] > recentHighs[i+1] && recentHighs[i] > recentHighs[i+2]) {
      swingHighs.push(recentHighs[i])
    }
    if (recentLows[i] < recentLows[i-1] && recentLows[i] < recentLows[i-2] &&
        recentLows[i] < recentLows[i+1] && recentLows[i] < recentLows[i+2]) {
      swingLows.push(recentLows[i])
    }
  }

  // Nearest resistance above current price
  const resistances = swingHighs.filter(h => h > currentPrice).sort((a, b) => a - b)
  const supports = swingLows.filter(l => l < currentPrice).sort((a, b) => b - a)

  return {
    support: supports[0] ?? Math.min(...recentLows),
    resistance: resistances[0] ?? Math.max(...recentHighs),
  }
}

// --- Candlestick Patterns ---
export function detectCandlePatterns(opens: number[], highs: number[], lows: number[], closes: number[]): string[] {
  const patterns: string[] = []
  const n = opens.length
  if (n < 3) return patterns

  const i = n - 1
  const body = Math.abs(closes[i] - opens[i])
  const range = highs[i] - lows[i]
  const upperWick = highs[i] - Math.max(opens[i], closes[i])
  const lowerWick = Math.min(opens[i], closes[i]) - lows[i]
  const isBullish = closes[i] > opens[i]

  // Doji
  if (range > 0 && body / range < 0.1) patterns.push('十字星 (Doji)')

  // Hammer
  if (lowerWick > body * 2 && upperWick < body * 0.5 && range > 0) {
    patterns.push(isBullish ? '锤子线 (Hammer)' : '上吊线 (Hanging Man)')
  }

  // Shooting Star
  if (upperWick > body * 2 && lowerWick < body * 0.5 && range > 0) {
    patterns.push('射击之星 (Shooting Star)')
  }

  // Engulfing (need 2 candles)
  if (n >= 2) {
    const prevBody = Math.abs(closes[i-1] - opens[i-1])
    const prevBullish = closes[i-1] > opens[i-1]

    if (isBullish && !prevBullish && body > prevBody && opens[i] <= closes[i-1] && closes[i] >= opens[i-1]) {
      patterns.push('看涨吞没 (Bullish Engulfing)')
    }
    if (!isBullish && prevBullish && body > prevBody && opens[i] >= closes[i-1] && closes[i] <= opens[i-1]) {
      patterns.push('看跌吞没 (Bearish Engulfing)')
    }
  }

  // Three consecutive up/down
  if (n >= 3) {
    if (closes[i] > opens[i] && closes[i-1] > opens[i-1] && closes[i-2] > opens[i-2]) {
      patterns.push('三连阳 (Three White Soldiers)')
    }
    if (closes[i] < opens[i] && closes[i-1] < opens[i-1] && closes[i-2] < opens[i-2]) {
      patterns.push('三连阴 (Three Black Crows)')
    }
  }

  return patterns
}

// --- Percentile ---
export function percentile(arr: number[], value: number): number {
  const sorted = [...arr].filter(v => !isNaN(v)).sort((a, b) => a - b)
  if (sorted.length === 0) return 50
  let count = 0
  for (const v of sorted) { if (v <= value) count++ }
  return (count / sorted.length) * 100
}

// --- Daily Returns ---
export function dailyReturns(closes: number[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i-1]) / closes[i-1])
  }
  return returns
}

// --- Correlation ---
export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 5) return 0
  const ax = a.slice(-n), bx = b.slice(-n)
  const meanA = ax.reduce((s, v) => s + v, 0) / n
  const meanB = bx.reduce((s, v) => s + v, 0) / n
  let cov = 0, varA = 0, varB = 0
  for (let i = 0; i < n; i++) {
    const da = ax[i] - meanA, db = bx[i] - meanB
    cov += da * db
    varA += da * da
    varB += db * db
  }
  const denom = Math.sqrt(varA * varB)
  return denom > 0 ? cov / denom : 0
}
