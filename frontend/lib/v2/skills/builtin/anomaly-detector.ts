import type { Skill, MarketSnapshot } from '../../types'

export const anomalyDetectorSkill: Skill = {
  meta: {
    id: 'anomaly-detector',
    name: 'Anomaly Detector',
    version: '1.0.0',
    category: 'audit',
    compatibleRoles: ['cto', 'collector'],
    description: '价格/成交量异常检测',
  },
  compute(snapshot: MarketSnapshot) {
    const klines = snapshot.klines_1h
    if (klines.length < 50) {
      return { skillId: 'anomaly-detector', data: { anomalies: [] }, summary: '数据不足' }
    }

    const anomalies: string[] = []

    // Volume anomaly (Z-score)
    const volumes = klines.slice(-50).map(k => k.volume)
    const volMean = volumes.reduce((s, v) => s + v, 0) / volumes.length
    const volStd = Math.sqrt(volumes.reduce((s, v) => s + (v - volMean) ** 2, 0) / volumes.length)
    const lastVol = volumes[volumes.length - 1]
    const volZ = volStd > 0 ? (lastVol - volMean) / volStd : 0
    if (Math.abs(volZ) > 3) {
      anomalies.push(`成交量异常 Z=${volZ.toFixed(1)} (${volZ > 0 ? '爆量' : '地量'})`)
    }

    // Price return anomaly
    const closes = klines.slice(-50).map(k => k.close)
    const returns = closes.slice(1).map((c, i) => closes[i] > 0 ? (c - closes[i]) / closes[i] : 0)
    const retMean = returns.reduce((s, r) => s + r, 0) / returns.length
    const retStd = Math.sqrt(returns.reduce((s, r) => s + (r - retMean) ** 2, 0) / returns.length)
    const lastReturn = returns[returns.length - 1] || 0
    const retZ = retStd > 0 ? (lastReturn - retMean) / retStd : 0
    if (Math.abs(retZ) > 2.5) {
      anomalies.push(`价格变动异常 Z=${retZ.toFixed(1)} (${(lastReturn * 100).toFixed(2)}%)`)
    }

    // Wick anomaly (long wicks suggest manipulation/news)
    const lastK = klines[klines.length - 1]
    const body = Math.abs(lastK.close - lastK.open)
    const range = lastK.high - lastK.low
    if (range > 0 && body / range < 0.15 && range / lastK.close > 0.02) {
      anomalies.push('长影线异常 (可能有操纵或重大消息)')
    }

    const severity = anomalies.length >= 2 ? 'critical' : anomalies.length === 1 ? 'warning' : 'normal'

    return {
      skillId: 'anomaly-detector',
      data: {
        anomalies,
        anomaly_count: anomalies.length,
        vol_z_score: volZ,
        return_z_score: retZ,
        severity,
      },
      summary: anomalies.length > 0 ? `🚨 ${anomalies.join(' | ')}` : '✅ 未检测到异常',
    }
  },
}
