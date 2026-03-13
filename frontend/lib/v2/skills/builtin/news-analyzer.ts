import type { Skill, MarketSnapshot } from '../../types'

export const newsAnalyzerSkill: Skill = {
  meta: {
    id: 'news-analyzer',
    name: 'News Analyzer',
    version: '1.0.0',
    category: 'data',
    compatibleRoles: ['collector', 'researcher'],
    description: '价格异动 + 成交量突变检测 (替代新闻源)',
  },
  compute(snapshot: MarketSnapshot) {
    // No actual news API — detect anomalies in price/volume as proxy
    const klines = snapshot.klines_1h.slice(-48)
    if (klines.length < 24) {
      return { skillId: 'news-analyzer', data: { alerts: [] }, summary: '数据不足' }
    }

    const alerts: string[] = []
    
    // Volume spike detection
    const volumes = klines.map(k => k.volume)
    const avgVol = volumes.slice(0, -1).reduce((s, v) => s + v, 0) / (volumes.length - 1)
    const lastVol = volumes[volumes.length - 1]
    const volMultiple = avgVol > 0 ? lastVol / avgVol : 1
    if (volMultiple > 3) alerts.push(`成交量飙升 ${volMultiple.toFixed(1)}x (可能有重大消息)`)
    else if (volMultiple > 2) alerts.push(`成交量放大 ${volMultiple.toFixed(1)}x`)

    // Price gap detection
    const lastClose = klines[klines.length - 1].close
    const prevClose = klines[klines.length - 2].close
    const gapPct = prevClose > 0 ? Math.abs(lastClose - prevClose) / prevClose * 100 : 0
    if (gapPct > 3) alerts.push(`价格跳空 ${gapPct.toFixed(1)}% (${lastClose > prevClose ? '上涨' : '下跌'})`)

    // Consecutive direction bars
    let streak = 0
    const dir = klines[klines.length - 1].close > klines[klines.length - 1].open ? 1 : -1
    for (let i = klines.length - 1; i >= 0; i--) {
      const d = klines[i].close > klines[i].open ? 1 : -1
      if (d === dir) streak++
      else break
    }
    if (streak >= 5) alerts.push(`连续${streak}根${dir > 0 ? '阳' : '阴'}线`)

    const urgency = alerts.length >= 2 ? 'high' : alerts.length === 1 ? 'medium' : 'low'

    return {
      skillId: 'news-analyzer',
      data: {
        alerts,
        alert_count: alerts.length,
        vol_multiple: volMultiple,
        price_gap_pct: gapPct,
        consecutive_bars: streak,
        urgency,
      },
      summary: alerts.length > 0 ? `⚠️ ${alerts.join(' | ')}` : '无异常信号',
    }
  },
}
